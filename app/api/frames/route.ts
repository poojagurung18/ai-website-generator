import { db } from "@/config/db";
import { chatTable, frameTable } from "@/config/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const frameIdParam = searchParams.get("frameId");
    const projectId = searchParams.get("projectId");

    if (!frameIdParam || !projectId) {
      return NextResponse.json(
        { error: "frameId and projectId are required" },
        { status: 400 }
      );
    }

    const frameId = Number(frameIdParam);

    if (isNaN(frameId)) {
      return NextResponse.json(
        { error: "Invalid frameId" },
        { status: 400 }
      );
    }

    const frameResult = await db
      .select()
      .from(frameTable)
      .where(
        and(
        //@ts-ignore
          eq(frameTable.frameId, frameId),
          eq(frameTable.projectId, projectId)
        )
      );

    if (!frameResult.length) {
      return NextResponse.json(
        { error: "Frame not found" },
        { status: 404 }
      );
    }

    const chatResult = await db
      .select()
      .from(chatTable)
      //@ts-ignore
      .where(eq(chatTable.frameId, frameId));
    console.log("DB Chat Result:", chatResult); 

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
  const {designCode, frameId, projectId}= await req.json();
  const result = await db.update(frameTable).set({
    designCode: designCode
  }).where(and(eq(frameTable.frameId, frameId), eq(frameTable.projectId, projectId)));

  return NextResponse.json({result: 'Updated!'});
}
