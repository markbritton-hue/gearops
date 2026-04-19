# GearOps — Equipment Dashboard

A local network equipment dashboard for StreamWave production gear. Manages cameras, encoders, ATEMs, HyperDecks, and more. Used at Michigan high school powerlifting meets and live streaming events.

---

## Requirements

Install these on the computer that will run GearOps:

| Software | Download |
|---|---|
| **Node.js** | https://nodejs.org |
| **Git** | https://git-scm.com |
| **FFmpeg** *(capture preview only)* | https://www.gyan.dev/ffmpeg/builds/ |
| **Brave Browser** *(popout feature only)* | https://brave.com |

**FFmpeg setup:** Download the full build, extract it, and place `ffmpeg.exe` at:
```
C:\ffmpeg\bin\ffmpeg.exe
```

---

## Installation

Open a terminal and run:

```bash
git clone https://github.com/markbritton-hue/swptools.git
cd swptools
npm install
```

---

## Configuration

### 1. Local config
Copy the example config and fill in your values:
```bash
copy local.config.example.js local.config.js
```
Edit `local.config.js` with your credentials (Companion host, app paths, etc.).

### 2. Firebase config
Copy `firebase.config.js` from your existing machine to the new one. This file is gitignored and will not be on GitHub — you must transfer it manually.

```
firebase.config.js  ← copy this file from your current machine
```

---

## Running the app

Double-click `start.bat` — or run from terminal:
```bash
node server.js
```

The app will be available at:
```
http://localhost:8080
```

---

## Accessing from other devices (iPad, phone, etc.)

Find the PC's IP address by running `ipconfig` in a terminal. Look for **IPv4 Address** under your WiFi adapter, e.g. `192.168.0.121`.

Then on any device on the same WiFi network, open a browser and go to:
```
http://192.168.0.121:8080
```

### Add to iPad home screen
1. Open Safari and go to the app URL
2. Tap the **Share** button
3. Tap **Add to Home Screen**
4. It will appear as **GearOps** with the logo

---

## Pages

| Page | URL | Purpose |
|---|---|---|
| Equipment | `/` | Main equipment dashboard |
| Control Room | `/capture.html` | Capture preview, browser panel, equipment status |

---

## Equipment data

All equipment is stored in **Firestore** — it will appear automatically on any machine running the app with the correct `firebase.config.js`. No data migration needed when moving to a new computer.

---

## Moving to a new computer

1. Install requirements above
2. Clone the repo
3. Run `npm install`
4. Copy `local.config.js` and `firebase.config.js` from the old machine
5. Run `start.bat`
