"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/app/providers/I18nProvider";
import { useWeb3 } from "@/app/providers/Web3Provider";
import WalletButton from "@/app/components/WalletButton";
import ThemeToggle from "@/app/components/ThemeToggle";
import LangSwitch from "@/app/components/LangSwitch";

export default function Header() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { isAdmin, isSuperAdmin } = useWeb3();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Блокуємо скрол сторінки, коли меню відкрите
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/register", label: t.nav.register },
    { href: "/verify", label: t.nav.verify },
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/about", label: t.nav.about },
  ];

  if (isAdmin || isSuperAdmin) {
    navLinks.splice(navLinks.length - 1, 0, { href: "/admin", label: t.nav.admin });
  }

  return (
    <header className="header relative z-50">
      <Link href="/" className="header-brand" onClick={() => setIsMenuOpen(false)}>
        <div className="header-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="header-title">DocIntegrity</div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="header-nav hidden md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? "active" : ""}`}
            style={{ minWidth: '130px', textAlign: 'center' }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Desktop Controls */}
      <div className="header-controls hidden md:flex">
        <ThemeToggle />
        <LangSwitch />
        <WalletButton />
      </div>

      {/* Mobile Controls & Hamburger Trigger */}
      <div className="flex items-center gap-3 md:hidden z-50">
        <ThemeToggle />
        <LangSwitch />
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-[var(--text-primary)] hover:text-cyan focus:outline-none transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* --- MOBILE OVERLAY & MENU --- */}
      
      {/* 1. Розмитий бекграунд (Backdrop) */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 md:hidden -z-10 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* 2. Плаваюча картка меню */}
      <div 
        className={`absolute top-[85px] left-4 right-4 bg-[var(--bg-primary)]/90 backdrop-blur-2xl border border-[var(--border-color)] shadow-2xl rounded-3xl md:hidden overflow-hidden transition-all duration-300 ease-out origin-top ${
          isMenuOpen ? "scale-100 opacity-100 py-6" : "scale-95 opacity-0 pointer-events-none py-0 h-0 border-transparent"
        }`}
      >
        <div className="px-6 flex flex-col items-center gap-6 h-full">
          <nav className="flex flex-col items-center gap-2 w-full">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-center w-full px-4 py-3 rounded-2xl text-lg font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-gradient-to-r from-[var(--accent-indigo)]/10 to-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/20" 
                      : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5 active:scale-95"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="w-full mt-2 pt-6 border-t border-white/10 flex flex-col items-center gap-4">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">
              Web3 Account
            </span>
            <div className="flex justify-center w-full">
              <WalletButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}