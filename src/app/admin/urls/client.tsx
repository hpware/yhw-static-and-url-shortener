"use client";
import { Button } from "@/components/ui/button";
import { DotIcon, ListPlusIcon, Trash2, BarChart3, ExternalLink } from "lucide-react";
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
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { LoadingDots } from "@/components/ai/loading-dots";
import Table from "@/components/table";
import EditSlugPopUp from "./editPopUp";

export default function Client() {
  const queryClient = useQueryClient();
  const [popUpQRPanelURL, setPopUpQRPanelURL] = useState<string>("");
  const [popUpQRPanel, setPopUpQRPanel] = useState<{
    status: boolean;
    slug: string;
    formatType: "png" | "jpg";
    size: number;
    margin: number;
    scale: number;
  }>({
    status: false,
    slug: "",
    formatType: "png",
    size: 512,
    margin: 1,
    scale: 1,
  });
  const [qrPanelImageLoading, setQRPanelImageLoading] = useState<boolean>(false);
  const [invalidChecks, setInvalidChecks] = useState({ url: false, slug: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; slug: string }>({
    open: false,
    id: "",
    slug: "",
  });
  const [analyticsLink, setAnalyticsLink] = useState<{ open: boolean; data: any }>({
    open: false,
    data: null,
  });

  const shortenerUrl = process.env.NEXT_PUBLIC_URL_SHORTENER_URL || "";

  const getUrls = useInfiniteQuery({
    queryKey: ["url"],
    queryFn: async (ask) => {
      const response = await fetch(`/api/shortener/get_all_links?page=${ask.pageParam}`);
      const data = await response.json();
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const memoedData = useMemo(() => {
    return getUrls.data?.pages.flatMap((i: any) => i.result);
  }, [getUrls.data]);

  useEffect(() => {
    const url = `/api/shortener/qr_this/${popUpQRPanel.slug}?type=${popUpQRPanel.formatType}&dl=0&size=${popUpQRPanel.size}&margin=${popUpQRPanel.margin}&scale=${popUpQRPanel.scale}`;
    setPopUpQRPanelURL(url);
  }, [popUpQRPanel]);

  const createMutation = useMutation({
    mutationFn: async (data: { url: string; slug?: string }) => {
      const res = await fetch("/api/shortener/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Created: ${data.slug}`);
      queryClient.invalidateQueries({ queryKey: ["url"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/shortener/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Deleted");
      setDeleteConfirm({ open: false, id: "", slug: "" });
      queryClient.invalidateQueries({ queryKey: ["url"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fetchAnalytics = async (id: string) => {
    const res = await fetch(`/api/analytics/link?id=${id}`);
    const data = await res.json();
    if (data.error) {
      toast.error(data.error);
      return;
    }
    setAnalyticsLink({ open: true, data: data.data });
  };

  return (
    <>
      {/* QR Code Dialog */}
      <Dialog open={popUpQRPanel.status} onOpenChange={(s) => setPopUpQRPanel({ ...popUpQRPanel, status: s })}>
        <DialogContent>
          <DialogTitle className="flex items-center flex-row gap-2">
            QR Code {qrPanelImageLoading && <LoadingDots />}
          </DialogTitle>
          <img src={popUpQRPanelURL} alt="QR Code" onLoad={() => setQRPanelImageLoading(false)} />
          <Tabs value={popUpQRPanel.formatType} onValueChange={(v) => setPopUpQRPanel({ ...popUpQRPanel, formatType: v as "png" | "jpg" })}>
            <TabsList>
              <TabsTrigger value="png">PNG</TabsTrigger>
              <TabsTrigger value="jpg">JPG</TabsTrigger>
            </TabsList>
          </Tabs>
          <span>Size</span>
          <div className="flex flex-row justify-center text-center">
            <Slider min={128} max={4192} step={128} value={[popUpQRPanel.size]} onValueChange={(v) => setPopUpQRPanel({ ...popUpQRPanel, size: v[0] })} />
            <span>{popUpQRPanel.size}</span>
          </div>
          <span>Margin</span>
          <div className="flex flex-row justify-center text-center">
            <Slider min={0} max={10} step={1} value={[popUpQRPanel.margin]} onValueChange={(v) => setPopUpQRPanel({ ...popUpQRPanel, margin: v[0] })} />
            <span>{popUpQRPanel.margin}</span>
          </div>
          <span>Scale</span>
          <div className="flex flex-row justify-center text-center">
            <Slider min={1} max={10} step={1} value={[popUpQRPanel.scale]} onValueChange={(v) => setPopUpQRPanel({ ...popUpQRPanel, scale: v[0] })} />
            <span>{popUpQRPanel.scale}</span>
          </div>
          <DialogFooter>
            <Link href={popUpQRPanelURL.replace("dl=0", "dl=1")}>
              <Button>Download</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm.open} onOpenChange={(s) => setDeleteConfirm({ ...deleteConfirm, open: s })}>
        <DialogContent>
          <DialogTitle>Delete Short URL</DialogTitle>
          <p>Are you sure you want to delete <strong>{deleteConfirm.slug}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, id: "", slug: "" })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsLink.open} onOpenChange={(s) => setAnalyticsLink({ ...analyticsLink, open: s })}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Link Analytics</DialogTitle>
          {analyticsLink.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Clicks</div>
                  <div className="text-2xl font-bold">{analyticsLink.data.totalClicks}</div>
                </div>
                <div className="border p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Today</div>
                  <div className="text-2xl font-bold">{analyticsLink.data.todayClicks}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Recent Visits</h3>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {analyticsLink.data.recentVisits?.map((v: any, i: number) => (
                    <div key={i} className="text-xs border-b py-1 flex justify-between">
                      <span className="font-mono">{v.ip}</span>
                      <span className="text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div>
        <div className="justify-between flex flex-row px-4 py-2">
          <h1 className="text-2xl font-bold">Short URLs</h1>
          <Dialog>
            <DialogTrigger asChild>
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
                  const fd = new FormData(e.target as HTMLFormElement);
                  createMutation.mutate({
                    url: fd.get("url") as string,
                    slug: fd.get("slug") as string || undefined,
                  });
                }}
              >
                <Label htmlFor="url">URL</Label>
                <div>
                  <Input
                    type="text"
                    id="url"
                    name="url"
                    required
                    placeholder="https://example.com"
                    onChange={(e) => {
                      const v = e.target.value;
                      setInvalidChecks((prev) => ({
                        ...prev,
                        url: v.length >= 8 && !v.match(/^https?:\/\/.*/),
                      }));
                    }}
                  />
                  {invalidChecks.url && (
                    <p className="text-red-500 text-xs pt-1">URL must start with http:// or https://</p>
                  )}
                </div>
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input
                  type="text"
                  id="slug"
                  name="slug"
                  placeholder="my-link"
                  onChange={(e) => {
                    const v = e.target.value;
                    setInvalidChecks((prev) => ({
                      ...prev,
                      slug: v.length > 0 && !v.match(/^[a-zA-Z0-9._/-]+$/),
                    }));
                  }}
                />
                {invalidChecks.slug && (
                  <p className="text-red-500 text-xs pt-1">Only letters, numbers, dots, dashes, underscores, slashes</p>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table
          key="urls_table"
          columns={[
            {
              accessorKey: "name",
              header: () => <span>Name</span>,
              cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
            },
            {
              accessorKey: "slug",
              header: () => <span>Slug</span>,
              cell: ({ row }) => (
                <Link href={`${shortenerUrl}/${row.original.slug}`} target="_blank" className="text-blue-400 hover:underline flex items-center gap-1">
                  {row.original.slug} <ExternalLink className="w-3 h-3" />
                </Link>
              ),
            },
            {
              accessorKey: "destination",
              header: () => <span>Destination</span>,
              cell: ({ row }) => (
                <span className="text-muted-foreground truncate max-w-[300px] inline-block">
                  {row.original.destination}
                </span>
              ),
            },
            {
              accessorKey: "id",
              header: () => <span>Actions</span>,
              cell: ({ row }) => {
                if (!row?.original) return null;
                return (
                  <div className="flex gap-1">
                    <EditSlugPopUp
                      slug={row.original.id}
                      slugData={row.original}
                      trigger={<Button variant="outline" size="sm">Edit</Button>}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAnalytics(row.original.id)}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${shortenerUrl}/${row.original.slug}`);
                        toast.success("Copied");
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          id: row.original.id,
                          slug: row.original.slug,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              },
            },
          ]}
          data={memoedData || []}
        />
      </div>
    </>
  );
}
