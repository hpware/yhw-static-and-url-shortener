import { Metadata } from "next";
import Client from "./client";

export const metadata: Metadata = {
  title: "URLs | yhMv1",
};

export default function Page() {
  return <Client />;
}
