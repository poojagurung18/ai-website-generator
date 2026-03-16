import { db } from "@/config/db";
import { chatTable, frameTable, projectTable, usersTable } from "@/config/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {

    const { projectId, frameId, messages, credits } = await req.json();

    const user = await currentUser();
    const { has } = await auth();

    const hasUnlimitedCredits = has&&has({ plan: "unlimited" });

    await db.insert(projectTable).values({
        projectId: projectId,
        createdBy: user?.primaryEmailAddress?.emailAddress
    });

    await db.insert(frameTable).values({
        frameId: frameId,
        projectId: projectId,
    });

    await db.insert(chatTable).values({
        frameId: frameId,
        chatMessage: messages,
        createdBy: user?.primaryEmailAddress?.emailAddress
    });

    if (!hasUnlimitedCredits) {
        await db.update(usersTable)
            .set({
                credits: credits - 1
            })
            //@ts-ignore
            .where(eq(usersTable.email, user?.primaryEmailAddress?.emailAddress));
    }

    return NextResponse.json({
        projectId,
        frameId,
        messages
    });
}