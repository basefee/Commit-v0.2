// layout.tsx
import Sidebar from '../components/Sidebar';
import './globals.css';
import type { Metadata } from "next";
import { ContextProvider } from "@/components/Provider";

export const metadata = {
  title: 'Commit Protocol',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white min-h-screen flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="ml-64 flex-1 p-8">
          <ContextProvider>
          {children}
          </ContextProvider>
        </main>
      </body>
    </html>
  );
}
