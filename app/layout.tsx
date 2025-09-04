import "../style/globals.scss";
import type { Metadata } from "next";


export const metadata: Metadata = {
title: "AllSync",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}