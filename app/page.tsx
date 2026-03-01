"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMessage(data.message);
    setLoading(false);
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Product Image</Label>
              <Input type="file" name="image" required />
            </div>

            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                type="text"
                name="name"
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                name="description"
                placeholder="Enter product description"
                required
              />
            </div>

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
              className=""
              onClick={() => {
                router.push("/search");
              }}
            >
              search
            </Button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-center text-green-600">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
