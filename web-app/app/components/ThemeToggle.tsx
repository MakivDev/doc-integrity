"use client";

import { useTheme } from "@/app/providers/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      className="btn"
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{ padding: '0.5rem', borderRadius: '50%' }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
