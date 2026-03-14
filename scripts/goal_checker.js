/**
 * GOAL CHECKER SCRIPT 🎯
 * This script compares user savings with current market prices.
 * Usage: node /home/node/scripts/goal_checker.js
 */

const admin = require('firebase-admin');
require('dotenv').config();

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/home/node/scripts/service-account.json';

async function initFirebase() {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(require(SERVICE_ACCOUNT_PATH))
        });
        console.log("🔥 Firebase Admin Initialized");
    }
}

async function checkGoals() {
    console.log(`\n--- Starting Goal Check at ${new Date().toLocaleString()} ---`);
    await initFirebase();
    const db = admin.firestore();

    try {
        // 1. Fetch all active goals
        const goalsSnapshot = await db.collection('savings_goals')
            .where('status', '==', 'active')
            .get();

        if (goalsSnapshot.empty) {
            console.log("No active goals found.");
            return;
        }

        console.log(`Checking ${goalsSnapshot.size} active goals...`);

        // 2. Fetch all market products for price matching
        const marketSnapshot = await db.collection('market_products').get();
        const marketData = {};
        marketSnapshot.forEach(doc => {
            const data = doc.data();
            marketData[doc.id] = data;
        });

        const batch = db.batch();
        let updateCount = 0;

        for (const goalDoc of goalsSnapshot.docs) {
            const goal = goalDoc.data();
            const goalId = goalDoc.id;

            // Simple matching by finding a product in the same category that is "close" in name
            // or just finding the cheapest product in that category if specific naming isn't available
            
            // For now, let's try to find an exact or close name match in the market_products
            const productsInCategory = Object.values(marketData).filter(p => p.category === goal.category);
            
            // Find the best price match (cheapest option for that category or closest name)
            // If the user pasted a specific URL, we can match by comparing URLs if we had them saved
            let currentMarketPrice = goal.marketPrice; // Default to the price when goal was created

            const matchedProduct = productsInCategory.find(p => 
                p.name.toLowerCase().includes(goal.title.toLowerCase()) || 
                goal.title.toLowerCase().includes(p.name.toLowerCase())
            );

            if (matchedProduct) {
                currentMarketPrice = matchedProduct.price;
                console.log(`Matched [${goal.title}] with market item: ${matchedProduct.name} (PKR ${currentMarketPrice})`);
            }

            // check if goal met
            const isGoalMet = goal.savedAmount >= currentMarketPrice || goal.savedAmount >= goal.targetAmount;

            const updateData = {
                marketPrice: currentMarketPrice,
                lastPriceUpdate: new Date().toISOString()
            };

            if (isGoalMet) {
                updateData.status = 'completed';
                console.log(`🎯 GOAL MET: ${goal.title} for user ${goal.uid}!`);
                
                // Here we would also trigger a notification record
                await db.collection('notifications').add({
                    uid: goal.uid,
                    title: "Goal Reached! 🚀",
                    body: `Congratulations! You have saved enough for your ${goal.title}.`,
                    type: "goal_reached",
                    createdAt: new Date().toISOString(),
                    isRead: false
                });
            }

            batch.update(goalDoc.ref, updateData);
            updateCount++;
        }

        if (updateCount > 0) {
            await batch.commit();
            console.log(`Successfully updated ${updateCount} goals.`);
        }

    } catch (error) {
        console.error("❌ Goal Checker Error:", error);
    } finally {
        console.log("--- Goal Check Complete ---\n");
        process.exit(0);
    }
}

checkGoals();
