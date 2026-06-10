# 🏎️ Super Mario Kart 3 - Browser Racing Game

A fully-featured 3D kart racing game built with Three.js, inspired by Mario Kart 64. Experience thrilling races with arcade physics, AI opponents, and six richly themed courses!

## ✨ Features

### Core Gameplay
- **3D Racing Engine**: Powered by Three.js with arcade physics and smooth 60fps gameplay
- **Multiple Characters**: Choose from 8 unique Mario-style characters, each with different stats — kart size now scales with weight class, every hood wears the driver's initial, and drivers lean into corners and celebrate at the finish
- **6 Themed Courses**: Mario Circuit (grassland), **Koopa Troopa Beach** (ocean, palms, a rock arch and leaping fish), Sherbet Land (snow), **Kalimari Desert** (red mesas and a steam train that crosses the road at four level crossings — listen for the whistle!), Bowser's Castle (lava keep) and Rainbow Road (starry space)
- **Boost Pads & Slipstream**: Glowing chevron zippers on every course, plus an MK64-style draft — tail a rival closely for a second and get slung past them
- **AI Opponents**: Intelligent computer-controlled racers with configurable difficulty
- **Power-up System**: Mushrooms, shells (incl. the 1st-place-seeking Spiny Shell), bananas, Bob-ombs, Star, Lightning — now joined by the **Fake Item Box** trap and the **Golden Mushroom** (unlimited boosts for 7.5s)
- **Course Hazards**: A themed roster of enemies that crash your kart — Goombas, Koopa Troopas, Piranha Plants & Monty Moles (Mario Circuit); scuttling **Crabs**, arcing **Cheep-Cheeps** and ink-squirting **Bloopers** (Koopa Troopa Beach); sliding Penguins, waddling Snowmen & falling Icicles (Sherbet Land); swaying **Pokeys**, rolling **Tumbleweeds**, hopping **Fire Snakes**, the **Angry Sun** and a full-length **express train** with tanker, pipe-flatcar and caboose (Kalimari Desert); slamming Thwomps, rotating Fire Bars, leaping Podoboos & Flame Jets (Bowser's Castle); and lunging Chain Chomps, bouncing Comets & spinning Star Bars (Rainbow Road). A Star makes you immune; they appear as red markers on the minimap, and the AI tries to dodge them too.
- **Player-Only Menaces**: Some enemies single out *you* and leave the CPUs alone — the Blooper blackens your screen with ink (your steering wobbles until it drips off), and the Angry Sun circles overhead, flashes red, then dives at your kart
- **Final Lap Drama**: The music speeds up on the last lap, and confetti rains down at the finish
- **Lap Racing**: Complete 3-lap races with position tracking and timing

### Advanced Systems
- **Dynamic Camera**: Multiple camera modes with cinematic effects and smooth transitions
- **Particle Effects**: Visual flair with exhaust, sparks, explosions, and environmental particles  
- **Audio System**: Immersive sound effects and background music with Web Audio API
- **Memory Management**: Object pooling and optimized rendering for smooth performance
- **Course Editor Ready**: JSON-based course system for easy track creation

### Technical Highlights
- **Zero-build, classic scripts**: plain ES5/ES6 in `client/public/js/`, no bundler and no `node_modules` at runtime — Three.js r128 is loaded from a CDN
- **All graphics & SFX are procedural**: every mesh is built from Three.js primitives, textures are canvas-generated, and sound effects / the engine tone are synthesized with the Web Audio API (only the background music is real MP3 audio)
- **Responsive Design**: works on desktop and mobile (on-screen touch controls)
- **Tiny dependency-free server**: `server/index.js` is a static file server with no npm dependencies

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation
```bash
# Clone the repository
git clone https://github.com/tomoto0/super-mario-kart3.git
cd super-mario-kart3

# Start the dev server (no install/build needed — no runtime dependencies)
npm start

# Open browser to http://localhost:5173/game.html
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
1. Visit `http://localhost:5173/game.html` for the racing game (`/` redirects here too)

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

All courses now feature **rolling elevation** (hills and dips), and each plays its own background music.

### Available Courses
- **🌱 Mario Circuit**: Beginner-friendly, gentle rolling grassland curves
- **🏖️ Koopa Troopa Beach**: Sun-soaked sands around a tropical island, with a rock arch over the track
- **❄️ Sherbet Land**: Slippery ice over frozen, undulating hills
- **🌵 Kalimari Desert**: Red-mesa canyon country crossed by a steam train at four level crossings
- **🏰 Bowser's Castle**: Indoor stone walkways winding over a sea of lava, with angular right-angle (90°) corners
- **🌈 Rainbow Road**: Expert-level floating track high in space

## 🛠️ Development

### Project Structure
```
├── client/
│   └── public/
│       ├── game.html          # Game entry point (load this)
│       ├── css/style.css      # HUD & menu styling
│       ├── js/                # Game engine (17 ordered classic scripts on window.MK)
│       ├── music/             # Background-music MP3s
│       └── assets/            # Title art (everything else is procedural)
├── server/index.js            # Dependency-free static file server
└── CLAUDE.md                  # Architecture guide for contributors
```

The 17 scripts load in a fixed dependency order (see `game.html`): `config → utils → audio → input → particles → characters → kart → items → scenery → track → hazards → ai → camera → hud → courses → ui → game → main`. Everything attaches to one global `window.MK` namespace.

### Building for Production
There is **no build step** — `npm run build` is a no-op. Serve `client/public/` with any static file server (e.g. `npm start`).

## 🎨 Customization

The game is data-driven and easy to extend — characters and items live in `js/config.js`, course layouts/themes in `js/courses.js`, enemies in `js/hazards.js`, and procedural meshes in `js/characters.js` / `js/scenery.js`. See `CLAUDE.md` for the full architecture.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests for:
- New courses and characters
- Bug fixes and optimizations
- Feature enhancements
- Documentation improvements
