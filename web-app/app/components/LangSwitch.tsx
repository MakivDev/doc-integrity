"use client";

import { useI18n } from "@/app/providers/I18nProvider";

export default function LangSwitch() {
  const { locale, setLocale } = useI18n();

  return (
    <button 
      onClick={() => setLocale(locale === "uk" ? "en" : "uk")}
      className="btn"
      title={locale === "uk" ? "Switch to English" : "Перемкнути на українську"}
      style={{ padding: '0.5rem', width: '56px', display: 'flex', justifyContent: 'center', fontWeight: 'bold' }}
    >
      {locale === "uk" ? "УКР" : "ENG"}
    </button>
  );
}
