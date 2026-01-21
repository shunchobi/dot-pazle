import { Game } from './game.js';
import { levels } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const levelSelect = document.getElementById('level-select');
    const resetBtn = document.getElementById('reset-btn');
    const creatorModeCheckbox = document.getElementById('creator-mode');
    const outputData = document.getElementById('output-data');
    const copyDataBtn = document.getElementById('copy-data-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');

    // Populate level select
    levels.forEach((level, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = level.name;
        levelSelect.appendChild(option);
    });

    let game = new Game(canvas);

    // Initial load if levels exist
    if (levels.length > 0) {
        levelSelect.value = 0;
        game.loadLevel(levels[0]);
    }

    // Event Listeners
    levelSelect.addEventListener('change', (e) => {
        const index = e.target.value;
        if (index !== "") {
            game.loadLevel(levels[index]);
        }
    });

    resetBtn.addEventListener('click', () => {
        game.reset();
    });

    creatorModeCheckbox.addEventListener('change', (e) => {
        game.setCreatorMode(e.target.checked);
    });

    copyDataBtn.addEventListener('click', () => {
        outputData.select();
        document.execCommand('copy');
        alert('Coordinates copied to clipboard!');
    });

    // Expose a callback for the game to report recorded dots
    game.onDotsRecorded = (dots) => {
        outputData.value = JSON.stringify(dots);
    };
    
    nextLevelBtn.addEventListener('click', () => {
        const currentLevelIndex = parseInt(levelSelect.value);
        const nextIndex = currentLevelIndex + 1;
        if (nextIndex < levels.length) {
            levelSelect.value = nextIndex;
            game.loadLevel(levels[nextIndex]);
        } else {
            alert("No more levels! Great job!");
        }
    });
});
