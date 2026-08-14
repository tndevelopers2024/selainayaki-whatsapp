const axios = require("axios");

const token = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;
const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "order_confirmation_with_image_v2";
const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

async function sendOrderTemplate(to, customerName, orderNumber, productName, total, imageUrl) {
    // Provide a fallback brand image URL in case the product has no photo attached
    const defaultImage = "https://selainayaki.com/cdn/shop/files/logo.png";
    const validImageUrl = imageUrl || defaultImage;

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
                        type: "header",
                        parameters: [
                            {
                                type: "image",
                                image: {
                                    link: validImageUrl
                                }
                            }
                        ]
                    },
                    {
                        type: "body",
                        parameters: [
                            {
                                type: "text",
                                text: String(customerName)
                            },
                            {
                                type: "text",
                                text: String(productName)
                            },
                            {
                                type: "text",
                                text: String(orderNumber)
                            },
                            {
                                type: "text",
                                text: String(total)
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

async function sendOrderShippedTemplate(to, customerName, orderNumber, productName, total) {
    await axios.post(
        `https://graph.facebook.com/v23.0/${phoneId}/messages`,
        {
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
                name: "order_shipped",
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
                            },
                            {
                                type: "text",
                                text: String(productName)
                            },
                            {
                                type: "text",
                                text: String(total)
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

async function sendOrderShippedTrackingTemplate(to, customerName, orderNumber, productName, carrier, trackingNumber, trackingUrl) {
    await axios.post(
        `https://graph.facebook.com/v23.0/${phoneId}/messages`,
        {
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
                name: "order_shipped_tracking",
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
                            },
                            {
                                type: "text",
                                text: String(productName)
                            },
                            {
                                type: "text",
                                text: String(carrier)
                            },
                            {
                                type: "text",
                                text: String(trackingNumber)
                            },
                            {
                                type: "text",
                                text: String(trackingUrl)
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

module.exports = {
    sendOrderTemplate,
    sendOrderShippedTemplate,
    sendOrderShippedTrackingTemplate,
    sendProductImage,
    sendTracking
};
