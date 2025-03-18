import { request } from "./NetworkUtils.ts";
import { getItem } from "./StorageUtils.ts";

/**
 * Represents a prompt detail including model params, prompts,
 * api-keys, etc (may be included later or now)
 */
interface PromptType {
    prompt: string;
}

const getAIResponse = async (prompt: PromptType): Promise<string> => {
    const model = getItem("model") || "gemini-2.0-flash";

    if (model == "gemini-2.0-flash" ||
        model == "gemini-2.0-pro-experimental" ||
        model == "gemini-2.0-flash-lite" ||
        model == "gemini-2.0-pro-exp-02-05") {
        return getGeminiResponse(prompt);
    } else {
        return "Model not supported for now: " + model;
    }
}


const getGeminiResponse = async (prompt: PromptType): Promise<string> => {
    const model = getItem("model") || "gemini-2.0-flash";
    const apiKey = getItem("apiKey") || "";

    const response = await request(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            method: "POST",
            body: JSON.stringify({
                "contents": [{
                    "parts": [
                        {
                            "text": prompt.prompt,
                        }
                    ],
                }],
            }),
        }
    )

    if (!response.success) {
        return "Failed to fetch: " + response.statusText;
    }

    try {
        const parsedContent = JSON.parse(response.response);
        return parsedContent?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (err) {
        return "Failed to parse response: " + (err as Error).message;
    }
}

export { getAIResponse };