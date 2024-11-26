"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Upload, Search, Tag, ImageIcon, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EncryptedImage {
    _id: string;
    encrypted: string;
    mimeType: string;
    description?: string;
    date?: string;
    tags?: string[];
    imageDocument?: any;
}

export default function MainScreen() {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<EncryptedImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [tagQuery, setTagQuery] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [tags, setTags] = useState<string>("");
    const [decryptingId, setDecryptingId] = useState<string | null>(null);


    useEffect(() => {
        fetchData();
    }, [searchQuery, tagQuery]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);

        if (selectedFile) {
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
            let url = "/api/encrypt-image?";
            if (searchQuery) url += `q=${searchQuery}&`;
            if (tagQuery) url += `tags=${tagQuery}&`;

            const response = await axios.get<{ images: EncryptedImage[] }>(url);
            setData(response?.data || []);
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setFetching(false);
        }
    };
    console.log(data);


    const handleUpload = async () => {
        if (!file) return alert("Please select a file to upload.");
        setLoading(true);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("description", description);
        formData.append("tags", tags);

        try {
            await axios.post("/api/encrypt-image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setFile(null);
            setPreview(null);
            setDescription("");
            setTags("");
            fetchData();
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload and encrypt the image.");
        } finally {
            setLoading(false);
        }
    };

    const handleDecrypt = async (id: string) => {
        setDecryptingId(id);
        try {
            setPreview(null);
            const response = await axios.get(`/api/decrypt-image?id=${id}`, { responseType: "blob" });
            const url = URL.createObjectURL(response.data);
            setDecryptedImage(url);
        } catch (error) {
            console.error("Error decrypting image:", error);
            alert("Failed to decrypt the image.");
        } finally {
            setDecryptingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
            try {
                await axios.delete(`/api/encrypt-image?id=${id}`);
                fetchData(); // Refresh the image list
            } catch (error) {
                console.error("Error deleting image:", error);
                alert("Failed to delete the image.");
            }
        }
    };

    const downloadImage = (imageUrl: string) => {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = "decrypted_image.jpg";
        link.click();
    };

    return (
        <div className="container mx-auto p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <motion.header
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-12 text-center"
            >
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Image Vault</h1>
                <p className="text-xl text-gray-600">Secure Encryption & Decryption</p>
            </motion.header>

            <Tabs defaultValue="upload" className="w-full max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="upload">Upload & Encrypt</TabsTrigger>
                    <TabsTrigger value="gallery">Image Gallery</TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                    <Card className="p-6 shadow-lg">
                        <CardHeader>
                            <h2 className="text-2xl font-semibold text-gray-800">Upload New Image</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-center space-x-4">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="flex-grow"
                                    />
                                    <Button
                                        onClick={handleUpload}
                                        disabled={loading}
                                        className="min-w-[150px] px-5 py-2"
                                    >
                                        {loading ? 'Uploading...' : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Upload & Encrypt
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Image Description</Label>
                                    <Input
                                        id="description"
                                        placeholder="Add a description for this image"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                                    <Input
                                        id="tags"
                                        placeholder="e.g., vacation, family, sunset"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        {preview && (
                            <CardFooter>
                                <div className="mt-4 w-full">
                                    <h3 className="text-lg font-semibold mb-2">Preview:</h3>
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full max-h-64 object-cover rounded-lg shadow-md"
                                    />
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="gallery">
                    <Card className="p-6 shadow-lg">
                        <CardHeader>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Encrypted Images</h2>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                                <div className="flex-grow">
                                    <Input
                                        type="text"
                                        placeholder="Search by description"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full"
                                        icon={<Search className="h-4 w-4 text-gray-500" />}
                                    />
                                </div>
                                <div className="flex-grow">
                                    <Input
                                        type="text"
                                        placeholder="Filter by tags"
                                        value={tagQuery}
                                        onChange={(e) => setTagQuery(e.target.value)}
                                        className="w-full"
                                        icon={<Tag className="h-4 w-4 text-gray-500" />}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {fetching ? (
                                <p className="text-center text-gray-600">Loading encrypted images...</p>
                            ) : data.length === 0 ? (
                                <p className="text-center text-gray-600">No encrypted images found.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {data.map((image) => (
                                        <motion.div
                                            key={image._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Card className="overflow-hidden">
                                                <CardHeader className="p-4">
                                                    <h3 className="text-lg font-semibold truncate">{image.description || "Untitled"}</h3>
                                                </CardHeader>
                                                <CardContent className="p-4">
                                                    <div className="bg-gray-200 h-40 flex items-center justify-center rounded-md">
                                                        <ImageIcon className="h-16 w-16 text-gray-400" />
                                                    </div>
                                                    {image.tags && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {image.tags.map((tag, index) => (
                                                                <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                                <CardFooter className="p-4 flex justify-between">
                                                    <Button
                                                        onClick={() => handleDecrypt(image._id)}
                                                        className="flex-grow mr-2"
                                                        variant="outline"
                                                        disabled={decryptingId === image._id}
                                                    >
                                                        {decryptingId === image._id ? (
                                                            <span className="flex items-center justify-center">
                                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Decrypting...
                                                            </span>
                                                        ) : (
                                                            'Decrypt'
                                                        )}
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDelete(image._id)}
                                                        variant="destructive"
                                                        size="icon"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {decryptedImage && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-12 flex flex-col items-center"
                >
                    <h2 className="text-2xl font-semibold mb-4">Decrypted Image</h2>
                    <img
                        src={decryptedImage}
                        alt="Decrypted"
                        className="w-full max-w-2xl h-auto rounded-lg shadow-xl"
                    />
                    <Button
                        className="mt-6"
                        onClick={() => downloadImage(decryptedImage)}
                    >
                        Download Image
                    </Button>
                </motion.div>
            )}
        </div>
    );
}

