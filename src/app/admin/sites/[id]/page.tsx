import { Metadata } from "next";
import SiteDetailClient from "./client";

export const metadata: Metadata = {
  title: "Site Details | yhMv1",
};

export default function Page() {
  return <SiteDetailClient />;
}
