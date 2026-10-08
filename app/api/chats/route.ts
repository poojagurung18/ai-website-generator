import { db } from "@/config/db";
import { chatTable } from "@/config/schema";
import { getUserEmail, notFound, ownsFrame, unauthorized } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    try {
        const email = await getUserEmail();
        if (!email) return unauthorized();

        const { messages, frameId, projectId } = await req.json();
        if (!Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
        }
        if (!(await ownsFrame(email, projectId, frameId))) return notFound();

        await db.update(chatTable).set({
            chatMessage: messages
        }).where(and(eq(chatTable.frameId, String(frameId)), eq(chatTable.createdBy, email)));
        return NextResponse.json({ result: 'updated' })
    } catch (error) {
        console.error("PUT /api/chats error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
