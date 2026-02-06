"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { CommandPaletteProvider } from "@/components/search";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <CommandPaletteProvider>{children}</CommandPaletteProvider>
    </ConvexProvider>
  );
}
