import { db } from "@/config/db";
import { chatTable, frameTable, projectTable, usersTable } from "@/config/schema";
import { getUserEmail, unauthorized } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, sql } from "drizzle-orm";

const MAX_INPUT_LENGTH = 4000;

export async function POST(req: NextRequest) {
    try {
        const email = await getUserEmail();
        if (!email) return unauthorized();

        const { userInput } = await req.json();
        if (typeof userInput !== "string" || !userInput.trim() || userInput.length > MAX_INPUT_LENGTH) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const { has } = await auth();
        const hasUnlimitedCredits = has({ plan: "unlimited" });

        // Atomically spend one credit; fails if the user has none left
        if (!hasUnlimitedCredits) {
            const updated = await db.update(usersTable)
                .set({ credits: sql`${usersTable.credits} - 1` })
                .where(and(eq(usersTable.email, email), gt(usersTable.credits, 0)))
                .returning({ credits: usersTable.credits });
            if (updated.length === 0) {
                return NextResponse.json({ error: "No credits remaining" }, { status: 403 });
            }
        }

        // IDs are generated server-side so a client can't claim an existing project or frame
        const projectId = crypto.randomUUID();
        const frameId = crypto.randomUUID();
        const messages = [{ role: "user", content: userInput }];

        try {
            await db.batch([
                db.insert(projectTable).values({ projectId, createdBy: email }),
                db.insert(frameTable).values({ frameId, projectId }),
                db.insert(chatTable).values({ frameId, chatMessage: messages, createdBy: email }),
            ]);
        } catch (error) {
            if (!hasUnlimitedCredits) {
                await db.update(usersTable)
                    .set({ credits: sql`${usersTable.credits} + 1` })
                    .where(eq(usersTable.email, email));
            }
            throw error;
        }

        return NextResponse.json({ projectId, frameId, messages });
    } catch (error) {
        console.error("POST /api/projects error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
