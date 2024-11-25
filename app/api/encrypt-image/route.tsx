import { NextResponse } from "next/server";
import crypto from "crypto";
import mime from "mime-types";
import Image from "@/app/module/image";
import connectDB from "@/app/util/connectDb";
 
export async function POST(request: Request) {
     await connectDB();

    // Retrieve form data from the request
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
        return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
    }

    try {
        // Convert the file into a buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        console.log(buffer);
        

        // Detect the MIME type based on the file extension
        const mimeType = mime.lookup(file.name) || "application/octet-stream"; // Default to "application/octet-stream" if MIME type is unknown

        // Generate random AES key and IV for encryption
        const key = crypto.randomBytes(32); // AES-256 key (32 bytes)
        const iv = crypto.randomBytes(16);  // Initialization vector (16 bytes)

        // Create cipher for AES encryption
        const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

        // Encrypt the image buffer
        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

        // Create and save the image document using the Image model
        const newImage = new Image({
            encrypted: encrypted.toString("base64"),
            key: key.toString("base64"),
            iv: iv.toString("base64"),
            mimeType: mimeType,  // Store the MIME type
        });

        await newImage.save();  // Save to MongoDB collection 'images'

        // Return success response
        return NextResponse.json({ message: "Image encrypted and saved!" }, { status: 201 });
    } catch (error) {
        console.error("Error during encryption or database operation:", error);
        return NextResponse.json({ error: "Failed to encrypt or save the image." }, { status: 500 });
    }
}

export async function GET(request: Request) {
    // Extract the image ID from the URL (assuming you have the image ID in the query string or path)

    const db = await connectDB();

    try {
        // Find the image document in MongoDB by ID

        const imageDocument = await Image.find({});

        if (!imageDocument) {
            return NextResponse.json({ error: "Image not found." }, { status: 404 });
        }

        // Return the encrypted image directly as base64
        return NextResponse.json({
            imageDocument
        });

    } catch (error) {
        console.error("Error during database operation:", error);
        return NextResponse.json({ error: "Failed to retrieve the image." }, { status: 500 });
    }
}
