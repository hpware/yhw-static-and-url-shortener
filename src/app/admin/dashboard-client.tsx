"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VisitsChart from "@/components/analytics/chart";
import TopItems from "@/components/analytics/top-items";

interface AnalyticsData {
  totalVisits: number;
  shortenerVisits: number;
  siteVisits: number;
  uniqueIps: number;
  uniqueCountries: number;
  timeSeries: { date: string; shortener: number; sites: number }[];
  topUrls: { id: string; name: string; slug: string; visits: number }[];
  topSites: { id: string; name: string; slug: string; visits: number }[];
}

async function fetchAnalytics(period: string): Promise<AnalyticsData> {
  const res = await fetch(`/api/analytics/home?period=${period}`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export default function DashboardClient() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", period],
    queryFn: () => fetchAnalytics(period),
  });

  const periods = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "all", label: "All Time" },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-1">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm">
          Error loading analytics: {error.message}
        </p>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          title="Total Visits"
          value={data?.totalVisits}
          loading={isLoading}
        />
        <StatCard
          title="Shortener Visits"
          value={data?.shortenerVisits}
          loading={isLoading}
        />
        <StatCard
          title="Hosting Visits"
          value={data?.siteVisits}
          loading={isLoading}
        />
        <StatCard
          title="Unique Countries"
          value={data?.uniqueCountries}
          loading={isLoading}
          className="bg-amber-800/20"
        />
        <StatCard
          title="Unique IPs"
          value={data?.uniqueIps}
          loading={isLoading}
          className="bg-amber-800/20"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visits Over Time</CardTitle>
          <CardDescription>
            Daily visits across URL shortener and static sites
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Loading chart...
            </div>
          ) : (
            <VisitsChart data={data?.timeSeries || []} />
          )}
        </CardContent>
      </Card>

      {/* Top items */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top URLs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <TopItems
                title=""
                items={data?.topUrls || []}
                linkPrefix="/shortener/"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Sites</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <TopItems
                title=""
                items={data?.topSites || []}
                linkPrefix="/site/"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
  className = "bg-accent",
}: {
  title: string;
  value?: number;
  loading: boolean;
  className?: string;
}) {
  return (
    <div
      className={`group flex flex-col border p-2 m-1 rounded-xl ${className}`}
    >
      <h1 className="text-xl text-bold">{title}</h1>
      <span className="text-accent-foreground/60 text-4xl justify-center text-center select-none">
        {loading
          ? "..."
          : String(value ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      </span>
    </div>
  );
}
