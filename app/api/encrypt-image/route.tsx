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
    const description = formData.get("description") as string;
    const tags = (formData.get("tags") as string)?.split(",").map(tag => tag.trim());

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
            encrypted: encrypted.toString("base64"),
            key: key.toString("base64"),
            iv: iv.toString("base64"),
            mimeType,
            userId,
            description,
            tags,
        });
        await newImage.save();

        // Return success response
        return NextResponse.json({ message: "Image encrypted and saved!" }, { status: 201 });
    } catch (error) {
        console.error("Error during encryption or database operation:", error);
        return NextResponse.json({ error: "Failed to encrypt or save the image." }, { status: 500 });
    }
}

export async function GET(request: Request) {
    await connectDB(); // Ensure database connection is established

    const { userId } = await auth(); // Get the current user ID from Clerk

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q"); // Description search query
    const tags = searchParams.get("tags")?.split(","); // Array of tags for filtering
    const fromDate = searchParams.get("fromDate"); // Start date filter
    const toDate = searchParams.get("toDate"); // End date filter

    try {
        // Build dynamic query filters
        const filters: any = { userId };
        console.log(filters);
        

        // Only apply filters if the parameters are provided
        if (q) {
            filters.description = { $regex: q, $options: "i" }; // Case-insensitive search by description
        }

        if (tags && tags.length > 0) {
            filters.tags = { $in: tags, }; // Matches if at least one tag is present
            // Ensure all provided tags are in the tags array
        }
        console.log("Tags filter:", tags); // Log the tags parameter from the request
        console.log("Filters object:", filters); // Log the final filters object before querying

        if (fromDate || toDate) {
            filters.date = {};
            if (fromDate) filters.date.$gte = new Date(fromDate); // Start date filter
            if (toDate) filters.date.$lte = new Date(toDate); // End date filter
        }

        // Query the database with the constructed filters
        const images = await Image.find(filters);

        if (images.length === 0) {
            return NextResponse.json({ error: "No images found." }, { status: 404 });
        }

        return NextResponse.json(images); // Return the filtered images
    } catch (error) {
        console.error("Error during database operation:", error);
        return NextResponse.json({ error: "Failed to retrieve images." }, { status: 500 });
    }
}