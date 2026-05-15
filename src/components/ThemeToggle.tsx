import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/src/lib/utils";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "p-2 rounded-full transition-all duration-300",
        "bg-white/10 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20",
        "border border-white/20 backdrop-blur-sm"
      )}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-indigo-600" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  );
}
