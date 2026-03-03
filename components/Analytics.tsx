"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Analytics = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, `You: ${input}`]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        `AI: Answer based on uploaded PDF for "${input}"`,
      ]);
    }, 500);

    setInput("");
  };

  return (
    <Card className="mt-6 rounded-2xl shadow-lg">
      <CardContent className="p-6 space-y-6">
        {/* PDF Upload */}
        <div>
          <Input type="file" accept="application/pdf" />
        </div>

        {/* Chat Input */}
        <div className="flex gap-4">
          <Input
            placeholder="Ask something about the PDF..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button onClick={handleSend}>Ask</Button>
        </div>

        {/* Chat Window */}
        <div className="border rounded-xl p-4 h-80 overflow-y-auto space-y-2 bg-muted/30">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Chat with your PDF here...
            </p>
          )}

          {messages.map((msg, index) => (
            <div key={index} className="text-sm">
              {msg}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Analytics;
