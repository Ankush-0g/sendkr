import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, File, QrCode, Copy, Check, Users, Clock, Loader2, Plus, Download } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { formatBytes, cn } from "@/src/lib/utils";
import { SessionInfo, FileInfo } from "@/src/types";

interface SendViewProps {
  onBack: () => void;
}

export function SendView({ onBack }: SendViewProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerStatus, setPeerStatus] = useState({ senderOnline: true, receiversCount: 0 });
  const [copied, setCopied] = useState(false);

  const initSession = async () => {
    try {
      const res = await axios.post("/api/transfer/init");
      setSession(res.data);
      
      const newSocket = io();
      newSocket.emit("join-session", { sessionId: res.data.id, isSender: true });
      
      newSocket.on("presence-updated", (status) => {
        setPeerStatus(status);
      });

      setSocket(newSocket);
    } catch (err) {
      console.error("Failed to init session", err);
    }
  };

  useEffect(() => {
    return () => {
        if (socket) socket.disconnect();
    };
  }, [socket]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const startUpload = async () => {
    if (!files.length) return;
    if (!session) await initSession();
    
    setUploading(true);
    setUploadSpeed(0);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const startTime = Date.now();

    try {
      // Use the newly created session or the existing one
      const currentSession = session || await (async () => {
         const res = await axios.post("/api/transfer/init");
         setSession(res.data);
         const ns = io();
         ns.emit("join-session", { sessionId: res.data.id, isSender: true });
         ns.on("presence-updated", (status) => setPeerStatus(status));
         setSocket(ns);
         return res.data;
      })();

      const res = await axios.post(`/api/transfer/${currentSession.code}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);

          const timeElapsed = (Date.now() - startTime) / 1000;
          if (timeElapsed > 0) {
            setUploadSpeed(progressEvent.loaded / timeElapsed);
          }
        },
      });
      
      setSession(prev => prev ? { ...prev, files: [...(prev.files || []), ...res.data.files] } : null);
      setFiles([]);
      setUploading(false);
      setUploadProgress(0);
      setUploadSpeed(0);
    } catch (err) {
      console.error("Upload failed", err);
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const copyCode = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const transferUrl = session ? `${window.location.origin}/receive?code=${session.code}` : "";

  return (
    <div className="max-w-4xl w-full px-4 pb-20">
      <button onClick={onBack} className="mb-8 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-2">
        <X className="w-4 h-4" /> Back to Home
      </button>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <GlassCard className="p-1">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-[22px] p-12 text-center transition-all cursor-pointer",
                isDragActive ? "border-indigo-500 bg-indigo-500/5" : "border-slate-200 dark:border-white/5 hover:border-indigo-500/40"
              )}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-slate-900 dark:text-white">Drag and drop files here</h3>
              <p className="text-slate-500 dark:text-slate-400 font-light">or click to browse from your device</p>
            </div>
          </GlassCard>

          <AnimatePresence>
            {files.length > 0 && (
              <GlassCard className="p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  Ready to Transfer <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-xs">{files?.length || 0}</span>
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {files.map((file, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/20 border border-slate-200 dark:border-white/5"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <File className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          <div>{file.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-500 font-light">{formatBytes(file.size)}</div>
                        </div>
                      </div>
                      <button onClick={() => removeFile(i)} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 transition-colors rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-6">
                  {uploading ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex flex-col">
                          <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">{formatBytes(uploadSpeed)}/s</span>
                        </div>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800/40 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-indigo-500" 
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={startUpload}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                      Start Transfer Session
                    </button>
                  )}
                </div>
              </GlassCard>
            )}
          </AnimatePresence>

          {session && (session.files?.length || 0) > 0 && (
            <GlassCard className="p-6 border-indigo-500/20">
               <h4 className="font-semibold mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                Active Transfer <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-xs text-indigo-600 dark:text-indigo-400">{session.files?.length || 0} Files</span>
              </h4>
              <div className="space-y-3">
                {session.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/20 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm text-slate-900 dark:text-white font-medium">{file.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-500">{formatBytes(file.size)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Users className="w-4 h-4" />
                        <span>{peerStatus.receiversCount} Connected</span>
                    </div>
                </div>
                <button 
                    onClick={() => { setFiles([]); setSession(null); if(socket) socket.disconnect(); }}
                    className="text-xs text-slate-500 hover:text-red-500 font-medium"
                >
                    End Session
                </button>
              </div>
            </GlassCard>
          )}
        </div>

        <div className="md:col-span-2">
          {session ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <GlassCard className="p-8 text-center">
                <div className="mb-6 inline-flex bg-white p-4 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
                   <div className="absolute inset-0 bg-white" />
                   <div className="relative z-10">
                      <QRCodeSVG value={transferUrl} size={180} bgColor="#ffffff" fgColor="#0c0c14" />
                   </div>
                </div>
                <h4 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white uppercase tracking-[0.2em]">{session.code}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-light">Scan QR or enter code to receive files</p>
                
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={copyCode}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-xl font-medium transition-all text-slate-900 dark:text-white"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy Code"}
                  </button>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5 text-left text-xs uppercase tracking-widest text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Expires in 30 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", peerStatus.receiversCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-700")} />
                    <span>{peerStatus.receiversCount} receiver(s) connected</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <GlassCard className="p-8 h-full flex flex-col items-center justify-center text-center opacity-30 grayscale blur-[2px]">
              <QrCode className="w-16 h-16 mb-4 text-slate-500" />
              <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Waiting for upload</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
