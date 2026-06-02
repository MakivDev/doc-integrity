"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEther } from "ethers";
import { useI18n } from "@/app/providers/I18nProvider";
import { readOnlyContract } from "@/app/lib/provider";

export default function Home() {
  const { t } = useI18n();
  const [stats, setStats] = useState({ docs: "...", fee: "..." });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [total, fee] = await Promise.all([
          readOnlyContract.totalDocuments(),
          readOnlyContract.registrationFee()
        ]);
        setStats({
          docs: total.toString(),
          fee: formatEther(fee)
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="page-hero">
        <div className="glow-bg"></div>
        <h1>{t.landing.hero}</h1>
        <p className="mb-8">{t.landing.heroSub}</p>        
        <div className="flex flex-wrap justify-center gap-4 px-4">
          <Link href="/register" className="btn btn-primary px-8 py-4 text-lg w-full max-w-[320px] justify-center">
            {t.landing.cta_register}
          </Link>
          <Link href="/verify" className="btn px-8 py-4 text-lg w-full max-w-[320px] justify-center" style={{ border: '1px solid var(--border-color)' }}>
            {t.landing.cta_verify}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t.landing.how_title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "1", title: t.landing.step1_title, desc: t.landing.step1_desc, color: "var(--accent-cyan)" },
            { step: "2", title: t.landing.step2_title, desc: t.landing.step2_desc, color: "var(--accent-indigo)" },
            { step: "3", title: t.landing.step3_title, desc: t.landing.step3_desc, color: "var(--accent-magenta)" }
          ].map((item) => (
            <div key={item.step} className="glass-card text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-2xl rounded-full" style={{ background: item.color, transform: 'translate(30%, -30%)' }}></div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto text-white" style={{ background: `linear-gradient(135deg, ${item.color}, #000)` }}>
                {item.step}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-[var(--text-secondary)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t.landing.benefits_title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: t.landing.benefit1_title, desc: t.landing.benefit1_desc, icon: "🔒" },
            { title: t.landing.benefit2_title, desc: t.landing.benefit2_desc, icon: "🛡️" },
            { title: t.landing.benefit3_title, desc: t.landing.benefit3_desc, icon: "👁️" },
            { title: t.landing.benefit4_title, desc: t.landing.benefit4_desc, icon: "🌍" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-cyan)] transition-colors" style={{ padding: '24px' }}>
              <div className="text-4xl shrink-0">{item.icon}</div>
              <div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 mb-8 text-center">
        <h2 className="text-2xl font-bold mb-8">{t.landing.stats_title}</h2>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="glass-card min-w-[250px]">
            <div className="text-4xl font-bold mb-2 text-cyan">{stats.docs}</div>
            <div className="text-[var(--text-secondary)]">{t.landing.stats_docs}</div>
          </div>
          <div className="glass-card min-w-[250px]">
            <div className="text-4xl font-bold mb-2 text-magenta">{stats.fee} ETH</div>
            <div className="text-[var(--text-secondary)]">{t.landing.stats_fee}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
