import { motion } from "motion/react";
import { Send, Download, Shield, Zap, Globe } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface LandingViewProps {
  onStartSend: () => void;
  onStartReceive: () => void;
}

export function LandingView({ onStartSend, onStartReceive }: LandingViewProps) {
  return (
    <div className="flex flex-col items-center">
      <header className="text-center mb-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block px-4 py-1.5 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium"
        >
          Fast, Secure, Anywhere.
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-light tracking-tight mb-6"
        >
          Fast. Secure. <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Anywhere.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
        >
          Peer-to-peer file sharing with end-to-end encryption. The most secure way to share your digital files instantly.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4 mb-24">
        <GlassCard className="group cursor-pointer p-1" delay={0.3}>
          <div onClick={onStartSend} className="p-8 h-full bg-indigo-500/5 rounded-3xl border border-indigo-500/10 hover:border-indigo-500/30 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-600/20">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">Send Files</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-light">
              Share any file, any size. Generate a QR code or code to share instantly.
            </p>
            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20">
              Start Sending
            </button>
          </div>
        </GlassCard>

        <GlassCard className="group cursor-pointer p-1" delay={0.4}>
          <div onClick={onStartReceive} className="p-8 h-full bg-slate-200/50 dark:bg-slate-800/10 rounded-3xl border border-slate-300 dark:border-slate-700/20 hover:border-slate-400 dark:hover:border-slate-700/40 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 dark:bg-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Download className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">Receive Files</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-light">
              Scan a QR code or enter a 6-digit key to download files securely.
            </p>
            <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl font-bold transition-all">
              Start Receiving
            </button>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-6xl px-4 py-20 border-t border-white/5">
        {[
          { icon: Shield, title: "End-to-End Secure", desc: "Your files are encrypted and auto-deleted after transfer." },
          { icon: Zap, title: "Blazing Fast", desc: "Direct transfers optimized for your network speed." },
          { icon: Globe, title: "Device Universal", desc: "Works on any browser, mobile, tablet or desktop." },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
            className="flex flex-col items-center text-center px-4"
          >
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
              <feature.icon className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{feature.title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-500 font-light">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
