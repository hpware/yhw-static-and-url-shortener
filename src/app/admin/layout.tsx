import { Toaster } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <Toaster richColors />
    </div>
  );
}
