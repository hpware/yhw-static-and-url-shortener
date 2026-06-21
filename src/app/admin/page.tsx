"use client";
import { useQuery } from "@tanstack/react-query";
import { LoadingDots } from "@/components/ai/loading-dots";

export default function Page() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics-home"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/home");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingDots />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">Error loading analytics: {(error as Error).message}</div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <BigFatData dataTitle="Total Visits" numbers={data?.totalVisits || 0} />
        <BigFatData dataTitle="Today Visits" numbers={data?.todayVisits || 0} />
        <BigFatData dataTitle="Shortener Visits" numbers={data?.totalShortenerVisits || 0} />
        <BigFatData dataTitle="Site Visits" numbers={data?.totalSiteVisits || 0} className="bg-amber-800" />
        <BigFatData dataTitle="Unique IPs" numbers={data?.uniqueIPs || 0} className="bg-amber-800" />
      </div>

      {/* Top Links */}
      <div className="border rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Top Links</h2>
        {data?.topLinks?.length > 0 ? (
          <div className="space-y-2">
            {data.topLinks.map((link: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b py-2">
                <div>
                  <span className="font-mono text-sm">/{link.slug}</span>
                  <span className="text-muted-foreground text-xs ml-2">{link.name}</span>
                </div>
                <span className="font-bold">{link.clicks} clicks</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No data yet</p>
        )}
      </div>

      {/* Recent Clicks */}
      <div className="border rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Recent Clicks</h2>
        {data?.recentClicks?.length > 0 ? (
          <div className="max-h-96 overflow-y-auto space-y-1">
            {data.recentClicks.map((click: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b py-2 text-xs">
                <div className="flex gap-3">
                  <span className="font-mono">/{click.slug}</span>
                  <span className="text-muted-foreground">{click.ip}</span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(click.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No clicks yet</p>
        )}
      </div>
    </div>
  );
}

function BigFatData({
  dataTitle,
  numbers,
  className = "bg-accent",
}: {
  dataTitle: string;
  numbers: number;
  className?: string;
}) {
  return (
    <div className={`group flex flex-col border p-3 rounded-xl ${className}`}>
      <h1 className="text-sm font-medium">{dataTitle}</h1>
      <span className="text-accent-foreground/60 text-3xl font-bold text-center select-none">
        {numbers.toLocaleString()}
      </span>
    </div>
  );
}
