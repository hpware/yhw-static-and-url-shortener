export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-3 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay: `${i * 0.05}s`, animationDuration: "0.4s" }}
        />
      ))}
    </div>
  );
}
