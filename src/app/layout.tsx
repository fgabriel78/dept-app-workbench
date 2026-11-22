import type { Metadata } from "next";
import { I18nProvider } from "@/components/workbench/I18nProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dept App Workbench",
  description: "Liquid visual workbench for functional briefs and OpenSpec lifecycles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
