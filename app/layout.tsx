import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import {
  ClerkProvider,
} from '@clerk/nextjs'
import "./globals.css";
import UserDetailProvider from "./provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AI Website Generator",
  description: "Generate, edit and export website designs with AI",
  icons: {
    icon: "/logo.svg",
  },
};

const outfit = Outfit({subsets:['latin']});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
      <body className={outfit.className}>
        <UserDetailProvider>
          {children}
          <Toaster />
        </UserDetailProvider>
      </body>
    </html>
    </ClerkProvider>
    
  );
}
