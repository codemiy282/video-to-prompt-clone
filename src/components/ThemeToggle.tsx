"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "@tabler/icons-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Determine active theme on load
    const stored = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = stored === "dark" || (!stored && systemDark) ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggle = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-transparent p-0 hover:bg-muted transition-colors cursor-pointer text-foreground"
    >
      <span className="relative inline-flex size-4 items-center justify-center">
        {theme === "light" ? (
          <IconSun className="size-4 rotate-0 scale-100 transition-all text-foreground" />
        ) : (
          <IconMoon className="size-4 rotate-0 scale-100 transition-all text-foreground" />
        )}
      </span>
    </button>
  );
}
