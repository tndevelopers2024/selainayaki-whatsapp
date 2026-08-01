const axios = require("axios");

const token = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;

async function sendOrderTemplate(to, customerName, orderNumber, total) {
    await axios.post(
        `https://graph.facebook.com/v23.0/${phoneId}/messages`,
        {
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
                name: "order_confirmation",
                language: {
                    code: "en"
                },
                components: [
                    {
                        type: "body",
                        parameters: [
                            {
                                type: "text",
                                text: customerName
                            },
                            {
                                type: "text",
                                text: orderNumber
                            },
                            {
                                type: "text",
                                text: total
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
