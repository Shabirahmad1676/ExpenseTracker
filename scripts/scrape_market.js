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

async function scrapeCatalog(category, targetUrl) {
    console.log(`\n--- Starting Scraper for [${category}] at ${new Date().toLocaleString()} ---`);
    const hasDb = await initFirebase();
    let browser;

    try {
        console.log("Launching Chromium...");
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: true,
            pipe: true,
            dumpio: false, // Cleaner logs
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
        console.log(`🕷️ Visiting Category Page: ${targetUrl}`);

        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // Scrape the grid
        const scrapedProducts = await page.evaluate(() => {
            const products = [];
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

        console.log(`🎉 Discovered ${scrapedProducts.length} products in ${category}!`);

        if (scrapedProducts.length > 0 && hasDb) {
            const batch = admin.firestore().batch();
            const collectionRef = admin.firestore().collection('market_products');
            let validCount = 0;

            for (const item of scrapedProducts) {
                const cleanPriceString = String(item.priceText).replace(/[^0-9]/g, '');
                const price = parseInt(cleanPriceString, 10);

                if (!isNaN(price) && price > 0) {
                    const safeId = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                    const docRef = collectionRef.doc(safeId);

                    batch.set(docRef, {
                        name: item.name,
                        price: price,
                        category: category,
                        productUrl: item.productUrl,
                        imageUrl: item.imageUrl || null,
                        lastUpdated: new Date().toISOString()
                    }, { merge: true });

                    validCount++;
                }
            }

            console.log(`💾 Committing ${validCount} products to Firestore...`);
            await batch.commit();
            console.log(`✅ ${category} updated!`);
        }

    } catch (fatalError) {
        console.error(`❌ Fatal Error in ${category}:`, fatalError);
    } finally {
        if (browser) await browser.close();
    }
}

async function runAll() {
    const categories = [
        { name: 'mobiles', url: 'https://priceoye.pk/mobiles' },
        { name: 'washing-machines', url: 'https://priceoye.pk/washing-machines' },
        { name: 'air-conditioners', url: 'https://priceoye.pk/air-conditioners' },
        { name: 'tablets', url: 'https://priceoye.pk/tablets' }
    ];

    for (const cat of categories) {
        await scrapeCatalog(cat.name, cat.url);
    }
    console.log("\n🚀 All categories processed.");
    process.exit(0);
}

runAll();