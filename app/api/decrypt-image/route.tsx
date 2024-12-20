import Image from "@/app/module/image";
import connectDB from "@/app/util/connectDb";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";

// Decrypt image function
const decryptImage = (encrypted: string, key: string, iv: string): Buffer => {
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(key, "base64"),
        Buffer.from(iv, "base64")
    );
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, "base64")),
        decipher.final(),
    ]);
    return decrypted;
};

export async function GET(request: Request) {
    try {
        // Connect to the database
        await connectDB();

        // Get the current user ID from Clerk
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Extract 'id' from query parameters
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
        }

        // Find the image in the database
        const imageDocument = await Image.findById(id);

        if (!imageDocument) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }

        // Check if the current user is the owner of the image
        if (imageDocument.userId !== userId) {
            return NextResponse.json({ error: "Forbidden: You do not own this image" }, { status: 403 });
        }

        // Decrypt the image
        const decryptedImage = decryptImage(
            imageDocument.encrypted,
            imageDocument.key,
            imageDocument.iv
        );

        // Return the image as a blob
        return new Response(decryptedImage, {
            status: 200,
            headers: {
                "Content-Type": imageDocument.mimeType || "application/octet-stream",
                "Content-Disposition": `attachment; filename="decrypted-image"`,
            },
        });
    } catch (error) {
        console.error("Error decrypting image:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
