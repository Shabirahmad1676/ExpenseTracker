/**
 * CATALOG SCRAPER SCRIPT 🕷️
 * Usage: node /home/node/scripts/scrape_market.js
 */

const puppeteer = require('puppeteer');
const admin = require('firebase-admin');
require('dotenv').config();

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
        return false;
    }
    return true;
}

async function scrapeCatalog() {
    console.log(`\n--- Starting Catalog Scraper at ${new Date().toLocaleString()} ---`);
    const hasDb = await initFirebase();
    let browser;

    try {
        console.log("Launching Chromium inside Docker...");
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: true,
            pipe: true,
            dumpio: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-dev-tools',
                '--disable-features=dbus'
            ]
        });
        const page = await browser.newPage();

        // 1. Visit the main Category Page instead of individual products
        const targetUrl = 'https://priceoye.pk/mobiles';
        console.log(`\n🕷️ Visiting Category Page: ${targetUrl}`);

        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // 2. Scrape the entire grid of products in one go
        console.log("Extracting product grid...");
        const scrapedProducts = await page.evaluate(() => {
            const products = [];
            // Note: These selectors (.productBox, .p-title, .price-box) are generic guesses. 
            // We may need to inspect the live website to get the exact HTML classes!
            const productCards = document.querySelectorAll('.productBox, .product-item, [data-product-id]');

            productCards.forEach(card => {
                const nameEl = card.querySelector('.p-title, .product-name, h3');
                const priceEl = card.querySelector('.price-box, .price, .summary-price');
                const linkEl = card.querySelector('a');

                const imgEl = card.querySelector('img');
                const imageUrl = imgEl ? (imgEl.src || imgEl.getAttribute('data-src')) : null;

                if (nameEl && priceEl) {
                    products.push({
                        name: nameEl.innerText.trim(),
                        priceText: priceEl.innerText.trim(),
                        productUrl: linkEl ? linkEl.href : null,
                        imageUrl: imageUrl,
                    });
                }
            });
            return products;
        });

        console.log(`🎉 Discovered ${scrapedProducts.length} products on the page!`);

        // 3. Clean the data and push to Firebase
        if (scrapedProducts.length > 0 && hasDb) {
            const batch = admin.firestore().batch();
            const collectionRef = admin.firestore().collection('market_products');
            let validCount = 0;

            for (const item of scrapedProducts) {
                // Strip the "Rs" and commas
                const cleanPriceString = String(item.priceText).replace(/[^0-9]/g, '');
                const price = parseInt(cleanPriceString, 10);

                if (!isNaN(price) && price > 0) {
                    // Create a safe document ID from the product name (e.g., "iphone-15-pro")
                    const safeId = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

                    const docRef = collectionRef.doc(safeId);

                    // Merge: true is critical! It creates the product if it's new, or just updates it if it exists
                    batch.set(docRef, {
                        name: item.name,
                        price: price,
                        productUrl: item.productUrl,
                        imageUrl: item.imageUrl || null,
                        lastUpdated: new Date().toISOString()
                    }, { merge: true });

                    validCount++;
                }
            }

            console.log(`💾 Committing ${validCount} clean products to Firestore in one batch...`);
            await batch.commit();
            console.log("✅ Database successfully updated with entire catalog!");
        }

    } catch (fatalError) {
        console.error("❌ Fatal Scraper Error:", fatalError);
    } finally {
        if (browser) {
            await browser.close();
            console.log("🗑️ Browser closed safely.");
        }
        console.log("🎉 Catalog Scraping Run Complete.\n");
        process.exit(0);
    }
}

scrapeCatalog();