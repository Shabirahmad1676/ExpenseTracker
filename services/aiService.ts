import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { groq } from "../config/aiConfig";
import { firestore } from "../config/firebase";

export const parseTransactionWithGroq = async (text: string) => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expense tracker parser. Return ONLY JSON object with fields: title, amount (number), type (income/expense). No markdown."
                },
                {
                    role: "user",
                    content: text
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" }
        });

        let content = completion.choices[0]?.message?.content || "{}";
        if (content.includes("```")) {
            content = content.replace(/```json/g, "").replace(/```/g, "").trim();
        }
        return JSON.parse(content);
    } catch (error) {
        console.error("Groq Transaction Error:", error);
        return null;
    }
};

export const parseReceiptWithGroq = async (imageBase64: string) => {
    try {
        // User's custom implementation with fetch and Llama 4
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.2-11b-vision-preview', // Reverted to Vision model for safety, as Llama 4 is text-only usually
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analyze this receipt. Return ONLY a valid JSON object with these fields: title (store name), amount (number), date (string), type (always \'expense\'). No markdown.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        let content = data.choices[0]?.message?.content || "{}";

        if (content.includes("```")) {
            content = content.replace(/```json/g, "").replace(/```/g, "").trim();
        }

        return JSON.parse(content);
    } catch (error) {
        console.error("Groq Vision Error:", error);
        return null;
    }
};

export const parseProductDetails = async (htmlChunk: string) => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an e-commerce scraper. Extract the product Name, Price (number only), and Image URL from the HTML snippet. Return JSON: { name, price, image }."
                },
                {
                    role: "user",
                    content: htmlChunk.substring(0, 15000) // Safety truncation
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" }
        });

        let content = completion.choices[0]?.message?.content || "{}";
        if (content.includes("```")) {
            content = content.replace(/```json/g, "").replace(/```/g, "").trim();
        }
        return JSON.parse(content);
    } catch (error) {
        console.error("Groq Product Parse Error:", error);
        return null;
    }
};

export const getMarketProducts = async (limitCount: number = 10) => {
    try {
        const q = query(
            collection(firestore, "market_products"),
            orderBy("lastUpdated", "desc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching market products:", error);
        return [];
    }
};

export const getChatResponse = async (messages: any[], context: { 
    balance: number, 
    recentTransactions: any[], 
    goals?: any[],
    marketProducts?: any[]
}) => {
    try {
        const goalsContext = context.goals && context.goals.length > 0
            ? `Active Financial Goals: ${JSON.stringify(context.goals.map(g => ({ name: g.title || g.name, target: g.targetAmount || g.targetPrice, saved: g.savedAmount || 0 })))}`
            : "No active financial goals set.";

        const marketContext = context.marketProducts && context.marketProducts.length > 0
            ? `Real-time Market Prices (PriceOye): ${JSON.stringify(context.marketProducts.map(p => ({ name: p.name, price: p.price, category: p.category })))}`
            : "Market data currently unavailable.";

        const systemPrompt = `
            You are Montra AI, a personal financial assistant for the Expense Tracker app in Pakistan.
            Your goal is to help users manage their money, provide spending insights, and offer budgeting advice.
            
            Current Financial Context:
            - Current Balance: PKR ${context.balance.toLocaleString()}
            - Recent Transactions: ${JSON.stringify(context.recentTransactions)}
            - ${goalsContext}
            - ${marketContext}
            
            Instructions:
            1. Be helpful, professional, and empathetic.
            2. Use the provided financial context (balance, history, goals) to answer specific questions.
            3. Use the Market context (PriceOye data) to answer questions about product prices, value for money, and affordability.
            4. If a user asks "Can I afford X?", compare its market price with their balance and current savings progress.
            5. Keep advice practical and locally relevant to Pakistan.
            6. Use PKR for all currency references.
            7. Proactively suggest setting a "Savings Goal" or "Sinking Fund" if they want something they cannot afford yet.
            8. If they have an active goal, give them a status update if they ask about their budget.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });

        return completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
    } catch (error) {
        console.error("Groq Chat Error:", error);
        return "I'm having trouble connecting to my brain right now. Please try again later!";
    }
};

export const autoCategorizeExpense = async (merchant: string, amount: number) => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Categorize this expense based on the merchant name and amount. Reply with exactly one word from this list: Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other."
                },
                {
                    role: "user",
                    content: `Merchant: ${merchant}, Amount: ${amount}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
        });

        return completion.choices[0]?.message?.content?.trim() || "Other";
    } catch (error) {
        console.error("Groq Categorization Error:", error);
        return "Other";
    }
};

export const detectAnomaly = async (newTx: { title: string, amount: number, category: string }, history: any[]) => {
    try {
        const prompt = `
            New Transaction: ${JSON.stringify(newTx)}
            History for this category (${newTx.category}): ${JSON.stringify(history)}
            
            Compare the new transaction to the user's history. Is it significantly higher (at least 2x average) or unusual for this user?
            Return JSON: { "isAnomaly": boolean, "reason": "string explaining why" }.
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(content);
    } catch (error) {
        console.error("Groq Anomaly Error:", error);
        return { isAnomaly: false };
    }
};

export const getSpendForecasting = async (recentTransactions: any[], currentTotal: number) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const prompt = `
            Today's Date: ${today}
            Current Spend this Month: PKR ${currentTotal.toLocaleString()}
            Recent Transactions (last 20): ${JSON.stringify(recentTransactions.slice(0, 20))}
            
            Instructions:
            1. Based on the current date, calculate/forecast the total projected spend for the entire month.
            2. Result must be ONLY a valid JSON object.
            3. The 'projectedTotal' MUST be a single integer or float number.
            4. DO NOT use mathematical expressions, formulas, or strings in 'projectedTotal'.
            
            Return JSON: { "projectedTotal": number, "narrative": "string" }.
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: "You are a budgeting expert. Return ONLY JSON. No explanations outside the JSON block." }, { role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(content);
    } catch (error) {
        console.error("Groq Forecast Error:", error);
        return null;
    }
};
