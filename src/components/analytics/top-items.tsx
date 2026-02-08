"use client";

import Link from "next/link";

interface TopItem {
  id: string;
  name: string;
  slug: string;
  visits: number;
}

interface TopItemsProps {
  title: string;
  items: TopItem[];
  linkPrefix: string;
}

export default function TopItems({ title, items, linkPrefix }: TopItemsProps) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium mb-3">{title}</h3>
        <p className="text-sm text-muted-foreground">No data yet</p>
      </div>
    );
  }

  const maxVisits = items[0]?.visits || 1;

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-4 text-right">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <Link
                  href={`${linkPrefix}${item.slug}`}
                  className="text-sm truncate hover:underline"
                >
                  {item.name}
                </Link>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                  {item.visits.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${(item.visits / maxVisits) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
