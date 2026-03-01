"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      // ✅ Success Toast
      toast.success("Product uploaded successfully 🎉");

      // ✅ Clear form
      formRef.current?.reset();
      setPreview(null);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Upload Product
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <Input
                type="file"
                name="image"
                accept="image/*"
                required
                onChange={handleImageChange}
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="flex justify-center">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-40 h-40 object-cover rounded-xl border shadow"
                />
              </div>
            )}

            {/* Product Name */}
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                type="text"
                name="name"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                name="description"
                placeholder="Enter product description"
                required
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                name="price"
                placeholder="Enter price"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload Product"}
            </Button>

            <Button
              type="button"
              className="w-full"
              onClick={() => router.push("/search")}
            >
              Search
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
