import { groq } from "../config/aiConfig";

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

export const getChatResponse = async (messages: any[], context: { balance: number, recentTransactions: any[], goals?: any[] }) => {
    try {
        const goalsContext = context.goals && context.goals.length > 0
            ? `Active Financial Goals: ${JSON.stringify(context.goals.map(g => ({ name: g.name, target: g.targetPrice })))}`
            : "No active financial goals set.";

        const systemPrompt = `
            You are Montra AI, a personal financial assistant for the Expense Tracker app.
            Your goal is to help users manage their money, provide spending insights, and offer budgeting advice.
            
            Current Financial Context:
            - Current Balance: PKR ${context.balance.toLocaleString()}
            - Recent Transactions: ${JSON.stringify(context.recentTransactions)}
            - ${goalsContext}
            
            Instructions:
            1. Be helpful, professional, and empathetic.
            2. Use the provided financial context to answer specific questions about spending.
            3. Keep advice practical and locally relevant (Pakistan context).
            4. Use PKR for all currency references.
            5. If asked about buying something, recommend checking the "Market" tab.
            6. CRITICAL: If a user has a goal, proactively offer advice on how to reach it faster based on their current balance and transactions.
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
        const prompt = `
            Current Spend this Month: PKR ${currentTotal.toLocaleString()}
            Recent Transactions: ${JSON.stringify(recentTransactions.slice(0, 20))}
            
            Based on these spending patterns and the current day of the month, project the total spend for the full month.
            Provide a narrative forecast (2 sentences) and a projected total.
            Return JSON: { "projectedTotal": number, "narrative": "string" }.
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
        console.error("Groq Forecast Error:", error);
        return null;
    }
};
