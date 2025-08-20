import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Topbar from "@/app/components/Topbar";
import SkyStreaks from "@/app/components/SkyStreaks";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Portfolio",
    template: "%s | Portfolio",
  },
  description: "Frontend & Creative Developer portfolio: React, Vue, Next.js, TypeScript, Three.js, Node.js • CI/CD and cloud infrastructure.",
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Инициализация темы без вспышки */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = localStorage.getItem('theme');
                  if(!t){ t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
                  document.documentElement.setAttribute('data-theme', t);
                } catch {}
              })();
            `,
          }}
        />
        <Topbar />
        {children}
        <SkyStreaks />
      </body>
    </html>
  );
}
