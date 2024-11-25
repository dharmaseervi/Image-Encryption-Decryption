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
    imageDocument?: any; // Add this line if 'imageDocument' is a part of the image object.
}


const MainScreen = () => {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<EncryptedImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [decryptedImage, setDecryptedImage] = useState<string | null>(null); // Decrypted image URL

    useEffect(() => {
        fetchData();
    }, []);

    const downloadImage = (imageUrl: string) => {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = "decrypted_image.jpg";
        link.click();
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
        }
    };

    const handleDecrypt = async (id: string) => {
        try {
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
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Button onClick={handleUpload} disabled={loading}>
                    {loading ? "Uploading..." : "Upload & Encrypt"}
                </Button>
            </div>

            {/* Encrypted Images Table */}
            <div className="mt-6">
                {fetching ? (
                    <p>Loading encrypted images...</p>
                ) : data.length === 0 ? (
                    <p>No encrypted images found.</p>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {data.map((item) => (
                            <div key={item._id} className="border rounded p-4 text-center">
                                <p>Encrypted Image</p>
                                <Button onClick={() => handleDecrypt(item._id)} className="mt-4">
                                    Decrypt
                                </Button>
                            </div>
                        ))}
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
            {decryptedImage && (
                <Button className="mb-5" onClick={() => downloadImage(decryptedImage)}>Download Image</Button>
            )}



        </div>
    );
};

export default MainScreen;
