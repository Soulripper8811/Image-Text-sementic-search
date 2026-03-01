"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";

export default function SearchPage() {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const router = useRouter();

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/search-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log(data);
    setResults(data);
    setLoading(false);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function removePreview() {
    setPreview(null);
  }

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <Button onClick={() => router.push("/")}>Back to upload</Button>

      <div className="max-w-5xl mx-auto mt-6">
        <h1 className="text-3xl font-semibold mb-6 text-center">
          Image Search
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col gap-4 mb-8">
          <div className="flex gap-3">
            <Input
              type="file"
              name="image"
              accept="image/*"
              required
              className="rounded-xl"
              onChange={handleImageChange}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Image Preview */}
          {preview && (
            <div className="relative w-60">
              <img
                src={preview}
                alt="Preview"
                className="rounded-xl shadow-md object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removePreview}
              >
                ✕
              </Button>
            </div>
          )}
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results.map((item) => (
              <Card
                key={item.id}
                className="rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                <CardContent className="p-4 space-y-3">
                  <img
                    src={`data:image/jpeg;base64,${item.image_base64}`}
                    alt="Result"
                    className="rounded-xl w-full h-40 object-cover"
                  />

                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">
                      Similarity: {item.distance?.toFixed(4)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (
          <p className="text-center text-muted-foreground mt-10">
            Upload an image to find similar results.
          </p>
        )}
      </div>
    </div>
  );
}
