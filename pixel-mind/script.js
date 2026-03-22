let level = 1;
let score = 0;
let matrix = [];
let playerMatrix = [];
let isReady = false;
let tiles = [];

const arena = document.getElementById('arena');
const levelEl = document.getElementById('level');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('start-btn');
const gameOverModal = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

// Sound Effects
const sfxPress = document.getElementById('sfx-press');
const sfxFail = document.getElementById('sfx-fail');
const sfxWin = document.getElementById('sfx-win');

// Create 4x4 Grid
function setupGrid() {
    arena.innerHTML = '';
    tiles = [];
    for (let i = 0; i < 16; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.id = i;
        tile.onclick = () => handleTileClick(i);
        arena.appendChild(tile);
        tiles.push(tile);
    }
}

startBtn.onclick = startNextLevel;

async function startNextLevel() {
    isReady = false;
    startBtn.style.display = 'none';
    statusEl.innerText = "SCANNING PATTERN...";
    playerMatrix = [];
    
    // Generate random tile ID
    matrix.push(Math.floor(Math.random() * 16));
    
    // Play sequence
    for (let id of matrix) {
        await flashTile(id);
        await new Promise(r => setTimeout(r, 400));
    }
    
    statusEl.innerText = "YOUR TURN: REPLICATE";
    isReady = true;
}

function flashTile(id) {
    return new Promise(resolve => {
        tiles[id].classList.add('flash');
        sfxPress.currentTime = 0;
        sfxPress.play();
        setTimeout(() => {
            tiles[id].classList.remove('flash');
            resolve();
        }, 500);
    });
}

function handleTileClick(id) {
    if (!isReady) return;
    
    tiles[id].classList.add('flash');
    sfxPress.currentTime = 0;
    sfxPress.play();
    setTimeout(() => tiles[id].classList.remove('flash'), 300);
    
    playerMatrix.push(id);
    
    // Check correctness
    const currentStep = playerMatrix.length - 1;
    if (playerMatrix[currentStep] !== matrix[currentStep]) {
        handleGameOver(id);
        return;
    }
    
    // Level Complete
    if (playerMatrix.length === matrix.length) {
        isReady = false;
        score += level * 100;
        level++;
        scoreEl.innerText = score;
        levelEl.innerText = level;
        sfxWin.play();
        setTimeout(startNextLevel, 1000);
    }
}

function handleGameOver(id) {
    isReady = false;
    tiles[id].classList.add('wrong');
    arena.classList.add('shake');
    sfxFail.play();
    
    setTimeout(() => {
        gameOverModal.classList.remove('hidden');
        finalScoreEl.innerText = score;
    }, 1000);
}

setupGrid();
