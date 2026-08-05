import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-8 w-8 rounded-full border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_10px_28px_rgba(4,20,55,0.12)] backdrop-blur-xl hover:bg-white/40 hover:text-[#07111f] dark:border-white/60 dark:bg-white/10 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

export default ThemeToggle;
