import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { UpdateCheck } from "@/app/_components/UpdateCheck"
import { MobileBackButtonHandler } from "@/components/mobile-back-button-handler"
import { AppLifecycleManager } from "@/components/app-lifecycle-manager"

const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Slater - Dépôt et Retrait",
  description: "Application de gestion de dépôts et retraits pour paris sportifs",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Slater",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00FFFF",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased touch-manipulation select-none`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                let isHandlingBackButton = false;
                
                function handleBackButton() {
                  if (isHandlingBackButton) return;
                  isHandlingBackButton = true;
                  
                  // Dispatch custom event for React to handle
                  window.dispatchEvent(new CustomEvent('mobileBackButton'));
                  
                  setTimeout(() => {
                    isHandlingBackButton = false;
                  }, 300);
                }
                
                // Listen for various back button events
                document.addEventListener('backbutton', function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBackButton();
                }, false);
                
                window.addEventListener('backbutton', function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBackButton();
                }, false);
                
                // Listen for browser back button - ALWAYS prevent default
                window.addEventListener('popstate', function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  // Push current state back to prevent navigation
                  if (window.history.state === null) {
                    window.history.pushState({screen: 'app'}, '', window.location.href);
                  } else {
                    // Always push state to prevent back navigation
                    window.history.pushState({screen: 'app'}, '', window.location.href);
                  }
                  handleBackButton();
                });
                
                // Initialize history state
                if (window.history.state === null) {
                  window.history.replaceState({screen: 'app'}, '', window.location.href);
                }
              })();
            `,
          }}
        />
        <Providers>
          <div className="relative flex flex-col min-h-[100dvh] overflow-hidden">
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute inset-0 opacity-40 blur-3xl animate-float" 
                style={{ background: "radial-gradient(circle at 20% 10%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)" }} 
              />
              <div className="absolute inset-0 opacity-35 blur-3xl animate-float-slow" 
                style={{ background: "radial-gradient(circle at 80% 5%, rgba(139, 92, 246, 0.25) 0%, transparent 50%)" }} 
              />
              <div className="absolute inset-0 opacity-30 blur-[100px] animate-pulse-slow" 
                style={{ background: "radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.2) 0%, transparent 60%)" }} 
              />
              <div className="absolute inset-0 opacity-25 blur-3xl animate-drift animate-delay-1000" 
                style={{ background: "radial-gradient(circle at 30% 90%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)" }} 
              />
              <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 bg-cyan-400 animate-float animate-delay-2000" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-20 bg-purple-400 animate-float-slow animate-delay-3000" />
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] animate-grid-drift" 
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} 
              />
              <svg className="absolute inset-0 w-full h-full opacity-[0.1] dark:opacity-[0.15] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <path d="M-100 100 C 200 50, 400 150, 1100 50" fill="none" stroke="url(#line-gradient)" strokeWidth="2" className="animate-flow" />
                <path d="M-100 300 C 300 250, 500 350, 1100 250" fill="none" stroke="url(#line-gradient)" strokeWidth="1" className="animate-flow animate-delay-2000" />
                <path d="M-100 600 C 100 650, 400 550, 1100 650" fill="none" stroke="url(#line-gradient)" strokeWidth="3" className="animate-flow animate-delay-1000" />
                <defs>
                  <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex-1 flex flex-col relative z-0">
              <MobileBackButtonHandler />
              <AppLifecycleManager />
              <UpdateCheck />
              {children}
              <footer className="px-4 py-6 text-center text-xs text-muted-foreground mt-auto">
                Développé par{" "}
                <a
                  href="https://codelab.bj/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Code Lab
                </a>
              </footer>
            </div>
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
