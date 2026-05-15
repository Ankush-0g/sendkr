import express from "express";
import path from "path";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import { customAlphabet } from "nanoid";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { rateLimit } from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateCode = customAlphabet("0123456789", 6);
const generateId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  path: string;
}

interface TransferSession {
  id: string;
  code: string;
  files: FileInfo[];
  expiresAt: number;
  senderId: string | null;
  receiverIds: string[];
}

const sessions = new Map<string, TransferSession>(); // code -> session
const sessionIdMap = new Map<string, string>(); // id -> code

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const PORT = 3000;

  app.set("trust proxy", 1);

  // Rate limiter for API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.headers["x-forwarded-for"]?.toString() || req.ip || "custom-key";
    },
  });

  app.use("/api/", apiLimiter);
  app.use(express.json());

  // API Routes
  app.post("/api/transfer/init", (req, res) => {
    const code = generateCode();
    const sessionId = generateId();
    const expiresAt = Date.now() + 1000 * 60 * 30; // 30 minutes

    const session: TransferSession = {
      id: sessionId,
      code,
      files: [],
      expiresAt,
      senderId: null,
      receiverIds: [],
    };

    sessions.set(code, session);
    sessionIdMap.set(sessionId, code);

    res.json({ id: sessionId, code, expiresAt, files: [] });
  });

  app.post("/api/transfer/:code/upload", upload.array("files"), (req, res) => {
    const { code } = req.params;
    const session = sessions.get(code);

    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }

    const uploadedFiles = (req.files as Express.Multer.File[]).map((file) => ({
      id: generateId(),
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      path: file.filename,
    }));

    session.files.push(...uploadedFiles);
    
    // Notify room
    io.to(session.id).emit("files-updated", { files: session.files });

    res.json({ files: uploadedFiles });
  });

  app.get("/api/transfer/:code", (req, res) => {
    const { code } = req.params;
    const session = sessions.get(code);

    if (!session || session.expiresAt < Date.now()) {
      if (session) sessions.delete(code);
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      id: session.id,
      code: session.code,
      files: session.files.map(f => ({ id: f.id, name: f.name, size: f.size, type: f.type })),
      expiresAt: session.expiresAt,
    });
  });

  app.get("/api/download/:code/:fileId", (req, res) => {
    const { code, fileId } = req.params;
    const session = sessions.get(code);

    if (!session) return res.status(404).send("Session not found");

    const file = session.files.find((f) => f.id === fileId);
    if (!file) return res.status(404).send("File not found");

    const filePath = path.join(UPLOADS_DIR, file.path);
    if (!fs.existsSync(filePath)) return res.status(404).send("File missing on server");

    res.download(filePath, file.name);
  });

  // Socket.IO signaling
  io.on("connection", (socket) => {
    socket.on("join-session", ({ sessionId, isSender }) => {
      socket.join(sessionId);
      const code = sessionIdMap.get(sessionId);
      const session = code ? sessions.get(code) : null;
      
      if (session) {
        if (isSender) {
          session.senderId = socket.id;
        } else {
          if (!session.receiverIds.includes(socket.id)) {
            session.receiverIds.push(socket.id);
          }
        }
        io.to(sessionId).emit("presence-updated", {
          senderOnline: !!session.senderId,
          receiversCount: session.receiverIds.length
        });
      }
    });

    socket.on("disconnect", () => {
      for (const [code, session] of sessions.entries()) {
        if (session.senderId === socket.id) {
          session.senderId = null;
          io.to(session.id).emit("presence-updated", {
            senderOnline: false,
            receiversCount: session.receiverIds.length
          });
          break;
        }
        const index = session.receiverIds.indexOf(socket.id);
        if (index !== -1) {
          session.receiverIds.splice(index, 1);
          io.to(session.id).emit("presence-updated", {
            senderOnline: !!session.senderId,
            receiversCount: session.receiverIds.length
          });
          break;
        }
      }
    });
  });

  // Cleanup expired sessions every minute
  setInterval(() => {
    const now = Date.now();
    for (const [code, session] of sessions.entries()) {
      if (session.expiresAt < now) {
        session.files.forEach((file) => {
          const filePath = path.join(UPLOADS_DIR, file.path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
        sessions.delete(code);
        sessionIdMap.delete(session.id);
      }
    }
  }, 60000);

  // Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
