# 🎲 Azul Cintra - Digital Implementation

A sophisticated digital adaptation of the Azul board game featuring intelligent AI opponents and a stunning dark mode interface with luminous visual effects.

## 🎮 Game Overview

This is a 2-player implementation of Azul where players draft colorful tiles from factories to complete pattern bands on their player boards. The game combines strategic tile placement with beautiful visual effects in a dark, luminous theme.

## 🧩 Core Game Mechanics

### 🚀 Setup (2 Players)
- **Factories**: Use 5 factories for tile distribution
- **Player Boards**: Each player gets a board A with 8 pattern bands (non-joker side visible)
- **Glazier**: Position the glazier token above column 1 for each player
- **Round Tracker**: Fill indicator with 6 round tiles (1 per round), drawn randomly
- **Factory Fill**: Each factory starts with 4 tiles from the bag

### 🔄 Game Flow (Human vs AI)

#### Main Action Options:
1. **Draft & Place**:
   - Take all tiles of one color from a factory or the center
   - If taking from center first: gain first player token and move down 1 on broken glass track
   - Place tiles on a single band under or to the right of the glazier
   - Move glazier to the chosen band
   - Excess tiles go to the tower and penalize via broken glass

2. **Reset Glazier**:
   - Move glazier to column 1 (or leftmost available band) instead of drafting
   - Ends the turn immediately

#### Turn Resolution:
- Refill factories or pass to next player
- Round ends when all factories and center are empty
- Discard one round tile and refill factories for next round

### ✅ Band Completion
When a band receives 5 tiles:
- Choose one tile to glaze (lowest background), send 4 others to tower
- Flip band (1st completion) or remove it (2nd completion)
- **Immediate Scoring**: Base value + right columns bonus + round bonus
- Glazier remains on the completed band

## 🧮 Official Scoring System (Board A)

### 🌟 Instant Score (Per Completed Band)
1. **Base Value**: Printed value under column [1, 2, 3, 4, 2, 2, 1, 1] for columns 1→8
2. **Right Columns Bonus**: Sum of values from each completed column to the right
3. **Round Bonus**: +1 point per tile matching the current round color in this band

### 💥 Broken Glass Penalty Track
- Each excess tile or first player token acquisition moves you down 1 space
- Reaching -18: Apply -18 points immediately, reset track to zero
- End game: Subtract total accumulated penalty (≤ -18 cumulative; never below 0 final score)

### 🏁 End Game Scoring (After 6 Rounds)
1. **Remaining Tiles**: +1 point for every group of 3 tiles in incomplete bands
2. **Broken Glass Subtraction**: Apply accumulated penalties
3. **Board A Ornament Bonus**: For each column pair (1-2, 3-4, 5-6, 7-8):
   - 2 completed = +3 points
   - 3 completed = +6 points
   - 4 completed = +10 points

## 🧠 AI Behavior & Strategy

### 🔍 Decision Criteria
The AI evaluates each possible draft action considering:
1. **Tile Availability**: Number of tiles available from each source
2. **Score Estimation**: Base value + right bonus + round bonus - glass penalty
3. **Accessibility**: Bands within reach of current glazier position
4. **Strategic Positioning**: Future opportunities and board state

### 📊 AI Decision Process
```
For each source (factory or center):
  For each available color:
    Simulate placement on accessible bands
    Calculate net_score = potential_gain - penalties
    Consider reset_glazier option if no direct access
    
Choose highest net_score option with small random variance
Execute: draft + place OR reset_glazier
```

### 🎯 Advanced AI Strategy
- **End Game Focus**: Prioritize completing adjacent bands in same pairs for ornament bonuses
- **Predictive Analysis**: Probability calculations for future round colors and tile availability
- **Risk Assessment**: Balance immediate gains vs. long-term positioning

## 🖤 Dark Mode Visual Design

### 🎨 Visual Aesthetics
- **Background**: Deep black with anthracite marble textures and gold/white accents
- **Tiles**: Translucent with luminous glow and subtle rainbow reflections
- **Glazier**: Neon blue (human) / red (AI) with animated halos
- **Broken Glass Track**: Translucent red/gray fragments that illuminate on contact
- **Digital Effects**: Blurred backgrounds with luminous bokeh resembling stained glass

### ✨ Animation System
1. **Drafting**: Tiles glide along luminous trajectories toward player hand
2. **Placement**: Glazier slides with glow effects on destination
3. **Completion**: Radial flash with sparkling particles, glazed tile rises to icon
4. **Broken Glass**: Fragmented fall effects with crystalline sound and visual sparks
5. **Scoring**: Floating +N numbers with luminous background fade
6. **Glazier Reset**: Luminous trajectory to column 1 with visual reactivation of accessible columns

### 🧩 User Experience
- **Accessibility**: Clear highlighting of available bands and actions
- **HUD Elements**: Score bars, broken glass track, and round color prominently displayed with high contrast
- **End Game**: Fade transition to dark stained glass texture with soothing reflections
- **Final Summary**: Luminous icons for ornament bonuses and comparative human vs AI scoring

## 🛠️ Technical Implementation

Built with modern web technologies for smooth performance and beautiful visuals:
- **React + TypeScript** for robust component architecture
- **Vite** for fast development and optimized builds
- **CSS3 animations** for smooth visual effects
- **Advanced game logic** with comprehensive AI decision-making

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## 🎯 Features

- ✅ Complete Azul game implementation with official rules
- 🤖 Intelligent AI opponent with strategic decision-making
- 🌙 Stunning dark mode with luminous effects
- ✨ Smooth animations and particle effects
- 📊 Comprehensive scoring system
- 🎨 Beautiful stained glass aesthetic
- 🔄 6-round game structure with random round tiles
- 🏆 End-game ornament bonus calculations

---

*Experience the beauty of Azul in a luminous digital environment where strategy meets stunning visual design.*
