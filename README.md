# GearOps — Equipment Dashboard

A local network equipment dashboard for StreamWave production gear. Manages cameras, encoders, ATEMs, HyperDecks, and more.

---

## Requirements

| Software | Download |
|---|---|
| **Node.js** | https://nodejs.org |
| **Git** | https://git-scm.com |
| **FFmpeg** *(capture preview only)* | https://www.gyan.dev/ffmpeg/builds/ |
| **Brave Browser** *(popout feature only)* | https://brave.com |

**FFmpeg:** Download the full build, extract it, and place `ffmpeg.exe` at `C:\ffmpeg\bin\ffmpeg.exe`.

---

## Installation

```bash
git clone https://github.com/markbritton-hue/swptools.git
cd swptools
npm install
```

---

## Configuration

Copy the example config and fill in your values:
```bash
copy local.config.example.js local.config.js
```

Edit `local.config.js` with paths to your local apps (OBS, ATEM Software Control, etc.), Brave browser path, and optional Companion settings.

No Firebase or cloud account needed — all equipment data is stored locally in `devices.json`.

---

## Running the app

Double-click **`start.bat`** — or from a terminal:
```bash
node server.js
```

Then open: `http://localhost:8080`

---

## First-time setup

On first run `devices.json` is empty. You have two options:

### Option A — Import from Google Sheets
1. Prepare a Google Sheet with your equipment list (columns: Name, IP Address, Category, Username, Password, Notes, Monitor)
2. Share the sheet: **File → Share → Anyone with the link can view**
3. Open `http://localhost:8080/setup.html`
4. Paste the sheet URL and click **Load Sheet**
5. Map your columns to GearOps fields and click **Import Devices**

### Option B — Add devices manually
1. Open the main dashboard at `http://localhost:8080`
2. Click the **Edit** button (top right)
3. Click **Add Device** and fill in the details

---

## Using the app

### Equipment dashboard (`/`)
- **Cards** show all your gear with IP, status, credentials, and action buttons
- **Filter bar** lets you filter by category (Computing, Cameras, ATEMs, etc.)
- **Search** finds devices by name or IP
- **Sort** by name, category, status, or IP
- **Online/Offline badges** appear on devices with monitoring enabled (pinged every 30s)
- **Edit mode** — click **Edit** to add, edit, or delete devices
- **Browse / Popout** buttons open a device's web UI in a new tab or app window
- **Launch** buttons start local applications directly

### Control Room (`/capture.html`)
- **Capture preview** — select a capture card and click Start Preview for a live feed
- **Browser panel** — embedded browser for YouTube streams or local device UIs
- **Equipment status** — live online/offline status for all monitored devices
- **Clock** — large timecode display for production timing

### Setup / Import (`/setup.html`)
- Import equipment from a Google Sheet
- Accessible any time to re-import or add bulk devices

---

## Accessing from other devices (iPad, phone, etc.)

Run `ipconfig` in a terminal and find your **IPv4 Address** (e.g. `192.168.0.121`).

On any device on the same network: `http://192.168.0.121:8080`

### Add to iPad home screen
1. Open Safari and go to the app URL
2. Tap **Share → Add to Home Screen**
3. GearOps will appear with its icon

---

## Equipment data

All equipment is stored in `devices.json`. This file is gitignored — back it up or copy it when moving to a new machine.

---

## Moving to a new computer

1. Install requirements
2. Clone the repo and run `npm install`
3. Copy `local.config.js` and `devices.json` from the old machine
4. Run `start.bat`
