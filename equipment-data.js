const EQUIPMENT = [
  // Software Apps (local launch)
  { name: "ATEM Software Control", appKey: "atem-software-control", category: "software", icon: "fa-tv",              notes: "Blackmagic ATEM switcher control" },
  { name: "ATEM Setup",            appKey: "atem-setup",            category: "software", icon: "fa-gear",            notes: "Blackmagic ATEM configuration" },
  { name: "DaVinci Resolve",       appKey: "davinci-resolve",       category: "software", icon: "fa-film",            notes: "Video editing & color grading" },
  { name: "HyperDeck Utility",     appKey: "hyperdeck-utility",     category: "software", icon: "fa-hdd",             notes: "Blackmagic HyperDeck management" },
  { name: "Videohub Control",      appKey: "videohub-control",      category: "software", icon: "fa-diagram-project", notes: "Blackmagic Video Hub routing" },
  { name: "AJA Control Room",      appKey: "aja-control-room",      category: "software", icon: "fa-circle-play",     notes: "AJA capture & playback" },
  { name: "OBS Studio",            appKey: "obs-studio",            category: "software", icon: "fa-broadcast-tower", notes: "Live streaming & recording" },
  { name: "VNC Viewer",            appKey: "vnc-viewer",            category: "software", icon: "fa-desktop",         notes: "Remote desktop access" },
  { name: "PuTTY",                 appKey: "putty",                 category: "software", icon: "fa-terminal",        notes: "SSH / serial terminal" },


  // Computing
  { name: "Raspberry Pi 5",         ip: "192.168.0.115", category: "computing", icon: "fa-microchip",          user: "piuser", pass: "piuser",       notes: "" },
  { name: "Raspberry Pi 4",         ip: "192.168.0.101", category: "computing", icon: "fa-microchip",          user: "",       pass: "",             notes: "StreamDeck 15-button controller" },
  { name: "Lenovo PC",              ip: "192.168.0.206", category: "computing", icon: "fa-desktop",            user: "admin",  pass: "admin",        notes: "" },
  { name: "MAC / H2R / Companion",  ip: "192.168.0.205", category: "computing", icon: "fa-laptop",             user: "",       pass: "fghjkl",       notes: "" },

  // Network
  { name: "Netgear Switch 728",     ip: "192.168.0.199", category: "network",   icon: "fa-network-wired",      user: "",       pass: "password",     notes: "VLAN 1-4, VLAN 7 (NDI)" },
  { name: "Netgear Wireless Router",ip: "",              category: "network",   icon: "fa-wifi",               user: "admin",  pass: "admin2025!",   notes: "SSID: StreamWave / PW: asd1234" },
  { name: "Netgear JGS-524PE",      ip: "192.168.0.239", category: "network",   icon: "fa-network-wired",      user: "",       pass: "password",     notes: "" },
  { name: "TP-Link E101 Ext AP",    ip: "",              category: "network",   icon: "fa-wifi",               user: "admin",  pass: "admin2025!",   notes: "SSID: SWT Talley Lights / PW: psd1234" },

  // Cameras
  { name: "NDX PTZ Camera",         ip: "192.168.0.200", category: "cameras",   icon: "fa-video",              user: "admin",  pass: "admin",        notes: "" },
  { name: "Avkans PTZ Camera",      ip: "192.168.0.203", category: "cameras",   icon: "fa-video",              user: "admin",  pass: "admin123",     notes: "" },
  { name: "Avkans PTZ Controller",  ip: "192.168.0.204", category: "cameras",   icon: "fa-gamepad",            user: "admin",  pass: "admin",        notes: "" },

  // Encoders / Decoders
  { name: "Kiloview",               ip: "192.168.0.201", category: "encoders",  icon: "fa-broadcast-tower",    user: "admin",  pass: "Kiloview2025", notes: "" },
  { name: "Kilo D300 Decoder",      ip: "192.168.0.202", category: "encoders",  icon: "fa-broadcast-tower",    user: "admin",  pass: "Kiloview2025", notes: "" },
  { name: "AJA Helo Encoder",       ip: "192.168.0.242", category: "encoders",  icon: "fa-film",               user: "",       pass: "",             notes: "" },
  { name: "Web Presenter",          ip: "192.168.0.249", category: "encoders",  icon: "fa-globe",              user: "",       pass: "",             notes: "" },

  // ATEMs
  { name: "ATEM 1 Extreme HDMI",    ip: "192.168.0.250", category: "atems",     icon: "fa-sliders",            user: "",       pass: "",             notes: "" },
  { name: "ATEM 2 Extreme ISO",     ip: "192.168.0.251", category: "atems",     icon: "fa-sliders",            user: "",       pass: "",             notes: "" },
  { name: "ATEM 3 Mini Pro",        ip: "192.168.0.252", category: "atems",     icon: "fa-sliders",            user: "",       pass: "",             notes: "" },
  { name: "ATEM Constellation",     ip: "192.168.0.253", category: "atems",     icon: "fa-sliders",            user: "",       pass: "",             notes: "" },

  // HyperDecks
  { name: "HyperDeck #1",           ip: "192.168.0.243", category: "hyperdecks",icon: "fa-hdd",                user: "",       pass: "",             notes: "Main One Clips" },
  { name: "HyperDeck #2",           ip: "192.168.0.244", category: "hyperdecks",icon: "fa-hdd",                user: "",       pass: "",             notes: "" },
  { name: "HyperDeck #3",           ip: "192.168.0.245", category: "hyperdecks",icon: "fa-hdd",                user: "",       pass: "",             notes: "" },
  { name: "HyperDeck #4",           ip: "192.168.0.246", category: "hyperdecks",icon: "fa-hdd",                user: "",       pass: "",             notes: "" },
  { name: "HyperDeck #5",           ip: "192.168.0.247", category: "hyperdecks",icon: "fa-hdd",                user: "",       pass: "",             notes: "" },

  // Routing / Distribution
  { name: "Blackmagic Video Hub",   ip: "192.168.0.211", category: "routing",   icon: "fa-diagram-project",    user: "",       pass: "",             notes: "" },
];
