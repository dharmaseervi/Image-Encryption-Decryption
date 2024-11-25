"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EncryptedImage {
    _id: string;
    encrypted: string;
    mimeType: string;
    description?: string;
    date?: string;
    imageDocument?: any;
}

const MainScreen = () => {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<EncryptedImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    useEffect(() => {
        fetchData();
    }, []);

    const downloadImage = (imageUrl: string) => {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = "decrypted_image.jpg";
        link.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);

        if (selectedFile) {
            // Create a preview URL using FileReader
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    };


    const fetchData = async () => {
        setFetching(true);
        try {
            const response = await axios.get<{ imageDocument: EncryptedImage[] }>("api/encrypt-image");
            console.log("API Response:", response);  // Check the response structure
            setData(response?.data?.imageDocument || []); // Set imageDocument if it exists
        } catch (error) {
            console.error("Error fetching image:", error);
            alert("Failed to fetch encrypted images.");
        } finally {
            setFetching(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return alert("Please select a file to upload.");
        setLoading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            await axios.post("/api/encrypt-image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setFile(null);
            fetchData();
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload and encrypt the image.");
        } finally {
            setLoading(false);
            setDecryptedImage(null)
        }
    };

    const handleDecrypt = async (id: string) => {
        try {
            setPreview(null);
            const response = await axios.get(`/api/decrypt-image?id=${id}`, { responseType: "blob" });
            const url = URL.createObjectURL(response.data);
            setDecryptedImage(url);
        } catch (error) {
            console.error("Error decrypting image:", error);
            alert("Failed to decrypt the image.");
        }
    };

    return (
        <div className="container mx-auto p-8">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold">Image Encryption/Decryption</h1>
                <p className="text-gray-600">Securely encrypt and decrypt images.</p>
            </header>

            {/* Image Upload Section */}
            <div className="mb-6 flex gap-4">
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        setFile(e.target.files?.[0] || null)
                        handleFileChange(e)
                    }}
                />
                <Button onClick={handleUpload} disabled={loading}>
                    {loading ? "Uploading..." : "Upload & Encrypt"}
                </Button>
            </div>

            {preview && (
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">Preview:</h2>
                    <img
                        src={preview}
                        alt="Preview"
                        className="mt-2 max-w-sm border rounded"
                    />
                </div>
            )}
            {/* Encrypted Images Table */}
            <div className="mt-6">
                {fetching ? (
                    <p>Loading encrypted images...</p>
                ) : data.length === 0 ? (
                    <p>No encrypted images found.</p>
                ) : (
                    <div className="grid grid-cols-3 gap-4">

                        <div className="border rounded p-4 text-center">
                            <p>Encrypted Image</p>
                            <Button onClick={() => handleDecrypt(data?._id)} className="mt-4">
                                Decrypt
                            </Button>
                        </div>

                    </div>
                )}
            </div>

            {/* Decrypted Image Display */}
            {decryptedImage && (
                <div className="mt-5 ">
                    <h2 className="text-xl font-semibold">Decrypted Image</h2>
                    <img
                        src={decryptedImage}
                        alt="Decrypted"
                        className="mt-4 w-96 h-96 rounded object-cover "
                    />
                </div>
            )}
            <div className="mt-5">
                {decryptedImage && (
                    <Button className="mb-5" onClick={() => downloadImage(decryptedImage)}>Download Image</Button>
                )}
            </div>



        </div>
    );
};

export default MainScreen;
