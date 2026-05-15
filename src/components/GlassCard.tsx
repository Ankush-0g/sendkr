import { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function GlassCard({ children, className, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative overflow-hidden glass-panel",
        "shadow-2xl shadow-black/20",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
