import { Toaster } from "sonner";
import Navigation from "./navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navigation />
      {children}
      <Toaster richColors />
    </div>
  );
}
