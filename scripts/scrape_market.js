/**
 * MARKET SCRAPER SCRIPT 🕷️
 * * Usage: node /home/node/scripts/scrape_market.js
 */

const puppeteer = require('puppeteer');
const admin = require('firebase-admin');
require('dotenv').config();

// --- CONFIGURATION ---
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/home/node/scripts/service-account.json';

async function initFirebase() {
    try {
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH))
            });
            console.log("🔥 Firebase Admin Initialized");
        }
    } catch (error) {
        console.warn(`⚠️ Could not init Firebase: ${error.message}`);
        console.warn("   Running in DRY RUN mode (no database writes).");
        return false;
    }
    return true;
}

async function scrapeMarket() {
    console.log(`\n--- Starting Scraper at ${new Date().toLocaleString()} ---`);
    const hasDb = await initFirebase();
    let browser;

    try {
        // 1. Launch Browser (CRITICAL DOCKER FIXES ADDED HERE)
        console.log("Launching Chromium inside Docker...");
        // 1. Launch Browser (CRITICAL DOCKER FIXES ADDED HERE)
        console.log("Launching Chromium inside Docker...");
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: true, // Changed from "new" to true for Alpine compatibility
            pipe: true,     // <--- THE MAGIC FIX: Bypasses the WebSocket timeout completely
            dumpio: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-dev-tools',
                '--disable-features=dbus' // <--- Stops Chromium from looking for a desktop environment
            ]
        });
        const page = await browser.newPage();

        // 2. Fetch Products to Scrape
        let products = [];
        if (hasDb) {
            try {
                console.log("Fetching products from Firestore...");
                const snapshot = await admin.firestore().collection('market_products').get();
                products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(`Fetched ${products.length} products.`);
            } catch (e) {
                console.error("Error fetching from Firestore:", e);
            }
        }

        // Fallback Mock Data
        if (products.length === 0) {
            console.log("Using Mock Data (DB empty or not connected)");
            products = [
                { id: "mock_123", name: "Mock ITEL", productUrl: 'https://priceoye.pk/mobiles/itel/itel-super-s26-ultra' }
            ];
        }

        // 3. Iterate and Scrape
        for (const product of products) {
            if (!product.productUrl) continue;

            console.log(`\n🕷️ Visiting: ${product.name}`);
            try {
                await page.goto(product.productUrl, { waitUntil: 'networkidle2', timeout: 30000 });

                await page.waitForSelector('.summary-price', { timeout: 5000 })
                    .catch(() => console.log("⚠️ `.summary-price` element didn't load in time, trying fallback..."));

                const priceText = await page.evaluate(() => {
                    const meta = document.querySelector('meta[property="product:price:amount"]');
                    if (meta) return meta.content;

                    const el = document.querySelector('.summary-price');
                    return el ? el.innerText.replace(/,/g, '').trim() : null;
                });

                if (priceText) {
                    // This Regex strips out EVERYTHING except raw numbers
                    const cleanPriceString = String(priceText).replace(/[^0-9]/g, '');
                    const price = parseInt(cleanPriceString, 10);

                    // Make sure it's actually a valid number before saving to DB
                    if (!isNaN(price) && price > 0) {
                        console.log(`✅ Price found: Rs ${price}`);

                        if (hasDb && product.id !== "mock_123") {
                            await admin.firestore().collection('market_products').doc(product.id).update({
                                price: price,
                                lastUpdated: new Date().toISOString()
                            });
                            console.log("💾 Database Updated");
                        }
                    } else {
                        console.log(`❌ Found text, but couldn't parse number from: ${priceText}`);
                    }
                } else {
                    console.log("❌ Could not find price on page.");
                }

            } catch (err) {
                console.error(`⚠️ Failed to scrape ${product.name}: ${err.message}`);
            }
        }
    } catch (fatalError) {
        console.error("❌ Fatal Scraper Error:", fatalError);
    } finally {
        if (browser) {
            await browser.close();
            console.log("🗑️ Browser closed safely.");
        }
        console.log("🎉 Scraping Run Complete.\n");

        // CRITICAL FIX: Tell the n8n Execute Command node that the script is 100% finished
        process.exit(0);
    }
}

// INSTANTLY RUN THE FUNCTION INSTEAD OF WAITING FOR CRON
scrapeMarket();