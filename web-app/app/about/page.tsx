"use client";

import { useI18n } from "@/app/providers/I18nProvider";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">{t.about.title}</h1>
        <p className="text-lg text-secondary">{t.about.subtitle}</p>
      </div>

      <div className="glass-card mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-cyan">{t.about.what_title}</h2>
        <p className="leading-relaxed mb-6">{t.about.what_desc}</p>

        <h2 className="text-2xl font-semibold mb-4 text-magenta">{t.about.how_title}</h2>
        <p className="leading-relaxed">{t.about.how_desc}</p>
      </div>

      <div className="glass-card mb-8">
        <h2 className="text-2xl font-semibold mb-6">{t.about.faq_title}</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-medium mb-2">Q: {t.about.faq1_q}</h3>
            <p className="text-secondary">{t.about.faq1_a}</p>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">Q: {t.about.faq2_q}</h3>
            <p className="text-secondary">{t.about.faq2_a}</p>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">Q: {t.about.faq3_q}</h3>
            <p className="text-secondary">{t.about.faq3_a}</p>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-2">Q: {t.about.faq4_q}</h3>
            <p className="text-secondary">{t.about.faq4_a}</p>
          </div>
        </div>
      </div>

      <div className="glass-card text-center">
        <h2 className="text-2xl font-semibold mb-6">{t.about.tech_title}</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {["Ethereum", "Solidity", "Next.js", "TypeScript", "Tailwind CSS", "Ethers.js v6"].map(tech => (
            <span key={tech} className="px-4 py-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)]">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
