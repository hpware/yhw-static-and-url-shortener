"use client";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { DotIcon, ListPlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { LoadingDots } from "@/components/ai/loading-dots";
import Table from "@/components/table";
import { shortenerData } from "@/components/drizzle/schema";

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
  const [popUpQRPanelURL, setPopUpQRPanelURL] = useState<string>("");
  const [popUpQRPanel, setPopUpQRPanel] = useState<{
    status: boolean;
    slug: string;
    formatType: "png" | "jpg";
    size: number;
    margin: number;
    scale: number;
    loading: boolean;
  }>({
    status: false,
    slug: "",
    formatType: "png",
    size: 512,
    margin: 1,
    scale: 1,
    loading: false, // just here ig
  });
  const [qrPanelImageLoading, setQRPanelImageLoading] =
    useState<boolean>(false);
  const [invalidChecks, setInvalidChecks] = useState({
    url: false,
    slug: false,
  });

  // dev usage
  //useEffect(() => {
  //  if (process.env.NODE_ENV === "development") {
  //    setPopUpQRPanel({
  //      status: true,
  //      slug: "example",
  //      formatType: "png",
  //      size: 128,
  //      margin: 1,
  //      scale: 1,
  //      loading: false,
  //    });
  //  }
  //}, []);

  const getUrls = useInfiniteQuery({
    queryKey: ["url"],
    queryFn: async (ask) => {
      const response = await fetch(
        `/api/shortener/get_all_links?page=${ask.pageParam}`,
      );
      const data = await response.json();
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.nextOffset,
  });
  const memoedData = useMemo(() => {
    return getUrls.data?.pages.flatMap((i) => i.result);
  }, [getUrls.data]);

  useEffect(() => {
    const url = `/api/shortener/qr_this/${popUpQRPanel.slug}?type=${popUpQRPanel.formatType}&dl=0&size=${popUpQRPanel.size}&margin=${popUpQRPanel.margin}&scale=${popUpQRPanel.scale}`;
    setPopUpQRPanelURL(url);
  }, [popUpQRPanel]);

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
  useEffect(() => {
    if (popUpQRPanelURL) {
      setQRPanelImageLoading(true);
    }
  }, [popUpQRPanelURL]);

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
            <DialogTitle className="flex items-center flex-row gap-2">
              生成 QR Code {qrPanelImageLoading && <LoadingDots />}
            </DialogTitle>
            <img
              src={popUpQRPanelURL}
              alt="QR Code"
              onLoad={() => {
                setQRPanelImageLoading(false);
              }}
            />

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
            <span>Size</span>
            <div className="flex flex-row justify-center text-center">
              <Slider
                min={128}
                max={4192}
                step={128}
                value={[popUpQRPanel.size]}
                onValueChange={(value) => {
                  setPopUpQRPanel({
                    ...popUpQRPanel,
                    size: value[0],
                  });
                }}
              />
              <span>{popUpQRPanel.size}</span>
            </div>
            <span>Margin</span>
            <div className="flex flex-row justify-center text-center">
              <Slider
                min={0}
                max={10}
                step={1}
                value={[popUpQRPanel.margin]}
                onValueChange={(value) => {
                  setPopUpQRPanel({
                    ...popUpQRPanel,
                    margin: value[0],
                  });
                }}
              />
              <span>{popUpQRPanel.margin}</span>
            </div>
            <span>Scale</span>
            <div className="flex flex-row justify-center text-center">
              <Slider
                min={1}
                max={10}
                step={1}
                value={[popUpQRPanel.scale]}
                onValueChange={(value) => {
                  setPopUpQRPanel({
                    ...popUpQRPanel,
                    scale: value[0],
                  });
                }}
              />
              <span>{popUpQRPanel.scale}</span>
            </div>
            <DialogFooter>
              <Link href={popUpQRPanelURL.replace("dl=0", "dl=1")}>
                <Button>Download</Button>
              </Link>
            </DialogFooter>
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
                  <DialogFooter>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
                {
                  //{sendData?.isLoading && <p>Loading...</p>}
                }
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Table
          key="manage_page_DO_NOT_CRASH"
          columns={[
            {
              accessorKey: "slug",
              header: () => <span>Slug</span>,
              cell: ({ row }) => {
                if (!row || !row.original) return <span>N/A</span>;
                return <span>{row.original.slug}</span>;
              },
            },
            {
              accessorKey: "id",
              header: () => <span></span>,
              cell: ({ row }) => {
                if (!row || !row.original) return <div></div>;
                const deviceId = row.original.id;
                return (
                  <div>
                    <Button variant="default">更改</Button>
                    <Button variant="destructive">刪除</Button>
                  </div>
                );
              },
            },
          ]}
          data={memoedData || []} //(typeof shortenerData.$inferSelect)[]}
        />
      </div>
    </>
  );
}
