import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskBid — Find Work, Hire Talent",
  description: "The marketplace where you post tasks and let skilled pros bid on them. Like Instacart meets Thumbtack.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "hsl(252, 95%, 70%)",
          colorBackground: "hsl(240, 10%, 4%)",
          colorInputBackground: "hsl(240, 8%, 7%)",
          colorInputText: "hsl(0, 0%, 98%)",
          colorText: "hsl(0, 0%, 98%)",
          colorTextSecondary: "hsl(240, 5%, 65%)",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="min-h-screen bg-background font-sans antialiased">
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "hsl(240, 8%, 7%)",
                border: "1px solid hsl(240, 6%, 16%)",
                color: "hsl(0, 0%, 98%)",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
