import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second Awakening — Solo Leveling Life Coach",
  description: "A gamified life coaching app inspired by Solo Leveling. Chat with the System, complete quests, level up your real life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
