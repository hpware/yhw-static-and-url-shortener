"use client";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { ListPlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const metadata: Metadata = {
  title: "URLs | yhMv1",
};

export default function Client() {
  const [invalidChecks, setInvalidChecks] = useState({
    url: false,
    slug: false,
  });
  const sendData = useMutation({
    mutationFn: async (data: FormData) => {
      const req = await fetch("/api/shortener/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: data.get("url")?.toString(),
          ...(data.get("slug") === undefined
            ? null
            : { slug: data.get("slug")?.toString() }),
        }),
      });
      const res = await req.json();
      toast.success(`${res.slug} created successfully`);
      return res;
    },
  });

  return (
    <div>
      <div className="justify-between flex flex-row px-4">
        <div></div>
        <div>
          <Dialog>
            <DialogTrigger>
              <Button className="group">
                <ListPlusIcon className="group-hover:-rotate-5 group-hover:scale-110 transition-all duration-300" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Create a new short URL</DialogTitle>
              <form
                className="flex flex-col space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const createFormData = new FormData(e.target);
                  sendData.mutate(createFormData);
                }}
              >
                <Label htmlFor="url">URL</Label>
                <div>
                  <Input
                    type="text"
                    id="url"
                    name="url"
                    required
                    onChange={(e) => {
                      const eValue = e.target.value;
                      if (
                        eValue.length >= 8 &&
                        !eValue.match(/^https?:\/\/.*/)
                      ) {
                        setInvalidChecks({ ...invalidChecks, url: true });
                      } else if (invalidChecks.url === true) {
                        setInvalidChecks({ ...invalidChecks, url: false });
                      }
                    }}
                  />
                  {invalidChecks.url && (
                    <p className="text-red-500 text-xs pt-1">
                      URL does not start with "http://" or "https://"
                    </p>
                  )}
                </div>
                <Label htmlFor="url">Slug (optional)</Label>
                <Input
                  type="text"
                  id="slug"
                  name="slug"
                  onChange={(e) => {
                    const eValue = e.target.value;
                    if (
                      eValue.length >= 8 &&
                      !eValue.match(/^[a-zA-Z0-9_-]+$/)
                    ) {
                      setInvalidChecks({ ...invalidChecks, slug: true });
                    } else if (invalidChecks.slug === true) {
                      setInvalidChecks({ ...invalidChecks, slug: false });
                    }
                  }}
                />
                <Button type="submit">Create</Button>
              </form>
              {sendData.isLoading && <p>Loading...</p>}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
