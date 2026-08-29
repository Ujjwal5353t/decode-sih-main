import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VidyaSetu — AI-Powered Inclusive Education Platform",
  description:
    "Making quality education accessible to every child, regardless of language, internet availability, or learning differences. AI-powered adaptive learning with 50+ languages, offline support, and accessibility-first design.",
  keywords: [
    "inclusive education",
    "AI learning",
    "adaptive learning",
    "dyslexia friendly",
    "ADHD learning",
    "regional languages",
    "offline education",
    "accessible education",
  ],
  openGraph: {
    title: "VidyaSetu — AI-Powered Inclusive Education",
    description:
      "Making quality education accessible to every child. AI-powered adaptive learning with 50+ languages and offline support.",
    type: "website",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch(e) {}
              try {
                var lang = localStorage.getItem('preferred_language') || 'en';
                document.documentElement.setAttribute('lang', lang);
                document.documentElement.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
                document.documentElement.setAttribute('data-lang', lang);
                if (lang === 'ur') document.documentElement.classList.add('font-urdu');
                else if (lang !== 'en') document.documentElement.classList.add('font-indic');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {/* Skip to content link */}
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
