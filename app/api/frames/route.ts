import { db } from "@/config/db";
import { chatTable, frameTable } from "@/config/schema";
import { getUserEmail, notFound, ownsFrame, unauthorized } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const email = await getUserEmail();
    if (!email) return unauthorized();

    const { searchParams } = new URL(req.url);

    const frameId = searchParams.get("frameId");
    const projectId = searchParams.get("projectId");

    if (!frameId || !projectId) {
      return NextResponse.json(
        { error: "frameId and projectId are required" },
        { status: 400 }
      );
    }

    if (!(await ownsFrame(email, projectId, frameId))) return notFound();

    const frameResult = await db
      .select()
      .from(frameTable)
      .where(
        and(
          eq(frameTable.frameId, frameId),
          eq(frameTable.projectId, projectId)
        )
      );

    const chatResult = await db
      .select()
      .from(chatTable)
      .where(and(eq(chatTable.frameId, frameId), eq(chatTable.createdBy, email)));

    const finalResult = {
      ...frameResult[0],
      chatMessages: chatResult.length ? chatResult[0].chatMessage : [],
    };

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error("GET /api/frames error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const email = await getUserEmail();
    if (!email) return unauthorized();

    const { designCode, frameId, projectId } = await req.json();
    if (typeof designCode !== "string") {
      return NextResponse.json({ error: "Invalid designCode" }, { status: 400 });
    }
    if (!(await ownsFrame(email, projectId, frameId))) return notFound();

    await db.update(frameTable).set({
      designCode: designCode
    }).where(and(eq(frameTable.frameId, String(frameId)), eq(frameTable.projectId, projectId)));

    return NextResponse.json({ result: 'Updated!' });
  } catch (error) {
    console.error("PUT /api/frames error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
