import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team 3 ISR Planner",
  description: "Tactical launch-package planner for simulated drone mission rehearsal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
