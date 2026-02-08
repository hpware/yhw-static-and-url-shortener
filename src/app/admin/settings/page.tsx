"use client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Page() {
  const clickedAction = async () => {
    const req = await fetch("/api/shortener/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://default.tw",
      }),
    });
    const res = await req.json();
    toast.success(`${res.slug} created successfully`);
  };
  return (
    <div>
      Settings
      <Button onClick={clickedAction}>this should work ig</Button>
    </div>
  );
}
