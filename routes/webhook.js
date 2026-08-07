const express = require("express");
const axios = require("axios");
const router = express.Router();

const {
    sendOrderTemplate,
    sendOrderShippedTemplate,
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

            // Why the logo previously appeared: Shopify's standard order creation webhook omits product images from line_items!
            // Fix: Dynamically fetch the actual product picture directly from Shopify's fast public store API using Product ID or Title!
            if (!productImageUrl && (firstProduct.product_id || firstProduct.title)) {
                try {
                    const shopDomain = req.get("X-Shopify-Shop-Domain") || "selainayaki.com";
                    let searchUrl = `https://${shopDomain}/search/suggest.json?q=id:${firstProduct.product_id}&resources[type]=product`;
                    let searchRes = await axios.get(searchUrl);
                    let foundProducts = searchRes?.data?.resources?.results?.products;

                    // If searching by product ID didn't match, fallback to searching by product title
                    if (!foundProducts || foundProducts.length === 0) {
                        searchUrl = `https://${shopDomain}/search/suggest.json?q=${encodeURIComponent(firstProduct.title)}&resources[type]=product`;
                        searchRes = await axios.get(searchUrl);
                        foundProducts = searchRes?.data?.resources?.results?.products;
                    }

                    if (foundProducts && foundProducts.length > 0 && foundProducts[0].image) {
                        productImageUrl = foundProducts[0].image;
                        // Handle Shopify CDN protocol-relative URLs (e.g., //cdn.shopify.com/...)
                        if (productImageUrl.startsWith("//")) {
                            productImageUrl = `https:${productImageUrl}`;
                        }
                    }
                } catch (imgErr) {
                    console.error("Could not dynamically fetch product image from Shopify:", imgErr.message);
                }
            }
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

router.post("/orders/fulfilled", async (req, res) => {
    try {
        const order = req.body;
        
        // Extract phone number from all possible Shopify order locations
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

        // Extract customer first and last name safely
        const firstName = order?.customer?.first_name || order?.shipping_address?.first_name || order?.billing_address?.first_name || "";
        const lastName = order?.customer?.last_name || order?.shipping_address?.last_name || order?.billing_address?.last_name || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Valued Customer";

        // Extract product name
        let productName = "Ordered Items";
        if (order.line_items && order.line_items.length > 0) {
            const firstProduct = order.line_items[0];
            productName = firstProduct.name || firstProduct.title || "Ordered Item";
            if (order.line_items.length > 1) {
                productName += ` (+${order.line_items.length - 1} more)`;
            }
        }

        // 2. Send Order Shipped Template
        await sendOrderShippedTemplate(
            phone,
            fullName,
            order.order_number || order.id || "001",
            productName,
            order.total_price || "0.00"
        );

        res.sendStatus(200);
    } catch (error) {
        console.error("Error processing fulfilled webhook:", error.response ? error.response.data : error.message);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
