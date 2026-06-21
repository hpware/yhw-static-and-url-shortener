import { Metadata } from "next";
import ApiKeysClient from "./client";

export const metadata: Metadata = {
  title: "API Keys | yhMv1",
};

export default function Page() {
  return <ApiKeysClient />;
}
