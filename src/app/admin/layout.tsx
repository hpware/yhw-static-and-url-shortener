"use client";
import { Toaster } from "sonner";
import Navigation from "./navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Layout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
      {children}
      <Toaster richColors />
    </QueryClientProvider>
  );
}
