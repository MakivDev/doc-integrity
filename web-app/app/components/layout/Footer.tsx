"use client";

import { useI18n } from "@/app/providers/I18nProvider";
import { CONTRACT_ADDRESS } from "@/app/lib/contract";

export default function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>{t.footer.copyright.replace("{year}", currentYear.toString())}</p>
      <div className="flex flex-wrap gap-1 sm:gap-2 justify-center items-center px-4 text-center text-xs sm:text-sm">
        <span>{t.footer.contract}:</span>
        <a
          href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan hover:text-magenta transition-colors break-all max-w-full font-mono"
        >
          {CONTRACT_ADDRESS}
        </a>
      </div>
    </footer>
  );
}
