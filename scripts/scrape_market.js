/**
 * MARKET SCRAPER SCRIPT 🕷️
 * 
 * Usage: node scripts/scrape_market.js
 * Dependencies: npm install puppeteer firebase-admin dotenv
 */

const puppeteer = require('puppeteer');
const admin = require('firebase-admin');
require('dotenv').config();

// --- CONFIGURATION ---
// In a real scenario, we would load the service account from a JSON file or ENV variable
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './ensetracker-5d277-firebase-adminsdk-fbsvc-085314b73c.json';

async function initFirebase() {
    try {
        // Check if app is already initialized
        if (admin.apps.length === 0) {
            // Note: If running on a server (like Render/Heroku/Google Cloud), 
            // the credentials might be auto-detected without this file if configured correctly.
            // For local dev, we need the JSON key.
            admin.initializeApp({
                credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH))
            });
            console.log("🔥 Firebase Admin Initialized");
        }
    } catch (error) {
        console.warn(`⚠️ Could not init Firebase: ${error.message}`);
        console.warn("   Running in DRY RUN mode (no database writes).");
        return false; // Return false to indicate Dry Run
    }
    return true;
}

async function scrapeMarket() {
    console.log("Starting Scraper...");
    const hasDb = await initFirebase();

    // 1. Launch Browser
    const browser = await puppeteer.launch({ headless: "new" });
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

    // Fallback if DB failed or empty
    if (products.length === 0) {
        console.log("Using Mock Data (DB empty or not connected)");
        products = [
            { name: "Mock ITEL", productUrl: 'https://priceoye.pk/mobiles/itel/itel-super-s26-ultra' }
        ];
    }

    // 3. Iterate and Scrape
    for (const product of products) {
        if (!product.productUrl) continue;

        console.log(`\n🕷️ Visiting: ${product.name}`);
        try {
            // timeout: 30s to avoid hanging forever
            await page.goto(product.productUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            const priceText = await page.evaluate(() => {
                // Strategy 1: Meta Tag (Preferred/Standard)
                // <meta property="product:price:amount" content="44999"/>
                const meta = document.querySelector('meta[property="product:price:amount"]');
                if (meta) return meta.content;

                // Strategy 2: PriceOye specific class
                const el = document.querySelector('.summary-price');
                return el ? el.innerText.replace(/,/g, '').trim() : null;
            });

            if (priceText) {
                const price = parseInt(priceText);
                console.log(`✅ Price found: ${price}`);

                // Update Database
                if (hasDb) {
                    await admin.firestore().collection('market_products').doc(product.id).update({
                        price: price,
                        lastUpdated: new Date().toISOString()
                    });
                    console.log("💾 Database Updated");
                }
            } else {
                console.log("❌ Could not find price on page.");
            }

        } catch (err) {
            console.error(`⚠️ Failed to scrape ${product.name}: ${err.message}`);
        }
    }

    await browser.close();
    console.log("\n🎉 Scraping Run Complete.");
}

scrapeMarket();
