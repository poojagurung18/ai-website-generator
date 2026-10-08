import { db } from "@/config/db";
import { frameTable, projectTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Returns the signed-in user's primary email, or null if not signed in.
export async function getUserEmail(): Promise<string | null> {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress ?? null;
}

// True only if the frame exists, belongs to the project, and the project was created by `email`.
export async function ownsFrame(email: string, projectId: unknown, frameId: unknown): Promise<boolean> {
  if (typeof projectId !== "string" || (typeof frameId !== "string" && typeof frameId !== "number")) {
    return false;
  }

  const rows = await db
    .select({ id: frameTable.id })
    .from(frameTable)
    .innerJoin(projectTable, eq(frameTable.projectId, projectTable.projectId))
    .where(
      and(
        eq(frameTable.frameId, String(frameId)),
        eq(frameTable.projectId, projectId),
        eq(projectTable.createdBy, email)
      )
    )
    .limit(1);

  return rows.length > 0;
}

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
export const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
