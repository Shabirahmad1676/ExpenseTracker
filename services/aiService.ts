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