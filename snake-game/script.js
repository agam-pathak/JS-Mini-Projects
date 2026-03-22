const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayDesc = document.getElementById("overlay-desc");
const actionBtn = document.getElementById("action-btn");
const canvasWrapper = document.getElementById("canvas-wrapper");

// Grid Settings for 800x600 Canvas
const gridSize = 20;
const tileCountX = canvas.width / gridSize;  // 40
const tileCountY = canvas.height / gridSize; // 30
let gameSpeed = 100; // milliseconds

// Game State
let snake = [];
let food = { x: 0, y: 0, type: "normal" };
let goldFood = null; // High value, temporary food
let dx = 0; 
let dy = 0;
let score = 0;
let highScore = localStorage.getItem("snakeHighScoreV2") || 0;
let gameLoopId = null;
let gameActive = false;
let gameStarted = false;
let inputQueue = []; // Manage fast keystrokes to prevent 180 flips

// Particle System for floating "+10"
let particles = [];

// Audio Context for raw synthesized sounds (No external files needed)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    
    // Resume context if suspended (browser auto-play policies)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'eat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'eat-gold') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        const osc2 = audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.2);
        osc2.connect(gainNode);
        osc2.start(audioCtx.currentTime + 0.1);
        osc2.stop(audioCtx.currentTime + 0.2);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    }
}

// Initialize UI High Score Display
highScoreElement.textContent = highScore;

// Snake Initialization
function resetGame() {
    snake = [
        { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) },
        { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) + 1 },
        { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) + 2 }
    ];
    dx = 0;
    dy = -1; // Start moving UP
    score = 0;
    scoreElement.textContent = score;
    gameSpeed = 100;
    particles = [];
    goldFood = null;
    inputQueue = [];
    dx = 0;
    dy = -1; // Force reset direction to UP
    
    placeFood();
    
    // Clear direction queue and set default
    dx = 0;
    dy = -1;

    // Draw initial state
    ctx.fillStyle = "rgba(10, 10, 15, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawFood();
    drawSnake();
}

// Draw the Grid (Subtle Lines)
function drawGrid() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

// Screen Shake function
function triggerShake() {
    canvasWrapper.classList.remove("shake");
    // Trigger un-cache reflow to restart animation
    void canvasWrapper.offsetWidth; 
    canvasWrapper.classList.add("shake");
}

// Floating Particle System
function addParticle(x, y, text, color) {
    particles.push({
        x: x * gridSize + (gridSize/2),
        y: y * gridSize - 5,
        text: text,
        color: color,
        life: 1.0,
        dy: -1.5
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.life -= 0.04;
        p.y += p.dy;
        
        ctx.fillStyle = p.color.replace('rgba', '').replace('1)', `${Math.max(0, p.life)})`);
        ctx.font = "bold 18px 'Orbitron'";
        ctx.textAlign = "center";
        
        // Ensure color parsing falls back if regex fails
        if (!p.color.startsWith('rgba')) {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
        }
        
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1.0; // reset
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Game Loop
function update() {
    if (!gameActive) return;

    // Process Input Queue
    if (inputQueue.length > 0) {
        const nextInput = inputQueue.shift();
        dx = nextInput.x;
        dy = nextInput.y;
    }

    // Clear Canvas
    ctx.fillStyle = "rgba(10, 10, 15, 0.7)"; // Slight trailing effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();

    // Determine Head Next Position
    let headX = snake[0].x + dx;
    let headY = snake[0].y + dy;

    // ----- WRAP AROUND LOGIC -----
    if (headX < 0) headX = tileCountX - 1;
    else if (headX >= tileCountX) headX = 0;
    
    if (headY < 0) headY = tileCountY - 1;
    else if (headY >= tileCountY) headY = 0;

    // Check Self Collision
    if (checkSelfCollision(headX, headY)) {
        gameOver();
        return;
    }

    // Move Snake
    const head = { x: headX, y: headY };
    snake.unshift(head); // Add new head

    let ateFood = false;

    // Check Normal Food Collision
    if (head.x === food.x && head.y === food.y) {
        playSound('eat');
        score += 10;
        scoreElement.textContent = score;
        addParticle(head.x, head.y, "+10", "#ff0844");
        
        // Speed up very slightly to scale better on big board
        if (gameSpeed > 60) gameSpeed -= 1;
        
        placeFood();
        ateFood = true;

        // 10% chance to spawn gold food if it doesn't exist
        if (!goldFood && Math.random() < 0.1) {
            placeGoldFood();
        }
    } 
    // Check Gold Food Collision
    else if (goldFood && head.x === goldFood.x && head.y === goldFood.y) {
        playSound('eat-gold');
        score += 50;
        scoreElement.textContent = score;
        addParticle(head.x, head.y, "+50!!!", "#f6d365");
        goldFood = null; // Consume it
        ateFood = true;
    }

    if (!ateFood) {
        snake.pop(); // Remove tail if no food eaten
    }

    // Gold Food expiry logic
    if (goldFood) {
        goldFood.timer--;
        if (goldFood.timer <= 0) {
            goldFood = null; // Vanish
        }
    }

    drawFood();
    if (goldFood) drawGoldFood();
    drawSnake();
    updateParticles();

    gameLoopId = setTimeout(update, gameSpeed);
}

function checkSelfCollision(x, y) {
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === x && snake[i].y === y) return true;
    }
    return false;
}

// Draw Snake
function drawSnake() {
    snake.forEach((part, index) => {
        if (index === 0) {
            ctx.fillStyle = "#4facfe"; // Head
            ctx.shadowColor = "#4facfe";
        } else {
            // Gradient effect on body based on distance from head
            const opacity = Math.max(0.3, 1 - (index / snake.length) * 0.7);
            ctx.fillStyle = `rgba(0, 242, 254, ${opacity})`; 
            ctx.shadowColor = "transparent";
        }
        
        ctx.shadowBlur = index === 0 ? 15 : 0;
        ctx.beginPath();
        // Slightly smaller blocks so spacing exists in wrap-around
        ctx.roundRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2, 4);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
        
        // Draw Eyes on Head based on direction
        if (index === 0) {
            ctx.fillStyle = "#ffffff";
            let eye1X, eye1Y, eye2X, eye2Y;
            const eyeSize = 3;
            // Up
            if (dy === -1) { eye1X = part.x*gridSize + 4; eye1Y = part.y*gridSize + 4; eye2X = part.x*gridSize + 14; eye2Y = part.y*gridSize + 4; }
            // Down
            else if (dy === 1) { eye1X = part.x*gridSize + 4; eye1Y = part.y*gridSize + 14; eye2X = part.x*gridSize + 14; eye2Y = part.y*gridSize + 14; }
            // Left
            else if (dx === -1) { eye1X = part.x*gridSize + 4; eye1Y = part.y*gridSize + 4; eye2X = part.x*gridSize + 4; eye2Y = part.y*gridSize + 14; }
            // Right
            else if (dx === 1) { eye1X = part.x*gridSize + 14; eye1Y = part.y*gridSize + 4; eye2X = part.x*gridSize + 14; eye2Y = part.y*gridSize + 14; }
            // Fallback
            else { eye1X = part.x*gridSize + 4; eye1Y = part.y*gridSize + 4; eye2X = part.x*gridSize + 14; eye2Y = part.y*gridSize + 4; }
            
            ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
            ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
        }
    });
}

function getRandomValidPosition() {
    let valid = false;
    let pos = {x: 0, y: 0};
    while (!valid) {
        pos.x = Math.floor(Math.random() * tileCountX);
        pos.y = Math.floor(Math.random() * tileCountY);
        valid = !checkSelfCollision(pos.x, pos.y);
    }
    return pos;
}

function placeFood() {
    let pos = getRandomValidPosition();
    food.x = pos.x;
    food.y = pos.y;
}

function placeGoldFood() {
    let pos = getRandomValidPosition();
    goldFood = { x: pos.x, y: pos.y, timer: 45 }; // lasts ~45 game frames
}

// Draw Normal Food
let foodGlow = 0;
let glowDir = 1;
function drawFood() {
    foodGlow += 0.8 * glowDir;
    if (foodGlow > 18 || foodGlow < 5) glowDir *= -1;

    ctx.fillStyle = "#ff0844";
    ctx.shadowColor = "#ff0844";
    ctx.shadowBlur = foodGlow;
    
    ctx.beginPath();
    ctx.roundRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4, 8); // rounder
    ctx.fill();
    ctx.shadowBlur = 0; 
}

// Draw Gold Food
let goldGlow = 0;
let goldGlowDir = 1.5;
function drawGoldFood() {
    goldGlow += goldGlowDir;
    if (goldGlow > 25 || goldGlow < 10) goldGlowDir *= -1;

    // Flash white when timer is running out (< 15 frames)
    ctx.fillStyle = (goldFood.timer < 15 && goldFood.timer % 2 === 0) ? "#ffffff" : "#f6d365";
    ctx.shadowColor = "#f6d365";
    ctx.shadowBlur = goldGlow;
    
    // Draw star logic (diamond shape roughly)
    const centerX = goldFood.x * gridSize + gridSize/2;
    const centerY = goldFood.y * gridSize + gridSize/2;
    const r = (gridSize - 4) / 2;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - r - 2);
    ctx.lineTo(centerX + r, centerY);
    ctx.lineTo(centerX, centerY + r + 2);
    ctx.lineTo(centerX - r, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; 
}

// Input Handling
window.addEventListener("keydown", (e) => {
    // Prevent default scrolling for Space & Arrows
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
    }

    const key = e.key.toLowerCase();

    // Start game on first valid keypress if not active
    if (!gameStarted) {
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
            initAudio(); // Initialize audio context on first user interaction
            startGame();
            return;
        }
    }

    // Determine target direction based on inputs
    let targetDx = dx;
    let targetDy = dy;
    
    // Check if we have items in the queue; base target logic off the last queued input to prevent 180 flips in rapid bursts
    if (inputQueue.length > 0) {
        let lastInput = inputQueue[inputQueue.length - 1];
        targetDx = lastInput.x;
        targetDy = lastInput.y;
    }

    let nextDx = 0;
    let nextDy = 0;
    let validKeyPress = false;

    if ((key === "arrowup" || key === "w") && targetDy !== 1) {
        nextDx = 0; nextDy = -1; validKeyPress = true;
    } else if ((key === "arrowdown" || key === "s") && targetDy !== -1) {
        nextDx = 0; nextDy = 1; validKeyPress = true;
    } else if ((key === "arrowleft" || key === "a") && targetDx !== 1) {
        nextDx = -1; nextDy = 0; validKeyPress = true;
    } else if ((key === "arrowright" || key === "d") && targetDx !== -1) {
        nextDx = 1; nextDy = 0; validKeyPress = true;
    }

    // Push requested direction to queue (limit to 3 keystrokes to prevent buffer jam)
    if (validKeyPress && inputQueue.length < 3) {
        // Only add if it's an actual direction change
        if (nextDx !== targetDx || nextDy !== targetDy) {
            inputQueue.push({x: nextDx, y: nextDy});
        }
    }
});

function startGame() {
    if (gameActive) return;
    overlay.classList.add("hidden");
    gameStarted = true;
    gameActive = true;
    update();
}

function gameOver() {
    gameActive = false;
    gameStarted = false;
    clearTimeout(gameLoopId);
    triggerShake();
    playSound('die');
    
    // High Score logic
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScoreV2", highScore);
        highScoreElement.textContent = highScore;
        overlayDesc.textContent = "NEW HIGH SCORE: " + score;
    } else {
        overlayDesc.textContent = "Final Score: " + score;
    }

    overlayTitle.textContent = "GAME OVER";
    overlayTitle.classList.add("game-over");
    actionBtn.classList.remove("hidden");
    overlay.classList.remove("hidden");
}

actionBtn.addEventListener("click", () => {
    overlayTitle.classList.remove("game-over");
    overlayTitle.textContent = "READY?";
    overlayDesc.textContent = "Press any arrow key to start";
    actionBtn.classList.add("hidden");
    initAudio(); // Make sure audio is ready
    resetGame();
});

// Initial Setup
resetGame();
