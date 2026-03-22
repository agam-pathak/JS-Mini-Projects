const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const distanceDisplay = document.getElementById("distance");
const bestDisplay = document.getElementById("best-distance");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const finalDist = document.getElementById("final-distance");
const newRecordTag = document.getElementById("new-record-tag");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

// Canvas Sizing
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = Math.min(600, window.innerHeight * 0.8);
}
window.addEventListener('resize', resize);
resize();

// Assets & Colors
const colors = {
    player: "#00f2fe",
    playerTrail: "rgba(0, 242, 254, 0.4)",
    platform: "#9d50bb",
    platformEdge: "#f222ff",
    particle: "#f6d365",
    void: "#050608"
};

// Physics Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const SCROLL_SPEED_START = 6;
const PLATFORM_GAP_MIN = 120;
const PLATFORM_GAP_MAX = 350;

// Game State
let gameState = "START"; // START, PLAYING, GAMEOVER
let distance = 0;
let bestDistance = localStorage.getItem("synthQuestBest") || 0;
let scrollSpeed = SCROLL_SPEED_START;
let gameFrame = 0;

// Entities
let player;
let platforms = [];
let particles = [];

class Player {
    constructor() {
        this.w = 40;
        this.h = 40;
        this.x = 100;
        this.y = canvas.height - 200;
        this.dy = 0;
        this.jumps = 0;
        this.maxJumps = 2;
        this.rotation = 0;
        this.trail = [];
    }

    jump() {
        if (this.jumps < this.maxJumps) {
            this.dy = JUMP_FORCE;
            this.jumps++;
            createExplosion(this.x + this.w/2, this.y + this.h, colors.player, 8);
        }
    }

    update() {
        // Physics
        this.dy += GRAVITY;
        this.y += this.dy;

        // Rotation while in air
        if (this.jumps > 0) {
            this.rotation += 0.15;
        } else {
            // Snap back to level
            this.rotation = Math.max(0, this.rotation * 0.9);
        }

        // Keep Trail
        this.trail.unshift({x: this.x, y: this.y, r: this.rotation});
        if (this.trail.length > 8) this.trail.pop();

        // Check if fell out of world
        if (this.y > canvas.height + 100) {
            endGame();
        }
    }

    draw() {
        // Draw Trail
        this.trail.forEach((t, i) => {
            ctx.globalAlpha = (8 - i) / 15;
            ctx.fillStyle = colors.playerTrail;
            ctx.save();
            ctx.translate(t.x + this.w/2, t.y + this.h/2);
            ctx.rotate(t.r);
            ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;

        // Draw Player
        ctx.save();
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        ctx.rotate(this.rotation);
        
        // Neon Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.player;
        ctx.fillStyle = colors.player;
        ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
        
        // Inner detail
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.w/2 + 5, -this.h/2 + 5, this.w - 10, this.h - 10);
        
        ctx.restore();
        ctx.shadowBlur = 0; // reset
    }
}

class Platform {
    constructor(x, y, w) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = 20;
        this.active = true;
    }

    update() {
        this.x -= scrollSpeed;
        if (this.x + this.w < 0) this.active = false;

        // Collision Check
        if (player.x + player.w > this.x && 
            player.x < this.x + this.w && 
            player.y + player.h > this.y && 
            player.y + player.h < this.y + player.dy + 10 &&
            player.dy >= 0) {
                // Landed on platform
                player.y = this.y - player.h;
                player.dy = 0;
                player.jumps = 0;
                player.rotation = 0;
        }
    }

    draw() {
        // Gradient Bar
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
        grad.addColorStop(0, colors.platformEdge);
        grad.addColorStop(1, colors.platform);
        
        ctx.fillStyle = grad;
        ctx.shadowBlur = 10;
        ctx.shadowColor = colors.platformEdge;
        
        // Draw rounded platform
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, 10);
        ctx.fill();
        
        // Bottom glow line
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + 2);
        ctx.lineTo(this.x + this.w - 5, this.y + 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
    }
}

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 8,
            dy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life -= 0.02;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;
}

function spawnPlatforms() {
    if (platforms.length === 0) {
        platforms.push(new Platform(0, canvas.height - 100, canvas.width + 200));
        return;
    }

    const last = platforms[platforms.length - 1];
    if (last.x + last.w < canvas.width + 400) {
        const gap = Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN) + PLATFORM_GAP_MIN;
        const w = Math.random() * 300 + 150;
        // Float heights roughly around middle to bottom
        const y = Math.max(200, Math.min(canvas.height - 100, last.y + (Math.random() - 0.5) * 200));
        platforms.push(new Platform(last.x + last.w + gap, y, w));
    }
}

function initGame() {
    player = new Player();
    platforms = [];
    particles = [];
    spawnPlatforms();
    distance = 0;
    scrollSpeed = SCROLL_SPEED_START;
    gameFrame = 0;
    bestDisplay.textContent = Math.floor(bestDistance) + "m";
}

function startGame() {
    gameState = "PLAYING";
    startScreen.classList.remove("show"); // Use .show removal for transitions
    startScreen.classList.add("hidden");
    gameOverScreen.classList.remove("show");
    gameOverScreen.classList.add("hidden");
    initGame();
}

function endGame() {
    gameState = "GAMEOVER";
    finalDist.textContent = Math.floor(distance) + "m";
    
    if (distance > bestDistance) {
        bestDistance = distance;
        localStorage.setItem("synthQuestBest", bestDistance);
        newRecordTag.classList.remove("hidden");
    } else {
        newRecordTag.classList.add("hidden");
    }
    
    gameOverScreen.classList.remove("hidden");
    createExplosion(player.x, player.y, colors.player, 20);
}

function gameLoop() {
    // Background clear with subtle fade
    ctx.fillStyle = "rgba(5, 6, 8, 0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === "PLAYING") {
        gameFrame++;
        distance += scrollSpeed / 10;
        distanceDisplay.textContent = Math.floor(distance).toString().padStart(4, '0') + "m";
        
        // Speed scaling
        if (gameFrame % 500 === 0) scrollSpeed += 0.5;

        player.update();
        spawnPlatforms();

        platforms.forEach(p => p.update());
        platforms = platforms.filter(p => p.active);
    } else {
        // IDLE MODE: Platforms still move in the background
        spawnPlatforms();
        platforms.forEach(p => p.x -= 2); // Slow idle scroll
        platforms = platforms.filter(p => p.active);
    }

    // Always Draw
    platforms.forEach(p => p.draw());
    updateParticles();
    if (player && gameState !== "START") player.draw();

    requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener('keydown', (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        if (gameState === "PLAYING") player.jump();
        else if (gameState === "START") startGame();
    }
});

canvas.addEventListener('mousedown', (e) => {
    if (gameState === "PLAYING") player.jump();
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Start Loop
initGame();
gameLoop();
