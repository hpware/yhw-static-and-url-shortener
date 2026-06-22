"use client";
import { Button } from "@/components/ui/button";
import { ListPlusIcon, Trash2, BarChart3, ExternalLink, Copy, ArrowRight, Check, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { LoadingDots } from "@/components/ai/loading-dots";
import Table from "@/components/table";
import EditSlugPopUp from "./editPopUp";

export default function Client() {
  const queryClient = useQueryClient();
  const [createStep, setCreateStep] = useState(-1); // -1 = collapsed
  const [createUrl, setCreateUrl] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createResult, setCreateResult] = useState<any>(null);
  const [urlError, setUrlError] = useState("");
  const [slugError, setSlugError] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);

  const [popUpQRPanelURL, setPopUpQRPanelURL] = useState("");
  const [popUpQRPanel, setPopUpQRPanel] = useState({
    status: false, slug: "", formatType: "png" as "png" | "jpg",
    size: 512, margin: 1, scale: 1,
  });
  const [qrPanelImageLoading, setQRPanelImageLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: "", slug: "" });
  const [analyticsLink, setAnalyticsLink] = useState<{ open: boolean; data: any }>({ open: false, data: null });

  const shortenerUrl = process.env.NEXT_PUBLIC_URL_SHORTENER_URL || "";

  const getUrls = useInfiniteQuery({
    queryKey: ["url"],
    queryFn: async (ask) => {
      const res = await fetch(`/api/shortener/get_all_links?page=${ask.pageParam}`);
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const memoedData = useMemo(() => getUrls.data?.pages.flatMap((i: any) => i.result), [getUrls.data]);

  useEffect(() => {
    setPopUpQRPanelURL(
      `/api/shortener/qr_this/${popUpQRPanel.slug}?type=${popUpQRPanel.formatType}&dl=0&size=${popUpQRPanel.size}&margin=${popUpQRPanel.margin}&scale=${popUpQRPanel.scale}`
    );
  }, [popUpQRPanel]);

  const resetCreate = () => {
    setCreateStep(-1);
    setCreateUrl("");
    setCreateSlug("");
    setCreateResult(null);
    setUrlError("");
    setSlugError("");
  };

  const startCreate = () => {
    setCreateStep(0);
    setCreateUrl("");
    setCreateSlug("");
    setCreateResult(null);
    setUrlError("");
    setSlugError("");
    setTimeout(() => urlInputRef.current?.focus(), 100);
  };

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
      setCreateResult(data);
      setCreateStep(2);
      toast.success("Short URL created");
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
    if (data.error) { toast.error(data.error); return; }
    setAnalyticsLink({ open: true, data: data.data });
  };

  const validateUrl = (v: string) => {
    if (!v) return "URL is required";
    if (v.length > 3 && !v.match(/^https?:\/\/.*/)) return "Must start with http:// or https://";
    return "";
  };

  const validateSlug = (v: string) => {
    if (v && !v.match(/^[a-zA-Z0-9._/-]+$/)) return "Only letters, numbers, dots, dashes, underscores, slashes";
    return "";
  };

  return (
    <>
      {/* QR Dialog */}
      <Dialog open={popUpQRPanel.status} onOpenChange={(s) => setPopUpQRPanel({ ...popUpQRPanel, status: s })}>
        <DialogContent>
          <DialogTitle className="flex items-center gap-2">QR Code {qrPanelImageLoading && <LoadingDots />}</DialogTitle>
          <img src={popUpQRPanelURL} alt="QR Code" onLoad={() => setQRPanelImageLoading(false)} />
          <Tabs value={popUpQRPanel.formatType} onValueChange={(v) => setPopUpQRPanel({ ...popUpQRPanel, formatType: v as "png" | "jpg" })}>
            <TabsList><TabsTrigger value="png">PNG</TabsTrigger><TabsTrigger value="jpg">JPG</TabsTrigger></TabsList>
          </Tabs>
          <div className="space-y-3">
            <div><span className="text-sm">Size: {popUpQRPanel.size}</span><Slider min={128} max={4192} step={128} value={[popUpQRPanel.size]} onValueChange={(v) => setPopUpQRPanel({ ...popUpQRPanel, size: v[0] })} /></div>
            <div><span className="text-sm">Margin: {popUpQRPanel.margin}</span><Slider min={0} max={10} step={1} value={[popUpQRPanel.margin]} onValueChange={(v) => setPopUpQRPanel({ ...popUpQRPanel, margin: v[0] })} /></div>
            <div><span className="text-sm">Scale: {popUpQRPanel.scale}</span><Slider min={1} max={10} step={1} value={[popUpQRPanel.scale]} onValueChange={(v) => setPopUpQRPanel({ ...popUpQRPanel, scale: v[0] })} /></div>
          </div>
          <DialogFooter><Link href={popUpQRPanelURL.replace("dl=0", "dl=1")}><Button>Download</Button></Link></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteConfirm.open} onOpenChange={(s) => setDeleteConfirm({ ...deleteConfirm, open: s })}>
        <DialogContent>
          <DialogTitle>Delete Short URL</DialogTitle>
          <p>Delete <strong>{deleteConfirm.slug}</strong> and all its analytics?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, id: "", slug: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsLink.open} onOpenChange={(s) => setAnalyticsLink({ ...analyticsLink, open: s })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogTitle>Link Analytics</DialogTitle>
          {analyticsLink.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-3 rounded-lg"><div className="text-sm text-muted-foreground">Total Clicks</div><div className="text-2xl font-bold">{analyticsLink.data.totalClicks}</div></div>
                <div className="border p-3 rounded-lg"><div className="text-sm text-muted-foreground">Today</div><div className="text-2xl font-bold">{analyticsLink.data.todayClicks}</div></div>
              </div>
              {analyticsLink.data.countryBreakdown?.length > 0 && (
                <div><h3 className="font-semibold mb-2">Countries</h3><div className="grid grid-cols-2 gap-2">{analyticsLink.data.countryBreakdown.map((c: any, i: number) => (<div key={i} className="flex justify-between text-sm border-b py-1"><span>{c.country}</span><span className="text-muted-foreground">{c.count}</span></div>))}</div></div>
              )}
              {analyticsLink.data.cityBreakdown?.length > 0 && (
                <div><h3 className="font-semibold mb-2">Cities</h3><div className="grid grid-cols-2 gap-2">{analyticsLink.data.cityBreakdown.map((c: any, i: number) => (<div key={i} className="flex justify-between text-sm border-b py-1"><span>{c.city}, {c.country}</span><span className="text-muted-foreground">{c.count}</span></div>))}</div></div>
              )}
              {analyticsLink.data.hourlyClicks?.length > 0 && (
                <div><h3 className="font-semibold mb-2">Clicks by Hour</h3><div className="flex gap-1 items-end h-20">{analyticsLink.data.hourlyClicks.map((h: any, i: number) => { const max = Math.max(...analyticsLink.data.hourlyClicks.map((x: any) => x.count)); return (<div key={i} className="flex-1 flex flex-col items-center"><div className="w-full bg-blue-500 rounded-t" style={{ height: `${max > 0 ? (h.count / max) * 100 : 0}%`, minHeight: h.count > 0 ? "4px" : "0" }} /><span className="text-[8px] text-muted-foreground">{h.hour}</span></div>); })}</div></div>
              )}
              <div><h3 className="font-semibold mb-2">Recent Visits</h3><div className="max-h-40 overflow-y-auto space-y-1">{analyticsLink.data.recentVisits?.map((v: any, i: number) => (<div key={i} className="text-xs border-b py-1 flex justify-between"><span>{v.city}, {v.country}</span><span className="text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</span></div>))}</div></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="px-4 py-2 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Short URLs</h1>
          {createStep === -1 && (
            <Button className="group" onClick={startCreate}>
              <ListPlusIcon className="group-hover:-rotate-5 group-hover:scale-110 transition-all duration-300" />Create
            </Button>
          )}
        </div>

        {/* Inline Create Wizard */}
        {createStep >= 0 && (
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((s) => (
                  <div key={s} className={`flex items-center gap-1.5 ${createStep >= s ? "text-foreground" : "text-muted-foreground"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      createStep > s ? "bg-green-600 text-white" : createStep === s ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {createStep > s ? <Check className="w-3 h-3" /> : s + 1}
                    </div>
                    <span className="text-sm hidden sm:inline">{s === 0 ? "URL" : s === 1 ? "Slug" : "Done"}</span>
                    {s < 2 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={resetCreate}><X className="w-4 h-4" /></Button>
            </div>

            {createStep === 0 && (
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Destination URL</Label>
                  <Input
                    ref={urlInputRef}
                    type="url"
                    placeholder="https://example.com/very-long-url"
                    value={createUrl}
                    onChange={(e) => { setCreateUrl(e.target.value); setUrlError(validateUrl(e.target.value)); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && createUrl && !validateUrl(createUrl)) setCreateStep(1); }}
                    autoFocus
                  />
                  {urlError && <p className="text-destructive text-xs">{urlError}</p>}
                </div>
                <Button onClick={() => setCreateStep(1)} disabled={!createUrl || !!validateUrl(createUrl)}>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {createStep === 1 && (
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Custom slug (optional)</Label>
                  <Input
                    placeholder="my-link (leave empty for auto)"
                    value={createSlug}
                    onChange={(e) => { setCreateSlug(e.target.value); setSlugError(validateSlug(e.target.value)); }}
                    onKeyDown={(e) => { if (e.key === "Enter") createMutation.mutate({ url: createUrl, slug: createSlug || undefined }); }}
                    autoFocus
                  />
                  {slugError && <p className="text-destructive text-xs">{slugError}</p>}
                  <p className="text-xs text-muted-foreground font-mono">{shortenerUrl}/{createSlug || "<random>"}</p>
                </div>
                <Button variant="outline" onClick={() => setCreateStep(0)}>Back</Button>
                <Button onClick={() => createMutation.mutate({ url: createUrl, slug: createSlug || undefined })} disabled={createMutation.isPending || !!slugError}>
                  {createMutation.isPending ? <><LoadingDots /> Creating...</> : "Create"}
                </Button>
              </div>
            )}

            {createStep === 2 && createResult && (
              <div className="flex items-center gap-4">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm">{shortenerUrl}/{createResult.slug}</div>
                  <div className="text-muted-foreground text-xs truncate">{createUrl}</div>
                </div>
                <Button size="sm" onClick={() => { navigator.clipboard.writeText(`${shortenerUrl}/${createResult.slug}`); toast.success("Copied"); }}>
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setPopUpQRPanel({ ...popUpQRPanel, status: true, slug: createResult.slug }); }}>
                  <Sparkles className="w-4 h-4 mr-1" /> QR
                </Button>
                <Button size="sm" variant="outline" onClick={startCreate}>New</Button>
                <Button size="sm" variant="ghost" onClick={resetCreate}><X className="w-4 h-4" /></Button>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <Table
          key="urls_table"
          columns={[
            { accessorKey: "name", header: () => <span>Name</span>, cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
            {
              accessorKey: "slug", header: () => <span>Slug</span>,
              cell: ({ row }) => (
                <Link href={`${shortenerUrl}/${row.original.slug}`} target="_blank" className="text-blue-400 hover:underline flex items-center gap-1">
                  {row.original.slug} <ExternalLink className="w-3 h-3" />
                </Link>
              ),
            },
            {
              accessorKey: "destination", header: () => <span>Destination</span>,
              cell: ({ row }) => <span className="text-muted-foreground truncate max-w-[300px] inline-block">{row.original.destination}</span>,
            },
            {
              accessorKey: "id", header: () => <span>Actions</span>,
              cell: ({ row }) => {
                if (!row?.original) return null;
                return (
                  <div className="flex gap-1">
                    <EditSlugPopUp slug={row.original.id} slugData={row.original} trigger={<Button variant="outline" size="sm">Edit</Button>} />
                    <Button variant="outline" size="sm" onClick={() => fetchAnalytics(row.original.id)}><BarChart3 className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${shortenerUrl}/${row.original.slug}`); toast.success("Copied"); }}><Copy className="w-4 h-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm({ open: true, id: row.original.id, slug: row.original.slug })}><Trash2 className="w-4 h-4" /></Button>
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
