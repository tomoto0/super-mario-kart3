# 🏎️ 3D Super Mario Kart - Browser Racing Game

A fully-featured 3D kart racing game built with Three.js, inspired by the classic Mario Kart series. Experience thrilling races with realistic physics, AI opponents, and multiple themed courses!

## ✨ Features

### Core Gameplay
- **3D Racing Engine**: Powered by Three.js with realistic physics and smooth 60fps gameplay
- **Multiple Characters**: Choose from 8 unique Mario-style characters, each with different stats
- **4+ Themed Courses**: Race through Grassland, Snow, Castle, and Rainbow Road environments
- **AI Opponents**: Intelligent computer-controlled racers with configurable difficulty
- **Power-up System**: Use items like missiles, shields, boosts, and course-specific abilities
- **Course Hazards**: Themed enemies that crash your kart — Goombas & Piranha Plants (Mario Circuit), sliding Penguins (Sherbet Land), slamming Thwomps & rotating Fire Bars (Bowser's Castle), and lunging Chain Chomps (Rainbow Road). A Star makes you immune; they appear as red markers on the minimap, and the AI tries to dodge them too.
- **Lap Racing**: Complete 3-lap races with position tracking and timing

### Advanced Systems
- **Dynamic Camera**: Multiple camera modes with cinematic effects and smooth transitions
- **Particle Effects**: Visual flair with exhaust, sparks, explosions, and environmental particles  
- **Audio System**: Immersive sound effects and background music with Web Audio API
- **Memory Management**: Object pooling and optimized rendering for smooth performance
- **Course Editor Ready**: JSON-based course system for easy track creation

### Technical Highlights
- **Modern Web Stack**: React 19, TypeScript, Vite, TailwindCSS
- **Three.js Integration**: Advanced 3D graphics with shaders and post-processing
- **Responsive Design**: Works on desktop and mobile devices
- **Production Ready**: Express server with proper build system

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation
```bash
# Clone the repository
git clone https://github.com/tomoto0/3d-super-mario-kart.git
cd 3d-super-mario-kart

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser to http://localhost:5173
```

### 🟢 No-build quick run (zero dependencies)

This build is **pure Three.js loaded from a CDN — no bundler, no `node_modules`, no build step.**
You can run it any of these ways:

```bash
# A) Zero-dependency static server (recommended)
npm start            # = node server/index.js  →  http://localhost:5173/game.html

# B) Any static server
npx serve client/public          # or:  python3 -m http.server -d client/public 5173

# C) Just open the file
#    Open client/public/game.html directly in a browser.
#    (An internet connection is needed the first time so Three.js can load from the CDN.)
```

### Play the Game
1. Visit `http://localhost:5173/game.html` for the main racing game
2. Or use `http://localhost:5173` for the React frontend

## 🎮 Game Controls

- **Arrow Keys / WASD**: Steer and accelerate
- **Space**: Use power-up item  
- **Shift**: Drift (hold while turning to build mini-turbo boost — blue → orange → purple)
- **R**: Reverse
- **P**: Pause game
- **C**: Cycle camera modes (chase / far / bumper)
- **M**: Toggle all sound on/off
- **B**: Toggle background music
- **Touch**: On-screen steer / drift / accelerate / item buttons appear on mobile

## 🏁 Course System

Courses are defined in JSON format for easy customization. The game includes several themed environments with unique features and challenges.

### Available Courses
- **🌱 Grassland Circuit**: Beginner-friendly with gentle curves
- **❄️ Sherbet Land**: Icy tracks with slippery surfaces
- **🏰 Bowser's Castle**: Challenging course with lava and obstacles  
- **🌈 Rainbow Road**: Expert-level floating track in space

## 🛠️ Development

### Project Structure
```
├── client/
│   ├── public/
│   │   ├── game.html          # Main game entry point
│   │   ├── js/                # Game engine files
│   │   ├── courses/           # Track definitions
│   │   └── assets/            # Audio and images
│   └── src/                   # React frontend
├── server/                    # Express backend
└── shared/                    # Common utilities
```

### Building for Production
```bash
# Build optimized version
pnpm build

# Start production server
pnpm start
```

## 🎨 Customization

The game is designed to be easily extensible with new characters, courses, and features through its modular JSON-based configuration system.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests for:
- New courses and characters
- Bug fixes and optimizations
- Feature enhancements
- Documentation improvements
