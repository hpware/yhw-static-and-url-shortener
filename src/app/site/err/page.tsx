"use client";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const params = useSearchParams();
  const errors = [
    {
      errorCode: "404",
      errorType: "ERR_FILE_NOT_FOUND",
    },
    {
      errorCode: "403",
      errorType: "NOT_ALLOWED",
    },
  ];
  const typeParams = params.get("type");
  if (!(typeParams && errors.some((error) => error.errorType === typeParams))) {
    notFound();
  }
  return (
    <div className="flex flex-col justify-center items-center absolute inset-0">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-9xl font-bold italic ubuntu-font animate__animated animate__flash">
          {errors.find((error) => error.errorType === typeParams)?.errorCode ||
            "404"}
        </h1>
        <span className="text-2xl huninn-font">這個頁面不存在</span>
        <span>錯誤訊息: {typeParams}</span>
      </div>
    </div>
  );
}
