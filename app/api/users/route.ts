import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { unauthorized } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Returns the signed-in user's record, creating it on first sign-in
export async function POST() {
    try {
        const user = await currentUser();
        const email = user?.primaryEmailAddress?.emailAddress;
        if (!email) return unauthorized();

        const userResult = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (userResult.length > 0) {
            return NextResponse.json({ user: userResult[0] });
        }

        // onConflictDoNothing guards against two tabs creating the user at the same time
        await db.insert(usersTable).values({
            name: user?.fullName ?? 'NA',
            email,
            credits: 2
        }).onConflictDoNothing();

        const created = await db.select().from(usersTable).where(eq(usersTable.email, email));
        return NextResponse.json({ user: created[0] });
    } catch (error) {
        console.error("POST /api/users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
