import mongoose from 'mongoose';

// Define the schema for images
const imageSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    }, // Clerk user ID
    encrypted: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
    iv: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String, // The MIME type of the image (e.g., "image/jpeg")
        required: true, // Ensure this is provided when the image is uploaded
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create a model based on the schema
const Image = mongoose.models.Image || mongoose.model('Image', imageSchema);

export default Image;
