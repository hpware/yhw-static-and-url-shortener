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
    <html
      lang="zh-TW"
      className={`${ubuntuFont.variable} antialiased`}
      suppressHydrationWarning={true}
    >
      <body className="dark">
        {children}
        {process.env.NODE_ENV === "development" && (
          <div className="fixed right-0 bottom-0 px-3 py-1 bg-accent/40 rounded-tl-lg">
            <div>Dev</div>
          </div>
        )}
      </body>
    </html>
  );
}
