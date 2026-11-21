# San Coral: High Tide

[![Make GTA 6 on make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank on make.fun](https://make.fun/badge/gta6-01/pinrocks/san-coral-3d/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward on make.fun](https://make.fun/badge/gta6-01/pinrocks/san-coral-3d/reward.svg)](https://make.fun/bounty/gta6-01)

**San Coral: High Tide** is a browser-native 3D WebGL open-world crime action game built from scratch for the [Make GTA 6 (`gta6-01`)](https://make.fun/bounty/gta6-01) competition on [make.fun](https://make.fun/r/zc8m81ne).

Step into the shoes of getaway specialist **Elena Navarro** across **San Coral** — a sun-soaked `960m x 960m` coastal metropolis spanning 8 districts (`Playa Coral`, `Marina del Faro`, `Distrito Financiero`, `Barrio Mirador`, `Puerto Industrial`, `Colinas Doradas`, `Cayo Esmeralda`, and `Autopista Costera`), complete with offline procedural textures, Web Audio synth radio, articulated pedestrians, lane-following traffic, stealable sports cars, sportbikes, and speedboats, a 5-star **Guardia Metropolitana** police & `Halcón-1` spotlight helicopter response, a 9-mission Act I–III story campaign, repeatable side activities, and 3-slot persistent safehouse saves.

## Play Locally

Requires Node.js 22.18+ and a modern desktop browser (Chrome recommended). Zero install or build step needed:

```bash
node serve.ts
```

Then open `http://localhost:8080` in Chrome (`PORT=8080 node serve.ts --no-open` is also supported).

## Key Features

- **8 Sun-Soaked Districts:** `Playa Coral`, `Marina del Faro`, `Distrito Financiero`, `Barrio Mirador`, `Puerto Industrial`, `Colinas Doradas`, `Cayo Esmeralda` (offshore causeway island), and `Autopista Costera`.
- **Vehicles & Watercraft:** Multi-part 3D `Veloz GT` sports coupe, `Bravo V8` convertible, `Toro 4x4` SUV, `Rayo 900` leaning sportbike, `Guardia Interceptor` cruiser, and `Marlin Jet` marina speedboat with handbrake drift & nitro boost.
- **5-Star Guardia Metropolitana & Halcón-1 Helicopter:** Escalating patrol cruisers, roadblock barricades, harbor boats, SWAT interceptors, and overhead `Halcón-1` volumetric searchlight chopper with line-of-sight evasion.
- **9-Mission Story Campaign & Persistent Saves:** Original Act I–III campaign with **Elena Navarro**, **Mateo Ríos**, **Capt. Valeria Cruz**, and **Don Serrano**, plus repeatable side contracts, safehouse upgrades, and 3-slot `localStorage` save/load at **Villa Solis**.

## Controls

- **Move / Drive / Steer:** `W A S D` or `Arrow Keys`
- **Sprint (On Foot) / Nitro Boost (Vehicle):** `Shift`
- **Dodge Roll / Handbrake Drift:** `Space`
- **Steal / Enter / Exit Vehicle or Boat:** `F` or `E`
- **Fire / Over-Shoulder Aim:** `Left Click` / `Right Click`
- **Weapons (`1`–`5`):** Unarmed, Viper 9mm, Vendaval SMG, Corsario Carbine, Trueno Heavy Launcher
- **Cycle Synth Radio (In Vehicle):** `R`
- **Camera Mode:** `C` or `V`
- **Safehouse Save, 9-Mission Campaign, Upgrades & City Map:** `Esc`, `P`, or `M`

## Build Output Dossier

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built for [make.fun/bounty/gta6-01](https://make.fun/bounty/gta6-01) · Join via [make.fun/r/zc8m81ne](https://make.fun/r/zc8m81ne).
