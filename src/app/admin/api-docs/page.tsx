import { Metadata } from "next";
import ApiDocsClient from "./client";

export const metadata: Metadata = {
  title: "API Docs | yhMv1",
};

export default function Page() {
  return <ApiDocsClient />;
}
