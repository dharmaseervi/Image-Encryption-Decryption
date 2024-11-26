import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
    {
        encrypted: { type: String, required: true },
        key: { type: String, required: true },
        iv: { type: String, required: true },
        mimeType: { type: String, required: true },
        description: { type: String },
        tags: { type: [String]},  
        date: { type: Date, default: Date.now },
        userId: { type: String, required: true }, // Add userId field
    },
    { timestamps: true }
);

const Image = mongoose.models.Image || mongoose.model("Image", ImageSchema);
export default Image;
