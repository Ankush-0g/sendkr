/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "./components/ThemeToggle";
import { LandingView } from "./components/LandingView";
import { SendView } from "./components/SendView";
import { ReceiveView } from "./components/ReceiveView";
import { Radio } from "lucide-react";

type View = "landing" | "send" | "receive";

export default function App() {
  const [view, setView] = useState<View>("landing");

  // Handle direct links if needed (though we use state mostly)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("code")) {
      setView("receive");
    }
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text transition-colors duration-500 overflow-x-hidden relative flex flex-col font-sans">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <nav className="h-24 flex items-center justify-between px-10 relative z-50 max-w-7xl mx-auto w-full">
        <div 
          onClick={() => setView("landing")} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
             <Radio className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-brand-text">Send<span className="text-indigo-600 dark:text-indigo-400">KR</span></span>
        </div>
        <div className="flex items-center gap-8">
           <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
             <button onClick={() => setView("landing")} className={view === "landing" ? "text-brand-text" : "hover:text-brand-text transition-colors"}>Home</button>
             <button onClick={() => setView("send")} className={view === "send" ? "text-brand-text" : "hover:text-brand-text transition-colors"}>Send</button>
             <button onClick={() => setView("receive")} className={view === "receive" ? "text-brand-text" : "hover:text-brand-text transition-colors"}>Receive</button>
           </div>
           <ThemeToggle />
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center pt-8 md:pt-16 pb-32">
        <AnimatePresence mode="wait">
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex justify-center"
            >
              <LandingView 
                onStartSend={() => setView("send")} 
                onStartReceive={() => setView("receive")} 
              />
            </motion.div>
          )}

          {view === "send" && (
            <motion.div
              key="send"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex justify-center"
            >
              <SendView onBack={() => setView("landing")} />
            </motion.div>
          )}

          {view === "receive" && (
            <motion.div
              key="receive"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex justify-center"
            >
              <ReceiveView onBack={() => setView("landing")} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-12 px-6 border-t border-black/5 dark:border-white/5 text-center">
        <p className="text-neutral-500 text-sm">
          Built for privacy & speed. Files are encrypted and temporary.
        </p>
        <div className="mt-4 flex justify-center gap-6 text-xs font-medium text-neutral-400">
          <span>v1.0.0</span>
          <span>Terms</span>
          <span>Privacy</span>
          <span>Help</span>
        </div>
      </footer>
    </div>
  );
}

