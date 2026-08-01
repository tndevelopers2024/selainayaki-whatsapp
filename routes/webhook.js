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
        
        // Extract phone number from all possible Shopify order locations (Shipping, Billing, Customer profile, Order level)
        let rawPhone = 
            order?.shipping_address?.phone || 
            order?.billing_address?.phone || 
            order?.customer?.phone || 
            order?.phone || 
            order?.customer?.default_address?.phone;

        if (!rawPhone) {
            console.warn("No phone number found in the order data.", order?.id || "");
            return res.status(200).send("No phone number");
        }

        // Remove all non-numeric characters (spaces, +, hyphens, brackets, etc.)
        let phone = rawPhone.replace(/\D/g, "");

        // If it's a standard 10-digit mobile number, automatically prepend '91' for India
        if (phone.length === 10) {
            phone = `91${phone}`;
        }

        // Extract customer first name safely across addresses and customer profile
        const customerName = 
            order?.customer?.first_name || 
            order?.shipping_address?.first_name || 
            order?.billing_address?.first_name || 
            "Customer";

        // 1. Send Order Template
        await sendOrderTemplate(
            phone,
            customerName,
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
