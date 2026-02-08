import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { ListPlusIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "URLs | yhMv1",
};

export default function Page() {
  return (
    <div>
      <div className="justify-between flex flex-row px-4">
        <div></div>
        <div>
          <Button className="group">
            <ListPlusIcon className="group-hover:-rotate-5 group-hover:scale-110 transition-all duration-300" />
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
