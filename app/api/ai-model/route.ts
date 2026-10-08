import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getUserEmail, notFound, ownsFrame, unauthorized } from "@/lib/auth";
import { WEBSITE_PROMPT } from "@/lib/prompt";

const MAX_INPUT_LENGTH = 4000;

export async function POST(req: NextRequest) {
    try {
        const email = await getUserEmail();
        if (!email) return unauthorized();

        const { userInput, projectId, frameId } = await req.json();
        if (typeof userInput !== "string" || !userInput.trim() || userInput.length > MAX_INPUT_LENGTH) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }
        // Only generate for the user's own frames, so this can't be used as an open LLM proxy
        if (!(await ownsFrame(email, projectId, frameId))) return notFound();

        const messages = [{ role: "user", content: WEBSITE_PROMPT.replace("{userInput}", userInput) }];

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "google/gemini-3.1-flash-lite-preview", // or any OpenRouter-supported model
                messages,
                stream: true, // enable streaming
                max_tokens: 2000,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000", // optional
                    "X-Title": "My Next.js App", // optional
                },
                responseType: "stream", // important for streaming
            }
        );

        const stream = response.data;

        // Return as a web stream so frontend can consume
        const encoder = new TextEncoder();

        const readable = new ReadableStream({
            async start(controller) {
                stream.on("data", (chunk: any) => {
                    const payloads = chunk.toString().split("\n\n");
                    for (const payload of payloads) {
                        if (payload.includes("[DONE]")) {
                            controller.close();
                            return;
                        }
                        if (payload.startsWith("data:")) {
                            try {
                                const data = JSON.parse(payload.replace("data:", ""));
                                const text = data.choices[0]?.delta?.content;
                                if (text) {
                                    controller.enqueue(encoder.encode(text));
                                }
                            } catch (err) {
                                console.error("Error parsing stream", err);
                            }
                        }
                    }
                });

                stream.on("end", () => {
                    controller.close();
                });

                stream.on("error", (err: any) => {
                    console.error("Stream error", err);
                    controller.error(err);
                });
            },
        });

        return new NextResponse(readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}

