import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Topbar from "@/app/components/Topbar";
import SkyStreaks from "@/app/components/SkyStreaks";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Portfolio", template: "%s | Portfolio" },
  description: "Frontend & Creative Developer portfolio: React, Vue, Next.js, TypeScript, Three.js, Node.js • CI/CD and cloud infrastructure.",
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

async function getInitialTheme(): Promise<"light" | "dark"> {
  const cookieStore = await cookies();
  const t = cookieStore.get("theme")?.value;
  return t === "dark" ? "dark" : "light";
}

function ThemeNoFlashScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function () {
            try {
              var c = (document.cookie.match(/(?:^|; )theme=([^;]+)/)||[])[1];
              var t = c || localStorage.getItem('theme');
              if (!t) {
                t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
              }
              if (c !== t) document.cookie = 'theme=' + t + '; path=/; max-age=31536000; SameSite=Lax';
              document.documentElement.setAttribute('data-theme', t);
            } catch {}
          })();
        `,
      }}
    />
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialTheme = await getInitialTheme();
  return (
    <html lang="en" data-theme={initialTheme} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable}`}>
        <ThemeNoFlashScript />
        <Topbar />
        {children}
        <SkyStreaks />
      </body>
    </html>
  );
}
