import { Button } from "@/components/ui/button";
export default function Page() {
  return (
    <div>
      <div className="grid xs:grid-cols-1 xs:mx-4 md:grid-cols-3 xl:grid-cols-5">
        <BigFatData dataTitle="Total Visits" numbers={4} />
        <BigFatData dataTitle="Shortener Visits" numbers={4} />
        <BigFatData dataTitle="Hosting Visits" numbers={466666666} />
        <BigFatData
          dataTitle="Unique Visitor Countries"
          numbers={4}
          className="bg-amber-800"
        />
        <BigFatData
          dataTitle="Unique Visitor IPs"
          numbers={4}
          className="bg-amber-800"
        />
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
    <div
      className={`group flex flex-col border p-2 m-1 rounded-xl ${className}`}
    >
      <h1 className="text-xl text-bold">{dataTitle}</h1>
      <span className="text-accent-foreground/60 text-4xl justify-center text-center select-none">
        {String(numbers).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      </span>
    </div>
  );
}
