require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Middleware to parse JSON bodies (Shopify sends JSON)
app.use(express.json());

// Standalone test endpoint for WhatsApp Cloud API (Postman Testing)
app.post("/api/whatsapp/order-confirmation", async (req, res) => {
  try {
    const { 
      phone, 
      customerName, 
      orderId, 
      productName = "Kanjivaram Silk Saree", 
      totalAmount = "1499", 
      imageUrl = "https://selainayaki.com/cdn/shop/files/logo.png" 
    } = req.body;

    if (!phone || !customerName || !orderId) {
      return res.status(400).json({
        success: false,
        message: "phone, customerName and orderId are required",
      });
    }

    // Remove +, spaces, -, brackets etc.
    const formattedPhone = String(phone).replace(/\D/g, "");

    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v23.0";
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "order_confirmation_with_image";
    const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

    const url =
      `https://graph.facebook.com/` +
      `${apiVersion}/` +
      `${phoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",

      template: {
        name: templateName,

        language: {
          code: templateLang,
        },

        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: imageUrl,
                },
              },
            ],
          },
          {
            type: "body",

            parameters: [
              {
                type: "text",
                text: String(customerName),
              },
              {
                type: "text",
                text: String(orderId),
              },
              {
                type: "text",
                text: String(productName),
              },
              {
                type: "text",
                text: String(totalAmount),
              },
            ],
          },
        ],
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json({
      success: true,
      message: "WhatsApp message sent successfully",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "WhatsApp Error:",
      error.response?.data || error.message
    );

    return res.status(
      error.response?.status || 500
    ).json({
      success: false,
      message: "Failed to send WhatsApp message",
      error: error.response?.data || error.message,
    });
  }
});

// Routes
// We mount webhook routes at /api/webhooks
// So the shopify webhook URL will be: https://<your-domain>/api/webhooks/orders/create
app.use('/api/webhooks', webhookRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Server is running and ready to receive webhooks.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
