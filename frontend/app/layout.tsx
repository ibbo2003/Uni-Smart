import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link"; // <-- 1. Import the Link component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Uni-Smart",
  description: "Your all-in-one university management tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-white shadow-md">
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-indigo-600">
                  Uni-Smart
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link href="/" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <Link href="/timetable" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Timetable Generator
                </Link>
                <Link href="/exam-seating" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Exam Seating</Link>
              </div>
            </div>
          </nav>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}