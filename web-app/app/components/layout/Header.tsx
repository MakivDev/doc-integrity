"use client";

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

  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/register", label: t.nav.register },
    { href: "/verify", label: t.nav.verify },
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/about", label: t.nav.about },
  ];

  if (isAdmin || isSuperAdmin) {
    // Insert admin link before "About"
    navLinks.splice(navLinks.length - 1, 0, { href: "/admin", label: t.nav.admin });
  }

  return (
    <header className="header">
      <Link href="/" className="header-brand">
        <div className="header-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="header-title">DocIntegrity</div>
      </Link>

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

      <div className="header-controls">
        <ThemeToggle />
        <LangSwitch />
        <WalletButton />
      </div>
    </header>
  );
}
