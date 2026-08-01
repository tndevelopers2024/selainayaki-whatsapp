const express = require("express");
const router = express.Router();

const {
    sendOrderTemplate,
    sendProductImage,
    sendTracking
} = require("../services/whatsapp");

router.post("/orders/create", async (req, res) => {
    try {
        const order = req.body;
        
        // Validation: Verify if customer and phone exist
        if (!order || !order.customer || !order.customer.phone) {
            console.warn("No phone number found in the order data.", order.id);
            return res.status(200).send("No phone number");
        }

        const phone = order.customer.phone.replace("+", "");

        // 1. Send Order Template
        await sendOrderTemplate(
            phone,
            order.customer.first_name || "Customer",
            order.order_number,
            order.total_price
        );

        // 2. Send Product Image (if available)
        if (order.line_items && order.line_items.length > 0) {
            const firstProduct = order.line_items[0];
            // Shopify image structure checking, sometimes 'image' might not be populated or 'src' might not exist directly under 'image' depending on the exact webhook payload. But based on the provided code, we'll try this structure.
            const productImageUrl = firstProduct.image ? firstProduct.image.src : null;
            if (productImageUrl) {
                await sendProductImage(
                    phone,
                    productImageUrl,
                    firstProduct.title || "Product"
                );
            }
        }

        // 3. Send Tracking Link
        if (order.order_status_url) {
            await sendTracking(
                phone,
                order.order_status_url
            );
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("Error processing webhook:", error.response ? error.response.data : error.message);
        // It's important to respond with 2xx to Shopify to acknowledge receipt, otherwise they retry repeatedly
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
