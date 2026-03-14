import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-lg shadow-emerald-500/10"
          : "border-b border-white/5 bg-slate-950/80 backdrop-blur-xl"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <Link href="/" className="group flex items-center transition-transform hover:scale-105">
          <div className="relative h-12 w-auto transition-all group-hover:scale-110">
            <Image
              src="/logo.png"
              alt="Trend360 Business Suite"
              width={120}
              height={48}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-slate-300 transition-all hover:text-emerald-400 hover:scale-105"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-slate-300 transition-all hover:text-cyan-400 hover:scale-105"
          >
            How It Works
          </Link>
          <Link
            href="#dashboard"
            className="text-sm font-medium text-slate-300 transition-all hover:text-indigo-400 hover:scale-105"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/auth"
            className="text-sm font-medium text-slate-300 transition-all hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/admin/auth"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-500/50"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex flex-col gap-1.5 rounded-lg p-2 transition-all hover:bg-white/5 md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`h-0.5 w-6 bg-white transition-all ${
              mobileMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 bg-white transition-all ${mobileMenuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-white transition-all ${
              mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-slate-950/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-emerald-400"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-cyan-400"
            >
              How It Works
            </Link>
            <Link
              href="#dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-indigo-400"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/admin/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-500/50"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
