# SendKR 🚀
### Fast. Secure. Anywhere.
View app in   : https://sendkr.onrender.com

SendKR is a modern, full-stack file sharing platform designed for speed and security. It allows users to transfer any type of digital file across devices in real-time using a peer-to-peer/cloud hybrid approach.

![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-6-purple?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black?logo=socketdotio)

---

## ✨ Features

- **🌐 Cross-Platform:** Send and receive files between mobile, tablet, and desktop via browser.
- **📁 All File Types:** Supports Documents, Images, Videos, Audio, APKs, Source Code, and more.
- **⚡ Real-Time Tracking:** Live transfer speed indicators, progress bars, and peer connection status.
- **🔐 Secure & Private:** Files are temporarily stored in encrypted sessions and auto-deleted after 30 minutes.
- **📱 QR & Code Sync:** Connect instantly by scanning a QR code or entering a 6-digit session key.
- **🎨 Premium UI:** Glassmorphism-inspired design with fluid Framer Motion animations.
- **🌓 Adaptive Theme:** Full support for Light and Dark modes with persistent storage.
- **🛡️ Rate Limited:** Built-in protection against automated abuse.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React  + Vite
- **Styling:** Tailwind CSS 
- **Animations:** Framer Motion (motion/react)
- **Icons:** Lucide React
- **Networking:** Axios & Socket.io-client
- **Utilities:** `qrcode.react`, `html5-qrcode`, `react-dropzone`

### Backend
- **Server:** Node.js + Express
- **Real-time:** Socket.io
- **File Handling:** Multer (Chunked/Disk Storage)


---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/sendkr.git
   cd sendkr
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file (or use `.env.example`):
   ```env
   PORT=3000
   ```

4. **Run in development mode:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🌍 Deployment (Render.com)

To deploy SendKR on **Render**:

1. **Create a New Web Service** on Render and connect your GitHub repository.
2. **Environment Settings:**
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. **Storage (Optional but Recommended):**
   - Since Render uses an ephemeral filesystem, files uploaded to `./uploads` will be lost when the service restarts.
   - For temporary transfers, this is actually perfectly fine!
   - If you want persistency (not recommended for this specific app's purpose), you would need to attach a **Render Disk**.
   
4. **Run and deploy  app**
This contains everything you need to run your app locally.

View app in   : https://sendkr.onrender.com

---

## 📁 Project Structure

```text
├── src/
│   ├── components/       # UI Components (GlassCard, ThemeToggle, etc.)
│   ├── lib/              # Utilities (cn, formatBytes)
│   ├── types.ts          # TypeScript Definitions
│   ├── App.tsx           # Main Application Entry & Routing
│   └── index.css         # Tailwind & Global Styles
├── server.ts             # Express Server & Socket.IO Logic
├── uploads/              # Temporary file storage (Auto-cleaned)
├── public/               # Static assets & PWA manifest
├── vite.config.ts        # Vite configuration
└── package.json          # Project metadata & dependencies
```

---

## 🛡️ Security Policy

- **Auto-Deletion:** A background worker on the server scans and deletes expired files every 60 seconds.
- **Session Isolation:** Each transfer uses a unique 6-digit code and a 12-character hidden session ID.
- **Validation:** Server-side validation for all upload and download requests.
- **Encryption:** (Optional Recommendation) For production, consider adding `crypto` module logic to encrypt files on-disk.

---


## Author: Ankush gupta

