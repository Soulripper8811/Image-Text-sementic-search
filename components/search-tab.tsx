"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/types";
import Image from "next/image";

const SearchTab = () => {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/search-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResults(data);
    setLoading(false);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-4 items-end">
        <div className="flex-1">
          <Input
            type="file"
            name="image"
            accept="image/*"
            required
            onChange={handleImageChange}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {preview && (
        <Image
          src={preview}
          alt="Preview"
          className="w-40 h-40 object-cover rounded-xl shadow"
          width={100}
          height={100}
        />
      )}

      {results.length > 0 && (
        <div className="max-h-125 overflow-y-auto pr-2">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results.map((item) => (
              <Card
                key={item.id}
                className="rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="relative w-full h-48">
                    <Image
                      src={`data:image/jpeg;base64,${item.image_base64}`}
                      alt="Result"
                      className="rounded-2xl shadow-lg w-64 h-64"
                      fill
                    />
                  </div>

                  <Badge variant="secondary">
                    Similarity: {item.distance?.toFixed(4)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchTab;
