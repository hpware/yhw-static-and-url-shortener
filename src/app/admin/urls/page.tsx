import { Metadata } from "next";
import UrlsClient from "./client";

export const metadata: Metadata = {
  title: "URLs | yhMv1",
  description: "Manage your short URLs",
};

export default function Page() {
  return <UrlsClient />;
}
