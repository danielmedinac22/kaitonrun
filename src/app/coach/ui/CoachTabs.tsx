"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageCircle, Sparkles } from "lucide-react";

export default function CoachTabs({
  chatSlot,
  changesSlot,
}: {
  chatSlot: React.ReactNode;
  changesSlot: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="chat" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="chat" className="flex-1 gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" />
          Chat
        </TabsTrigger>
        <TabsTrigger value="changes" className="flex-1 gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Cambios
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="mt-3">
        {chatSlot}
      </TabsContent>

      <TabsContent value="changes" className="mt-3">
        {changesSlot}
      </TabsContent>
    </Tabs>
  );
}
