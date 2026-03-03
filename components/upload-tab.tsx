"use client";

import { useState, useRef, FormEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Image from "next/image";

const UploadTab = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Product uploaded successfully 🎉");
      formRef.current?.reset();
      setPreview(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Upload failed ❌");
      } else {
        toast.error("An unexpected error occurred ❌");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button className="w-full">Bulk Upload</Button>
      <Card className="rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Left Side */}
            <div className="space-y-4">
              <div>
                <Label>Product Image</Label>
                <Input
                  type="file"
                  name="image"
                  accept="image/*"
                  required
                  onChange={handleImageChange}
                />
              </div>

              <div>
                <Label>Product Name</Label>
                <Input name="name" required />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea name="description" required />
              </div>

              <div>
                <Label>Price (₹)</Label>
                <Input type="number" name="price" required />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Uploading..." : "Upload Product"}
              </Button>
            </div>

            {/* Right Side Preview */}
            <div className="flex items-center justify-center">
              {preview ? (
                <Image
                  src={preview}
                  alt="Preview"
                  className="rounded-2xl shadow-lg w-64 h-64 object-cover"
                  width={100}
                  height={100}
                />
              ) : (
                <div className="w-64 h-64 border-2 border-dashed rounded-2xl flex items-center justify-center text-muted-foreground">
                  Image Preview
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadTab;
