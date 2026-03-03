"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const ContentGenerator = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isChatStarted = messages.length > 0;

  // Convert image to base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Image must be under 3MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];

    setMessages(updatedMessages);
    setInput("");

    try {
      const res = await fetch("/api/content-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          image: imageBase64,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let aiResponse = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        aiResponse += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: aiResponse,
          };
          return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup preview memory
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Copy assistant content
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <Card className="mt-6 rounded-3xl shadow-xl border">
      <CardContent className="p-8 space-y-8">
        {/* Image Upload */}
        <div className="space-y-4">
          <Input type="file" accept="image/*" onChange={handleImageChange} />

          {preview && (
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden border shadow">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Initial Input */}
        {!isChatStarted && (
          <div className="flex gap-4">
            <Textarea
              placeholder="Enter content topic..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-25"
            />
            <Button onClick={handleSend} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
          </div>
        )}

        {/* Output Area */}
        <div className="border rounded-3xl p-6 min-h-100 bg-linear-to-br from-white to-gray-50">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Generated marketing content will appear here...
            </p>
          )}

          {messages.map((msg, index) => {
            if (msg.role === "user") {
              return (
                <div
                  key={index}
                  className="text-sm p-3 rounded-xl max-w-[60%] bg-primary text-white ml-auto mb-4"
                >
                  {msg.content}
                </div>
              );
            }

            return (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-md border p-8 space-y-4 mb-6"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-gray-400">
                    AI Generated Content
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(msg.content)}
                  >
                    Copy
                  </Button>
                </div>

                <div className="space-y-3">
                  {msg.content.split("\n").map((line, i) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <h3 key={i} className="text-lg font-semibold mt-6">
                          {line.replace(/\*\*/g, "")}
                        </h3>
                      );
                    }

                    if (line.startsWith("- ")) {
                      return (
                        <li key={i} className="ml-6 list-disc text-gray-700">
                          {line.replace("- ", "")}
                        </li>
                      );
                    }

                    if (line.trim() === "") {
                      return <div key={i} className="h-2" />;
                    }

                    return (
                      <p key={i} className="text-gray-700 leading-relaxed">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        {isChatStarted && (
          <div className="flex gap-3">
            <Input
              placeholder="Refine or continue..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <Button onClick={handleSend} disabled={loading}>
              {loading ? "..." : "Send"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentGenerator;
