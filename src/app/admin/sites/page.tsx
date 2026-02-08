import { Metadata } from "next";
import SitesClient from "./client";

export const metadata: Metadata = {
  title: "Sites | yhMv1",
  description: "Manage your static sites",
};

export default function Page() {
  return <SitesClient />;
}
