"use client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { shortenerData } from "@/components/drizzle/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type slugDataDB = typeof shortenerData.$inferSelect;

export default function EditSlugPopUp({
  slug,
  slugData,
  trigger,
}: {
  slug: string;
  slugData: slugDataDB;
  trigger: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [textStatus, setTextStatus] = useState<slugDataDB>(slugData);
  const [open, setOpen] = useState(false);

  const submitAction = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/shortener/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: slugData.id,
          destination: textStatus.destination,
          slug: textStatus.slug,
          name: textStatus.name,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Updated successfully");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["url"] });
    },
    onError: (e: Error) => {
      toast.error(`Error: ${e.message}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit Short URL</DialogTitle>
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col space-y-1">
            <Label>Name</Label>
            <Input
              type="text"
              value={textStatus.name}
              onChange={(e) =>
                setTextStatus((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <Label>URL</Label>
            <Input
              type="text"
              value={textStatus.destination}
              onChange={(e) =>
                setTextStatus((prev) => ({
                  ...prev,
                  destination: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col space-y-1">
            <Label>Slug</Label>
            <Input
              type="text"
              value={textStatus.slug}
              onChange={(e) =>
                setTextStatus((prev) => ({ ...prev, slug: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => submitAction.mutate()}
              disabled={submitAction.isPending}
            >
              {submitAction.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
