import axios from 'axios';

/**
 * Telegram Webhook Setup Script
 * Updated for the new secure proxy architecture.
 */
async function setWebhook() {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET;
    const PROD_URL = "https://vaaniai.vercel.app"; // Fallback to production domain

    console.log("🛠️ Starting Webhook Repair...");

    if (!BOT_TOKEN) {
        console.error('❌ Missing TELEGRAM_BOT_TOKEN');
        process.exit(1);
    }

    const webhookUrl = `${PROD_URL}/api/v1/telegram`;
    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;

    try {
        console.log(`📡 Sending request to Telegram...`);
        const response = await axios.post(tgUrl, {
            url: webhookUrl,
            secret_token: SECRET_TOKEN || undefined,
            allowed_updates: ['message', 'edited_message']
        });

        if (response.data.ok) {
            console.log(`✅ Webhook SUCCESS: ${webhookUrl}`);
            if (SECRET_TOKEN) console.log(`🔒 Secret verification enabled.`);
        } else {
            console.error('❌ Webhook FAILED:', response.data.description);
        }
    } catch (error: any) {
        console.error('❌ Network Error:', error.message);
    }
}

setWebhook();
