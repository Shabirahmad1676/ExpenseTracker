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

export const getChatResponse = async (messages: any[], context: { balance: number, recentTransactions: any[] }) => {
    try {
        const systemPrompt = `
            You are Montra AI, a personal financial assistant for the Expense Tracker app.
            Your goal is to help users manage their money, provide spending insights, and offer budgeting advice.
            
            Current Financial Context:
            - Current Balance: PKR ${context.balance.toLocaleString()}
            - Recent Transactions: ${JSON.stringify(context.recentTransactions)}
            
            Instructions:
            1. Be helpful, professional, and empathetic.
            2. Use the provided financial context to answer specific questions about spending.
            3. Keep advice practical and locally relevant (Pakistan context).
            4. Use PKR for all currency references.
            5. If asked about buying something, recommend checking the "Market" tab.
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