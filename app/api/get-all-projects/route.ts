import { db } from "@/config/db";
import { getUserEmail, unauthorized } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, eq, inArray, desc } from "drizzle-orm";
import { chatTable, frameTable, projectTable } from "@/config/schema";

export async function GET() {
  try {
    const email = await getUserEmail();
    if (!email) return unauthorized();

    // Every frame of every project owned by the user, newest project first
    const frames = await db
      .select({ projectId: projectTable.projectId, frameId: frameTable.frameId })
      .from(projectTable)
      .innerJoin(frameTable, eq(frameTable.projectId, projectTable.projectId))
      .where(eq(projectTable.createdBy, email))
      .orderBy(desc(projectTable.id));

    const frameIds = frames.map((f) => f.frameId);
    const chats = frameIds.length
      ? await db
          .select()
          .from(chatTable)
          .where(and(inArray(chatTable.frameId, frameIds), eq(chatTable.createdBy, email)))
      : [];

    const results = frames.map((frame) => ({
      projectId: frame.projectId,
      frameId: frame.frameId,
      chats: chats.filter((c) => c.frameId === frame.frameId),
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/get-all-projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
