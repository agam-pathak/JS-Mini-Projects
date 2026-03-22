const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const livesContainer = document.getElementById("lives-container");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const winScreen = document.getElementById("win-screen");
const finalScoreDisp = document.getElementById("final-score");

// Game Settings
const ballRadius = 8;
const paddleHeight = 15;
let paddleWidth = 100;
const brickRowCount = 6;
const brickColumnCount = 10;
const brickPadding = 12;
const brickOffsetTop = 50;
const brickOffsetLeft = 35;
const brickWidth = 65;
const brickHeight = 25;

// Game State
let x, y, dx, dy;
let paddleX = (canvas.width - paddleWidth) / 2;
let score = 0;
let lives = 3;
let bricks = [];
let particles = [];
let powerups = [];
let gameState = "START"; // START, PLAYING, WON, GAMEOVER
let activePowerups = { fireball: 0, widePaddle: 0 };

function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            // Give different colors/strength to rows
            let strength = 1;
            let color = "#00f2fe"; // Default Blue
            if (r < 2) { color = "#f222ff"; strength = 2; } // Top Pink
            else if (r < 4) { color = "#9d50bb"; } // Mid Purple

            bricks[c][r] = { x: 0, y: 0, status: strength, color: color };
        }
    }
}

function initBall() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 5;
    dy = -5;
    paddleX = (canvas.width - paddleWidth) / 2;
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = activePowerups.fireball > 0 ? "#ff0844" : "#fff";
    
    // Ball Glow
    ctx.shadowBlur = activePowerups.fireball > 0 ? 20 : 10;
    ctx.shadowColor = activePowerups.fireball > 0 ? "#ff0844" : "#00f2fe";
    
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight, 5);
    ctx.fillStyle = "#00f2fe";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00f2fe";
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
    
    // Paddle detail
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.strokeRect(paddleX + 10, canvas.height - paddleHeight + 4, paddleWidth - 20, 2);
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status > 0) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                
                ctx.beginPath();
                ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 4);
                ctx.fillStyle = bricks[c][r].color;
                
                // Opacity based on strength
                if (bricks[c][r].status === 1 && r < 2) ctx.globalAlpha = 0.5;
                
                ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.closePath();
            }
        }
    }
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status > 0) {
                if (x + ballRadius > b.x && x - ballRadius < b.x + brickWidth && y + ballRadius > b.y && y - ballRadius < b.y + brickHeight) {
                    if (activePowerups.fireball <= 0) dy = -dy;
                    
                    b.status--;
                    score += 10;
                    scoreDisplay.textContent = score;
                    
                    createExplosion(b.x + brickWidth/2, b.y + brickHeight/2, b.color);

                    // Chance to drop powerup
                    if (Math.random() < 0.1) {
                        spawnPowerup(b.x + brickWidth/2, b.y + brickHeight/2);
                    }

                    if (checkWin()) {
                        gameState = "WON";
                        winScreen.classList.remove("hidden");
                    }
                }
            }
        }
    }
}

function checkWin() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status > 0) return false;
        }
    }
    return true;
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            life: 1.0,
            color: color
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
            ctx.fillRect(p.x, p.y, 4, 4);
        }
    }
    ctx.globalAlpha = 1.0;
}

function spawnPowerup(x, y) {
    const types = ["fireball", "widePaddle"];
    const type = types[Math.floor(Math.random() * types.length)];
    powerups.push({ x: x, y: y, type: type, active: true });
}

function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        let p = powerups[i];
        p.y += 3;
        
        // Draw Powerup
        ctx.fillStyle = p.type === "fireball" ? "#ff0844" : "#f6d365";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Orbitron";
        ctx.textAlign = "center";
        ctx.fillText(p.type === "fireball" ? "F" : "W", p.x, p.y + 5);
        
        // Catch check
        if (p.x > paddleX && p.x < paddleX + paddleWidth && p.y > canvas.height - paddleHeight) {
            activatePowerup(p.type);
            powerups.splice(i, 1);
        } else if (p.y > canvas.height) {
            powerups.splice(i, 1);
        }
    }
    
    // Decrease timers
    if (activePowerups.fireball > 0) activePowerups.fireball--;
    if (activePowerups.widePaddle > 0) {
        activePowerups.widePaddle--;
        if (activePowerups.widePaddle === 0) paddleWidth = 100;
    }
}

function activatePowerup(type) {
    if (type === "fireball") activePowerups.fireball = 400;
    if (type === "widePaddle") {
        activePowerups.widePaddle = 600;
        paddleWidth = 180;
    }
}

function updateLivesUI() {
    const dots = livesContainer.querySelectorAll(".life-dot");
    dots.forEach((dot, index) => {
        if (index >= lives) dot.classList.add("lost");
        else dot.classList.remove("lost");
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === "PLAYING") {
        drawBricks();
        drawBall();
        drawPaddle();
        updateParticles();
        updatePowerups();
        collisionDetection();

        // Wall Bouncing
        if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
        if (y + dy < ballRadius) dy = -dy;
        else if (y + dy > canvas.height - ballRadius) {
            if (x > paddleX && x < paddleX + paddleWidth) {
                // Hit paddle - determine angle
                let collidePoint = x - (paddleX + paddleWidth / 2);
                collidePoint = collidePoint / (paddleWidth / 2);
                let angle = collidePoint * (Math.PI / 3);
                dx = 7 * Math.sin(angle);
                dy = -7 * Math.cos(angle);
            } else {
                lives--;
                updateLivesUI();
                if (lives === 0) {
                    gameState = "GAMEOVER";
                    finalScoreDisp.textContent = score;
                    gameOverScreen.classList.remove("hidden");
                } else {
                    initBall();
                }
            }
        }

        x += dx;
        y += dy;
    } else {
        // Idle drawing
        drawBricks();
        drawPaddle();
    }

    requestAnimationFrame(draw);
}

// Controls
document.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") paddleX = Math.min(canvas.width - paddleWidth, paddleX + 30);
    else if (e.key === "ArrowLeft") paddleX = Math.max(0, paddleX - 30);
});

// Start logic
function startGame() {
    score = 0;
    lives = 3;
    scoreDisplay.textContent = score;
    updateLivesUI();
    initBricks();
    initBall();
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    winScreen.classList.add("hidden");
    gameState = "PLAYING";
}

document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("restart-btn").addEventListener("click", startGame);
document.getElementById("next-level-btn").addEventListener("click", startGame);

initBricks();
initBall();
draw();
