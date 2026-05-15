import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QrCode, Scan, X, ArrowRight, File, Download, Loader2, Check, ExternalLink, ShieldCheck, Clock, Users } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { formatBytes, cn } from "@/src/lib/utils";
import { SessionInfo, FileInfo } from "@/src/types";

interface ReceiveViewProps {
  onBack: () => void;
}

export function ReceiveView({ onBack }: ReceiveViewProps) {
  const [code, setCode] = useState("");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerStatus, setPeerStatus] = useState({ senderOnline: false, receiversCount: 0 });
  const [downloadingFiles, setDownloadingFiles] = useState<Record<string, { progress: number; speed: number }>>({});

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const handleDownload = async (file: FileInfo) => {
    if (!session) return;
    
    setDownloadingFiles(prev => ({ ...prev, [file.id]: { progress: 0, speed: 0 } }));
    const startTime = Date.now();

    try {
      const response = await axios.get(`/api/download/${session.code}/${file.id}`, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          const timeElapsed = (Date.now() - startTime) / 1000;
          const speed = timeElapsed > 0 ? progressEvent.loaded / timeElapsed : 0;
          
          setDownloadingFiles(prev => ({
            ...prev,
            [file.id]: { progress, speed }
          }));
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setTimeout(() => {
        setDownloadingFiles(prev => {
          const next = { ...prev };
          delete next[file.id];
          return next;
        });
      }, 2000);
    }
  };

  useEffect(() => {
    if (showScanner) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(
        (decodedText) => {
          // Handle URL or raw code
          try {
            const url = new URL(decodedText);
            const qrCode = url.searchParams.get("code");
            if (qrCode) {
              handleConnect(qrCode);
              setShowScanner(false);
            }
          } catch (e) {
            handleConnect(decodedText);
            setShowScanner(false);
          }
        },
        (errorMessage) => {
          // console.warn(errorMessage);
        }
      );
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [showScanner]);

  const handleConnect = async (targetCode: string = code) => {
    if (!targetCode || targetCode.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/transfer/${targetCode}`);
      setSession(res.data);
      
      const newSocket = io();
      newSocket.emit("join-session", { sessionId: res.data.id, isSender: false });
      newSocket.on("presence-updated", (status) => {
        setPeerStatus(status);
      });
      newSocket.on("files-updated", ({ files }) => {
        setSession(prev => prev ? { ...prev, files } : null);
      });
      setSocket(newSocket);
    } catch (err: any) {
      setError(err.response?.data?.error || "Transfer not found or expired");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  return (
    <div className="max-w-4xl w-full px-4 overflow-hidden pb-20">
      <button onClick={onBack} className="mb-8 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-2">
        <X className="w-4 h-4" /> Back to Home
      </button>

      {!session ? (
        <div className="flex flex-col items-center">
          <GlassCard className="w-full max-w-lg p-8">
            <h3 className="text-2xl font-semibold mb-1 text-slate-900 dark:text-white text-center">Receive Files</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8 font-light tracking-tight">Enter a code or scan QR to connect</p>
            
            <div className="space-y-3 mb-8">
               <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">6-Digit Transfer Code</label>
               <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000 000"
                className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl px-4 py-8 text-center text-5xl font-black tracking-[0.3em] focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700/50"
              />
            </div>

            <button
              onClick={() => handleConnect()}
              disabled={loading || code.length !== 6}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 rounded-2xl font-bold transition-all mb-6 flex items-center justify-center gap-3 shadow-lg shadow-black/5 dark:shadow-none"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              Connect Transfer
            </button>

            {error && <p className="text-red-400 text-sm text-center mb-6 font-medium">{error}</p>}

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/5"></div></div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest"><span className="bg-brand-bg dark:bg-[#11111a] px-3 text-slate-400 dark:text-slate-600">OR</span></div>
            </div>

            <button
              onClick={() => setShowScanner(!showScanner)}
              className="w-full py-4 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-slate-900 dark:text-white"
            >
              <Scan className="w-5 h-5 text-indigo-400" />
              {showScanner ? "Close Scanner" : "Camera Scanner"}
            </button>
          </GlassCard>

          <AnimatePresence>
            {showScanner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg mt-8"
              >
                <GlassCard className="p-2 border-indigo-500/20">
                    <div id="qr-reader" className="overflow-hidden rounded-2xl" />
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Files available</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-light">Secure download ready</p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-widest">
                  {(session.files?.length || 0)} Files Ready
                </div>
              </div>

              <div className="space-y-4">
                {(session.files?.length || 0) === 0 ? (
                    <div className="py-16 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl font-light">
                        Waiting for sender to upload files...
                    </div>
                ) : session.files.map((file) => (
                  <div key={file.id} className="relative overflow-hidden p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/20 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-all group">
                    {downloadingFiles[file.id] && (
                        <motion.div 
                            className="absolute bottom-0 left-0 h-1 bg-indigo-500 z-10"
                            initial={{ width: 0 }}
                            animate={{ width: `${downloadingFiles[file.id].progress}%` }}
                        />
                    )}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                          <File className="w-5 h-5 transition-transform group-hover:scale-110" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-[250px]">{file.name}</div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{formatBytes(file.size)}</span>
                             {downloadingFiles[file.id] && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                    • {formatBytes(downloadingFiles[file.id].speed)}/s
                                </span>
                             )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={!!downloadingFiles[file.id]}
                        className={cn(
                            "p-3 rounded-xl border border-slate-200 dark:border-white/5 transition-all shadow-lg flex items-center justify-center",
                            downloadingFiles[file.id] 
                                ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20 cursor-wait" 
                                : "bg-white/5 dark:bg-white/[0.05] hover:bg-indigo-600 hover:text-white text-slate-900 dark:text-white"
                        )}
                      >
                        {downloadingFiles[file.id] ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {session.files.length > 0 && (
                 <div className="mt-8 flex justify-center">
                    <button 
                        onClick={() => {
                            session.files.forEach(f => handleDownload(f));
                        }}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-8 py-4 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/5 transition-all"
                    >
                        <Download className="w-4 h-4" /> Download All Bundle
                    </button>
                 </div>
              )}
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6">
              <h4 className="font-bold text-[10px] uppercase tracking-[0.2em] mb-6 text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> Security Report
              </h4>
              <div className="space-y-5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Status</span>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", peerStatus.senderOnline ? "bg-emerald-500" : "bg-red-500")} />
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">{peerStatus.senderOnline ? "Sender Linked" : "Link Lost"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-500 font-medium">Timer</span>
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> 29m 42s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Payload</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">{formatBytes(session.files?.reduce((acc, f) => acc + f.size, 0) || 0)}</span>
                </div>
              </div>
            </GlassCard>

            <button
                onClick={() => { setSession(null); if(socket) socket.disconnect(); }}
                className="w-full py-4 text-slate-500 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest"
            >
                Disconnect Feed
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
