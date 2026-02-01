import { Ubuntu } from "next/font/google";
import "./globals.css";

const ubuntuFont = Ubuntu({
  weight: "400",
  variable: "--font-ubuntu",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${ubuntuFont.variable} antialiased`}>
      <body className="dark">{children}</body>
    </html>
  );
}
