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
  const [bulkPreviews, setBulkPreviews] = useState<string[]>([]);
  const [isBulk, setIsBulk] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  /* ================= SINGLE IMAGE ================= */

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
      console.log(error);
      toast.error("Upload failed ❌");
    } finally {
      setLoading(false);
    }
  }

  /* ================= BULK IMAGE ================= */

  function handleBulkChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const previews = Array.from(files).map((file) => URL.createObjectURL(file));

    setBulkPreviews(previews);
  }

  async function handleBulkUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    console.log(formData);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      toast.success("Bulk upload successful 🎉");
      setBulkPreviews([]);
      formRef.current?.reset();
    } catch {
      toast.error("Bulk upload failed ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toggle Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setIsBulk(!isBulk);
          setPreview(null);
          setBulkPreviews([]);
        }}
      >
        {isBulk ? "Switch to Single Upload" : "Bulk Upload"}
      </Button>

      <Card className="rounded-2xl shadow-lg">
        <CardContent className="p-6">
          {!isBulk ? (
            /* ================= SINGLE UI ================= */
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="grid md:grid-cols-2 gap-6"
            >
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

              <div className="flex items-center justify-center">
                {preview ? (
                  <div className="relative w-64 h-64">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="rounded-2xl object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 border-2 border-dashed rounded-2xl flex items-center justify-center text-muted-foreground">
                    Image Preview
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* ================= BULK UI ================= */
            <form
              ref={formRef}
              onSubmit={handleBulkUpload}
              className="space-y-6"
            >
              <div>
                <Label>Upload Multiple Images</Label>
                <Input
                  type="file"
                  name="image"
                  accept="image/*"
                  multiple
                  required
                  onChange={handleBulkChange}
                />
              </div>

              {/* Preview Grid */}
              {bulkPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-72 overflow-y-auto">
                  {bulkPreviews.map((src, index) => (
                    <div key={index} className="relative w-full h-32">
                      <Image
                        src={src}
                        alt="Bulk Preview"
                        fill
                        className="rounded-xl object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Uploading..." : "Upload All Images"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadTab;
