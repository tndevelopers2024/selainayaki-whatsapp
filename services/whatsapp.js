const axios = require("axios");

const token = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;
const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "test_order_received";
const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

async function sendOrderTemplate(to, customerName, orderNumber, total) {
    await axios.post(
        `https://graph.facebook.com/v23.0/${phoneId}/messages`,
        {
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
                name: templateName,
                language: {
                    code: templateLanguage
                },
                components: [
                    {
                        type: "body",
                        parameters: [
                            {
                                type: "text",
                                text: String(customerName)
                            },
                            {
                                type: "text",
                                text: String(orderNumber)
                            }
                        ]
                    }
                ]
            }
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

async function sendProductImage(to, imageUrl, caption) {
    await axios.post(
        `https://graph.facebook.com/v23.0/${phoneId}/messages`,
        {
            messaging_product: "whatsapp",
            to,
            type: "image",
            image: {
                link: imageUrl,
                caption: caption
            }
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

async function sendTracking(to, orderUrl) {
    await axios.post(
        `https://graph.facebook.com/v23.0/${phoneId}/messages`,
        {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: {
                body: `Track your order:\n${orderUrl}`
            }
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

module.exports = {
    sendOrderTemplate,
    sendProductImage,
    sendTracking
};
