import { NextResponse } from "next/server";
import crypto from "crypto";
import mime from "mime-types";
import Image from "@/app/module/image";
import connectDB from "@/app/util/connectDb";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
    await connectDB();

    // Get the current user ID from Clerk
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve form data from the request
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
        return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
    }

    try {
        // Convert the file into a buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Detect the MIME type based on the file extension
        const mimeType = mime.lookup(file.name) || "application/octet-stream";

        // Generate random AES key and IV for encryption
        const key = crypto.randomBytes(32); // AES-256 key (32 bytes)
        const iv = crypto.randomBytes(16);  // Initialization vector (16 bytes)

        // Create cipher for AES encryption
        const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

        // Encrypt the image buffer
        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

        // Create and save the image document using the Image model
        const newImage = new Image({
            userId, // Associate with the logged-in user
            encrypted: encrypted.toString("base64"),
            key: key.toString("base64"),
            iv: iv.toString("base64"),
            mimeType: mimeType,
        });

        await newImage.save(); // Save to MongoDB collection 'images'

        // Return success response
        return NextResponse.json({ message: "Image encrypted and saved!" }, { status: 201 });
    } catch (error) {
        console.error("Error during encryption or database operation:", error);
        return NextResponse.json({ error: "Failed to encrypt or save the image." }, { status: 500 });
    }
}

export async function GET(request: Request) {
    await connectDB();

    // Get the current user ID from Clerk
    const { userId } = await auth();


    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Find the image document in MongoDB for the logged-in user
        const imageDocument = await Image.findOne({ userId }).sort({ createdAt: -1 });

        if (!imageDocument) {
            return NextResponse.json({ error: "Image not found." }, { status: 404 });
        }

        // Return the encrypted image data
        return NextResponse.json({ imageDocument });
    } catch (error) {
        console.error("Error during database operation:", error);
        return NextResponse.json({ error: "Failed to retrieve the image." }, { status: 500 });
    }
}
