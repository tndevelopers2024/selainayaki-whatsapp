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

        // Extract customer first and last name safely across addresses and customer profile
        const firstName = order?.customer?.first_name || order?.shipping_address?.first_name || order?.billing_address?.first_name || "";
        const lastName = order?.customer?.last_name || order?.shipping_address?.last_name || order?.billing_address?.last_name || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Valued Customer";

        // Extract product name and image URL from the order line items
        let productName = "Ordered Items";
        let productImageUrl = null;

        if (order.line_items && order.line_items.length > 0) {
            const firstProduct = order.line_items[0];
            productName = firstProduct.name || firstProduct.title || "Ordered Item";
            if (order.line_items.length > 1) {
                productName += ` (+${order.line_items.length - 1} more)`;
            }
            productImageUrl = firstProduct.image?.src || firstProduct.image_url || null;
        }

        // 1. Send Order Confirmation Template with Image & Full Name
        await sendOrderTemplate(
            phone,
            fullName,
            order.order_number || order.id || "001",
            productName,
            order.total_price || "0.00",
            productImageUrl
        );

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
