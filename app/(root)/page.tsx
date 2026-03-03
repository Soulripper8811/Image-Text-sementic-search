"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchTab from "@/components/search-tab";
import UploadTab from "@/components/upload-tab";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            🖼️ Image Similarity System
          </h1>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="upload">Upload Product</TabsTrigger>
              <TabsTrigger value="search">Search Image</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <UploadTab />
            </TabsContent>

            <TabsContent value="search">
              <SearchTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
