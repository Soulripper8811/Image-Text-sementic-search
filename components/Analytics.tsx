"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

type FileType = "image" | "pdf";

type Message = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

export default function Analytics() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [fileType, setFileType] = useState<FileType>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsEmbedded(false);
    const objectUrl = URL.createObjectURL(selectedFile);
    setFilePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleGenerateEmbedding = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-doc", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      if (data.success) {
        setIsEmbedded(true);
      } else {
        alert(data.error || "Embedding failed");
      }
    } catch (error) {
      console.error("Embedding error:", error);
      alert("Failed to generate embedding");
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !isEmbedded || isAsking) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsAsking(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", isStreaming: true },
    ]);

    try {
      const res = await fetch("/api/rag-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      if (!res.ok) throw new Error(`Chat failed: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        // Clean unwanted JSON wrappers
        const cleaned = accumulated
          .replace(/^\s*{\s*["']?answer["']?\s*:\s*/gi, "")
          .replace(/["']?\s*}\s*$/gi, "")
          .replace(/^\s*["']/g, "")
          .replace(/["']\s*$/g, "")
          .replace(/^\s*```json\s*/gi, "")
          .replace(/\s*```$/gi, "")
          .trim();

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: cleaned,
              isStreaming: true,
            };
          }
          return updated;
        });
      }

      // Final cleanup
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          const finalCleaned = last.content
            .replace(/^\s*{\s*["']?answer["']?\s*:\s*/gi, "")
            .replace(/["']?\s*}\s*$/gi, "")
            .trim();

          updated[updated.length - 1] = {
            ...last,
            content: finalCleaned,
            isStreaming: false,
          };
        }
        return updated;
      });
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "Sorry, something went wrong while generating the answer.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <Card className="mt-6 rounded-2xl shadow-lg">
      <CardContent className="p-6 space-y-6 flex flex-col h-full">
        {/* File Type & Upload Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select File Type</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
              className="w-full border rounded-md p-2 text-sm"
              disabled={uploading || isAsking}
            >
              <option value="pdf">PDF</option>
            </select>
          </div>

          <Input
            type="file"
            accept={fileType === "pdf" ? "application/pdf" : "image/*"}
            onChange={handleFileChange}
            disabled={uploading || isAsking}
          />

          {filePreview && (
            <div className="border rounded-xl p-4 bg-muted/20">
              <p className="text-sm font-medium mb-2">File Preview:</p>
              {fileType === "image" ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="max-h-60 w-full object-contain rounded-lg border"
                />
              ) : (
                <iframe
                  src={filePreview}
                  className="w-full h-60 rounded-lg border"
                />
              )}
            </div>
          )}

          {file && !isEmbedded && (
            <Button
              onClick={handleGenerateEmbedding}
              disabled={uploading || isAsking}
              className="w-full"
            >
              {uploading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Generating Embedding...
                </span>
              ) : (
                "Generate Embedding"
              )}
            </Button>
          )}

          {isEmbedded && (
            <div className="text-green-600 text-sm font-medium text-center">
              ✅ Document processed successfully. You can now ask questions.
            </div>
          )}
        </div>

        {/* Chat Area – only shown after embedding */}
        {isEmbedded && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages – takes most space */}
            <div
              ref={chatContainerRef}
              className="flex-1 border rounded-xl p-4 bg-muted/30 overflow-y-auto prose prose-sm max-w-none mb-4"
            >
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10">
                  Ask your first question about the document...
                </p>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex mb-4 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-white border shadow-sm"
                      } ${msg.isStreaming ? "animate-pulse" : ""}`}
                    >
                      {msg.role === "user" ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                          {msg.content || (msg.isStreaming ? "..." : "")}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input box – always at bottom */}
            <div className="flex gap-3 sticky bottom-0 bg-white pt-2">
              <Input
                placeholder="Ask something about the document..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isAsking}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={isAsking || !input.trim()}>
                {isAsking ? "Thinking..." : "Ask"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
