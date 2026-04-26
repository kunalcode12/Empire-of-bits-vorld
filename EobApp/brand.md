# Brand - Empire of Bits (EOB)

_Status: active_
_Created: 2026-04-23_

## Brand Positioning

Empire of Bits is a retro-futurist Web3 arcade universe: nostalgic 80s/90s arcade energy with modern premium execution.  
The product should feel playful and electric, but never cheap or chaotic.

## Visual Direction

- **Core vibe:** Vintage arcade + neon cyberpunk + polished glassmorphism
- **Design goals:** High contrast, colorful, animated, readable, premium
- **Emotional tone:** Excitement, momentum, collectability, progression

## Color System

Use these as source tokens for all key UI decisions.

### Core Palette

- `Arcade Black` `#07070C` (primary background)
- `Cabinet Navy` `#101426` (secondary surface)
- `Pixel Purple` `#6F2BFF` (primary brand accent)
- `Neon Cyan` `#00E5FF` (interactive highlight)
- `Laser Pink` `#FF2DBA` (energy accent)
- `Coin Gold` `#FFC83D` (reward/status accent)
- `CRT Mint` `#27F5B8` (success/accent)
- `Danger Red` `#FF4D6D` (error/destructive)
- `Cloud White` `#F7F8FF` (high-emphasis text)

### Neutral Ramp

- `N900` `#07070C`
- `N800` `#111323`
- `N700` `#1A1E33`
- `N600` `#252A44`
- `N500` `#3A4060`
- `N400` `#5E678E`
- `N300` `#8A93BC`
- `N200` `#B6BDDD`
- `N100` `#DDE1F5`
- `N050` `#F7F8FF`

### Semantic Usage

- **Primary actions:** Pixel Purple -> Neon Cyan gradient
- **Secondary actions:** Cabinet Navy with Neon Cyan border/glow
- **Success:** CRT Mint
- **Warning:** Coin Gold
- **Error:** Danger Red
- **Informational highlights:** Neon Cyan

## Gradients

- **Hero Gradient:** `linear(135deg, #6F2BFF 0%, #FF2DBA 48%, #00E5FF 100%)`
- **Action Gradient:** `linear(90deg, #6F2BFF 0%, #00E5FF 100%)`
- **Reward Gradient:** `linear(135deg, #FFC83D 0%, #FF8A00 100%)`
- **Background Aura:** layered radial glows using `#6F2BFF`, `#FF2DBA`, `#00E5FF` at low alpha

## Typography

React Native-safe fallback stack:

- **Display / Headline:** `System` with heavy weight (`800/900`), uppercase letterspacing
- **Body:** `System` regular/medium (`400/500`)
- **Numeric / Codes / OTP:** `monospace` (`600/700`)

When custom font adoption is enabled later:

- **Display:** Orbitron / Exo 2
- **Body:** Inter / Space Grotesk
- **Mono:** JetBrains Mono

## Type Scale

- `Display XL` 40/44
- `Display L` 32/36
- `Heading` 24/30
- `Title` 20/26
- `Body` 16/24
- `Body Small` 14/20
- `Caption` 12/16
- `Micro` 11/14

## Spacing and Shape

- 4pt base grid
- Common spacing rhythm: `4, 8, 12, 16, 24, 32`
- Radius:
  - Inputs/buttons: `12`
  - Cards: `20`
  - Pills/chips: `999`

## Surfaces and Effects

- **Primary background:** deep dark with subtle grain/crt overlays
- **Cards:** dark glass (`rgba(20, 24, 44, 0.62)`) + soft border glow
- **Borders:** mostly 1px with neon alpha accents
- **Glow rule:** use sparingly on CTA, focus states, and key badges only
- **Shadows:** subtle violet/cyan shadows over black, avoid muddy gray shadows

## Motion Guidelines

- **Purpose-first motion:** only for hierarchy, feedback, and orientation
- **Durations:** 100ms (micro), 160ms (button/input), 220ms (panel/card), 320ms (hero reveal)
- **Easing:** enter `ease-out`, exit `ease-in`, move `ease-in-out`
- **Preferred properties:** `opacity`, `transform`
- **Avoid:** `transition: all`, heavy layout animations
- **Reduced motion:** all decorative animation must disable instantly when reduced motion is on

## Component Styling Rules

- **Buttons:** gradient fill + subtle inner highlight + strong readable text
- **Inputs:** dark inset surface, neon focus ring, high-contrast placeholder
- **Cards:** glassmorphic with neon edge tint
- **Badges:** arcade chip style, compact uppercase labels
- **Errors:** high-contrast red panel with icon and actionable message
- **OTP fields:** mono digits, generous tracking, centered alignment

## Copy Tone

- Short, energetic, and clear
- Keep it game-like but not childish
- Prefer active verbs: _Start_, _Play_, _Verify_, _Continue_, _Claim_
- Avoid corporate/formal phrases

## Accessibility Constraints (Non-Negotiable)

- Body text contrast target >= 4.5:1
- Interactive controls >= 44x44 touch area
- Visible focus styles on every interactive element
- Motion respects reduced-motion preference
- Color is never the only status indicator

## Do / Don't

- **Do:** use color boldly with disciplined hierarchy
- **Do:** keep dark surfaces clean and readable
- **Do:** make states obvious (idle/hover/pressed/loading/error)
- **Don't:** use flat grayscale-only UI
- **Don't:** over-glow everything
- **Don't:** compromise readability for style

## Initial Screen Targets

For auth/onboarding and get started flows:

- Retro arcade hero identity at top
- Layered animated neon background accents
- Glass card main interaction zone
- Distinct, colorful CTA with clear progression
- Branded labels and helper text for trust
