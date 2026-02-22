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
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from "sonner";
import Link from "next/link";

export const metadata: Metadata = {
  title: "URLs | yhMv1",
};

type PopTopType = {
  typeID: string;
  type: "alert" | "loading" | "creating" | "done";
  popReactCode: React.ReactNode;
  timeout: number; // sec
  timerSet: boolean | false;
};

export default function Client() {
  const [popTop, setPopTop] = useState<PopTopType[]>([]);
  const [popUpQRPanel, setPopUpQRPanel] = useState<{
    status: boolean;
    slug: string;
    formatType: "png" | "jpg";
  }>({
    status: false,
    slug: "",
    formatType: "png",
  });
  const [invalidChecks, setInvalidChecks] = useState({
    url: false,
    slug: false,
  });

  const getUrls = useInfiniteQuery({
    queryKey: ["url"],
    queryFn: async () => {
      const response = await fetch("/api/shortener/urls");
      const data = await response.json();
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.nextOffset,
  });

  //useEffect(() => {
  //  popTop.forEach((i: PopTopType) => {
  //    if (!i.timerSet) {
  //      // set timer
  //      setTimeout(() => {}, i.timeout * 1000);
  //      setPopTop((prev) => [
  //        ...prev,
  //        {
  //          ...i,
  //          timerSet: true,
  //        },
  //      ]);
  //    }
  //  });
  //}, [popTop]);
  const sendData = useMutation({
    mutationFn: async (data: FormData) => {
      const typeID = crypto.randomUUID();
      setPopTop((prev) => [
        ...prev,
        {
          typeID,
          type: "creating",
          popReactCode: <></>,
          timeout: 30, //s
          timerSet: false,
        },
      ]);
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
      //toast.success(`${res.slug} created successfully`);
      setPopTop((prev) =>
        prev.map((i: PopTopType) => {
          if (i.typeID === typeID) {
            return {
              ...i,
              typeID,
              type: "done",
              popReactCode: (
                <>
                  <span>
                    Your URL:{" "}
                    <Link
                      href={`${process.env.NEXT_PUBLIC_URL_SHORTENER_URL}/${res.slug}`}
                    >
                      {res.slug}
                    </Link>
                  </span>
                  <div className="flex flex-row">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${process.env.NEXT_PUBLIC_URL_SHORTENER_URL}/${res.slug}`,
                        );
                        toast.success("複製成功");
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      className=""
                      onClick={() => {
                        setPopUpQRPanel({
                          ...popUpQRPanel,
                          status: true,
                          slug: res.slug,
                        });
                        //popUpQRPanel
                      }}
                    >
                      Generate QR Code
                    </Button>
                  </div>
                </>
              ),
              timeout: 30,
            };
          }
          return i;
        }),
      );
      return res;
    },
  });

  return (
    <>
      <div>
        <Dialog
          open={popUpQRPanel.status}
          onOpenChange={(status) => {
            setPopUpQRPanel({ ...popUpQRPanel, status: status });
          }}
        >
          <DialogContent>
            <DialogTitle>生成 QR Code</DialogTitle>
            <img
              src={`api/shortener/qr_this/${popUpQRPanel.slug}?type=${popUpQRPanel.formatType}&dl=0`}
            ></img>
            <Tabs
              value={popUpQRPanel.formatType}
              onValueChange={(value) => {
                setPopUpQRPanel({
                  ...popUpQRPanel,
                  formatType: value as "png" | "jpg",
                });
              }}
            >
              <TabsList>
                <TabsTrigger value="png">PNG</TabsTrigger>
                <TabsTrigger value="jpg">JPG</TabsTrigger>
              </TabsList>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        <div>
          <div className="flex flex-col space-x-3">
            {popTop.map((i: PopTopType) => (
              <div
                className={`flex flex-col rounded-lg p-2 mx-2 my-3 ${i.type === "alert" ? "bg-amber-600/50" : i.type === "done" ? "bg-green-400/50" : "bg-accent/50"}`}
                key={i.typeID}
              >
                <div className="flex flex-row justify-between text-center items-center">
                  <span className="justify-center text-center items-center">
                    {i.type === "alert"
                      ? "警示"
                      : i.type === "loading"
                        ? "載入中"
                        : i.type === "creating"
                          ? "建立中"
                          : i.type === "done"
                            ? "完成"
                            : ""}
                  </span>
                  <Button>X</Button>
                </div>
                <div>{i.popReactCode}</div>
              </div>
            ))}
          </div>
        </div>
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
                {
                  //{sendData?.isLoading && <p>Loading...</p>}
                }
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
}
