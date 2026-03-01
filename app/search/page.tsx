"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: any) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);

    const res = await fetch("/api/search", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResults(data);
    setLoading(false);
  }
  const router = useRouter();

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <Button
        className=""
        onClick={() => {
          router.push("/");
        }}
      >
        back
      </Button>
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <h1 className="text-3xl font-semibold mb-6 text-center">
          Search Products
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <Input
            type="text"
            name="query"
            placeholder="Search for products..."
            required
            className="rounded-xl"
          />
          <Button type="submit" className="rounded-xl" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
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
                    alt={item.name}
                    className="rounded-xl w-full h-40 object-cover"
                  />

                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="font-bold text-primary">₹ {item.price}</p>
                    <Badge variant="secondary">
                      Score: {item.distance?.toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (
          <p className="text-center text-muted-foreground mt-10">
            No results yet. Try searching for something!
          </p>
        )}
      </div>
    </div>
  );
}
