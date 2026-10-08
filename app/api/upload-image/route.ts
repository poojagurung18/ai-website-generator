import { getUserEmail, unauthorized } from "@/lib/auth";
import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Private key stays on the server; never expose it via a NEXT_PUBLIC_ variable
const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(req: NextRequest) {
    try {
        const email = await getUserEmail();
        if (!email) return unauthorized();

        const formData = await req.formData();
        const file = formData.get("file");
        if (!(file instanceof File) || !file.type.startsWith("image/")) {
            return NextResponse.json({ error: "An image file is required" }, { status: 400 });
        }
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "Image must be 10MB or smaller" }, { status: 413 });
        }

        const result = await imagekit.upload({
            file: Buffer.from(await file.arrayBuffer()),
            fileName: Date.now() + ".png",
            isPublished: true,
        });

        return NextResponse.json({ url: result.url });
    } catch (error) {
        console.error("POST /api/upload-image error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
