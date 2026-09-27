# Local — Minimalist Worldwide Travel Application

> **Engineering Baseline**: Version 8 Final (24 September 2026)  
> **UI Design Movement**: Tactile Cerulean Travel Companion (Soft Neumorphism & Clean Editorial Minimalism)  
> **Target Markets**: India, United Kingdom, United States, Australia, Canada (Pilot Hub: Kyoto, Japan)

---

## 1. System Overview

**Local** is a high-reliability, security-hardened, offline-first worldwide travel application. It empowers travelers to discover nearby essentials, access verified emergency guidance, navigate turn-by-turn routes with synthesized acoustic voice guidance, and maintain synchronized saved places without requiring continuous cellular connectivity.

The user interface strictly adheres to the **Tactile Cerulean Design System** across all 8 core screen definitions:
- **Screen 0 (Explore / Surroundings Stream)**: Live positioning hero, utility ribbon, inset search well, category filter pills, proximity-indexed cards, interactive vector map toggle, and persistent tactile emergency SOS trigger.
- **Screen 1 (Place Details)**: Operating schedule with real-time open status, Walk vs Drive route comparison, Start Walking Directions, Save to Offline List, and Community Correction reporting.
- **Screen 2 (Live Voice Turn Guidance HUD)**: Acoustic signal indicator, turn direction arrows, distance countdown, street names in dual scripts (English & Japanese Kanji), steps drawer, voice volume shortcut, and SOS quick action.
- **Screen 3 (Audio & Voice Engine Modal)**: Acoustic volume modes (Low, Standard, Outdoor Boost), interactive voice synthesis test player, chime sound toggles, and offline TTS engine status.
- **Screen 4 (Turn-by-Turn Route Preview)**: Step-by-step route breakdown, OSRM validated badge, pedestrian safety markers, and launch live turn guidance trigger.
- **Screen 5 (Offline Storage & Regional Packs Vault)**: Segmented storage breakdown (Vector Basemaps 840 MB, Search & POIs 320 MB, Neural TTS Voice 160 MB, Cached Images 100 MB), active regional packs, and simulated JWS ES256 cryptographic download verification.
- **Screen 6 (Emergency & SOS Hub)**: 1-tap coordinate copy for dispatchers, direct emergency hotlines (110, 119, 112, 911, 000), bilingual responder cards with audio pronunciation, and nearest verified 24/7 trauma facility.
- **Screen 7 (Travel Toolkit & Country Dossier)**: Country briefing (calling code, time zones, plug types, transit etiquette), interactive tactile currency converter with numeric keypad, and live weather conditions.

---

## 2. Engineering Architecture & Security Baseline (v8 Spec)

### Core Invariants
- **Deterministic Proximity Ranking**: Search results sorted strictly by distance in metres, then by place ID (Section 10).
- **Offline-First Guarantee**: All discovery, emergency hotlines, and route previews operate 100% in airplane mode with bundled packs (Release Gate G4).
- **Cryptographic Offline Packs**: Signed manifests using JWS compact serialization with ES256 and SHA-256 hashes (Section 13 & 23.4).
- **RFC 9457 Problem Details**: All errors return structured `application/problem+json` bodies with stable error codes (e.g. `COVERAGE_UNSUPPORTED`, `VALIDATION_FAILED`, `OBJECT_NOT_FOUND`).
- **Privacy & Data Minimization**: Zero server-side persistence of live travel trails or precise coordinates (Section 16.2).
- **Two-Person Rule**: Emergency information publication strictly requires two distinct editorial actors before entering production manifests (Section 16.1).

---

## 3. Getting Started

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### API Contracts
See [openapi.yaml](openapi.yaml) for the full OpenAPI 3.0 specification covering `/v1/coverage`, `/v1/places/nearby`, `/v1/routes`, `/v1/content/{country}/{locale}`, `/v1/fx`, and `/v1/reports`.
