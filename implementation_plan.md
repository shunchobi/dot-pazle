# Dot-to-Dot Game Implementation Plan

## Goal Description
Create a browser-based Dot-to-Dot puzzle game featuring a Sea Turtle.
The game will allow users to click or drag between numbered dots in sequence (1 -> 2 -> 3...) to reveal the drawing.

## User Review Required
> [!IMPORTANT]
> **Data Strategy**: The generated image is a static PNG. To make an *interactive* game where the computer validates the connections, I need specific X,Y coordinates for each dot.
> **Proposal**: I will create a `turtle-data.js` file with a set of hardcoded coordinates that approximate a turtle shape, rather than trying to process the PNG. The game will interpret these coordinates to draw the dots and validation lines.

## Proposed Changes

### Project Structure
Root
├── index.html
├── style.css
├── src
│   ├── main.js (Game Entry)
│   ├── game.js (Game Logic)
│   └── data.js (Puzzle Coordinates)
└── assets
    └── (generated images if used for background)

### logic/data
#### [NEW] [data.js](file:///wsl.localhost/Ubuntu-24.04/home/kondo/projects/dot-image/src/data.js)
- Export an array of objects: `{ id: 1, x: 100, y: 200 }`.
- I will manually draft a set of coordinates that form a turtle shape.

### UI/Rendering
#### [NEW] [index.html](file:///wsl.localhost/Ubuntu-24.04/home/kondo/projects/dot-image/index.html)
- Canvas element for rendering lines and dots.
- UI overlay for "Game Over" / "Success" message.

#### [NEW] [game.js](file:///wsl.localhost/Ubuntu-24.04/home/kondo/projects/dot-image/src/game.js)
- **State**: `currentDotIndex`, `isCompleted`.
- **Input**: Mouse click / touch on dots.
- **Render Loop**:
    1. Clear Canvas.
    2. Draw completed lines (1 to `currentDotIndex`).
    3. Draw dynamic line (from `currentDotIndex` to mouse) - optional.
    4. Draw dots (Active vs Inactive).
- **Validation**: Check if click is near the `next` dot.

## Verification Plan

### Automated Tests
- None planned for this visual prototype.

### Manual Verification
1. Open `index.html` in browser.
2. Verify dots appear in a turtle-like shape.
3. Click 1 -> 2 -> 3... and verify lines connect.
4. Verify incorrect clicks are ignored.
5. Verify "Completion" state (e.g., full outline drawn, success message).
