import { db } from "@/config/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, inArray, desc } from "drizzle-orm"; 
import { chatTable, frameTable, projectTable } from "@/config/schema";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    // 1. Check if user exists to prevent crashes
    if (!user || !user.primaryEmailAddress?.emailAddress) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch projects
    const projects = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.createdBy, user.primaryEmailAddress.emailAddress))
      .orderBy(desc(projectTable.id));

    let results = [];

    for (const project of projects) {
      const frames = await db
        .select({ frameId: frameTable.frameId })
        .from(frameTable)
        //@ts-ignore
        .where(eq(frameTable.projectId, project.projectId));

      const frameIds = frames.map((f: any) => f.frameId);
      
      let chats: any[] = [];
      if (frameIds.length > 0) {
        chats = await db
          .select()
          .from(chatTable)
          .where(inArray(chatTable.frameId, frameIds));
      }

      for (const frame of frames) {
        results.push({
          projectId: project.projectId ?? '',
          frameId: frame.frameId ?? '',
          chats: chats.filter((c) => c.frameId === frame.frameId),
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}