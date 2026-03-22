const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hpFill = document.getElementById("hp-fill");
const expFill = document.getElementById("exp-fill");
const scoreDisplay = document.getElementById("score");
const waveDisplay = document.getElementById("wave");
const upgradeModal = document.getElementById("upgrade-modal");
const upgradeOptions = document.getElementById("upgrade-options");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");

// Canvas Resize
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Game State
let gameState = "START";
let score = 0;
let wave = 1;
let level = 1;
let exp = 0;
let expNeeded = 100;
let keys = {};
let mouse = { x: 0, y: 0, down: false };

// Game Entities
let player;
let bullets = [];
let enemies = [];
let particles = [];
let powerups = [];

// Stat Definitions
const shipStats = {
    moveSpeed: 5,
    fireRate: 250, // ms
    lastFired: 0,
    maxHp: 100,
    bulletDmg: 20,
    bulletSpeed: 10,
    bulletSize: 4
};

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.hp = shipStats.maxHp;
        this.angle = 0;
        this.radius = 20;
    }

    update() {
        // Movement
        if (keys['w'] || keys['ArrowUp']) this.y -= shipStats.moveSpeed;
        if (keys['s'] || keys['ArrowDown']) this.y += shipStats.moveSpeed;
        if (keys['a'] || keys['ArrowLeft']) this.x -= shipStats.moveSpeed;
        if (keys['d'] || keys['ArrowRight']) this.x += shipStats.moveSpeed;

        // Boundaries
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

        // Angle to Mouse
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        // Auto-Fire
        if (mouse.down && Date.now() - shipStats.lastFired > shipStats.fireRate) {
            this.fire();
        }
    }

    fire() {
        const vx = Math.cos(this.angle) * shipStats.bulletSpeed;
        const vy = Math.sin(this.angle) * shipStats.bulletSpeed;
        bullets.push(new Bullet(this.x, this.y, vx, vy, "#00f2fe"));
        shipStats.lastFired = Date.now();
        // Recoil effect?
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Ship Body (Vector Style)
        ctx.strokeStyle = "#00f2fe";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00f2fe";
        
        ctx.beginPath();
        ctx.moveTo(25, 0); // Nose
        ctx.lineTo(-15, -18);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-15, 18);
        ctx.closePath();
        ctx.stroke();
        
        // Engine Glow
        ctx.fillStyle = "rgba(0, 242, 254, 0.2)";
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;
    }
}

class Bullet {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.active = true;
        this.trail = [];
    }

    update() {
        this.trail.unshift({x: this.x, y: this.y});
        if (this.trail.length > 5) this.trail.pop();

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.active = false;
        }
    }

    draw() {
        ctx.strokeStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.lineWidth = shipStats.bulletSize;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        if (this.trail.length > 0) {
            ctx.lineTo(this.trail[this.trail.length - 1].x, this.trail[this.trail.length - 1].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.hp = 30 + (wave * 10);
        this.speed = 1.5 + (Math.random() * 1);
        this.active = true;
        this.radius = 15;
        this.color = "#ff3131";
    }

    update() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;

        // Player Collision
        if (dist < this.radius + player.radius) {
            player.hp -= 0.5;
            hpFill.style.width = player.hp + "%";
            if (player.hp <= 0) gameOver();
        }
    }

    draw() {
        ctx.strokeStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x + this.radius, this.y);
        ctx.lineTo(this.x, this.y + this.radius);
        ctx.lineTo(this.x - this.radius, this.y);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

// Particle Engine
function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: color
        });
    }
}

function spawnEnemy() {
    if (gameState !== "PLAYING") return;
    
    let x, y;
    if (Math.random() > 0.5) {
        x = Math.random() > 0.5 ? -50 : canvas.width + 50;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() > 0.5 ? -50 : canvas.height + 50;
    }
    enemies.push(new Enemy(x, y));
}

// Upgrades Library
const upgrades = [
    { title: "HYPER-DRIVE", desc: "Move 20% Faster", apply: () => shipStats.moveSpeed += 1.5 },
    { title: "AUTOCANNON", desc: "Fire Rate +30%", apply: () => shipStats.fireRate *= 0.7 },
    { title: "HULL REPAIR", desc: "Restore 50% HP", apply: () => { player.hp = Math.min(100, player.hp + 50); hpFill.style.width = player.hp + "%"; }},
    { title: "QUANTUM ROUNDS", desc: "Damage +50%", apply: () => shipStats.bulletDmg += 15 },
    { title: "BURST ENGINE", desc: "Projectile Speed +25%", apply: () => shipStats.bulletSpeed += 4 }
];

function showUpgrades() {
    gameState = "PAUSED";
    upgradeModal.classList.remove("hidden");
    upgradeOptions.innerHTML = "";
    
    // Choose 3 random
    const shuffled = upgrades.sort(() => 0.5 - Math.random());
    shuffled.slice(0, 3).forEach(up => {
        const card = document.createElement("div");
        card.className = "upgrade-card";
        card.innerHTML = `<h3>${up.title}</h3><p>${up.desc}</p>`;
        card.onclick = () => {
            up.apply();
            upgradeModal.classList.add("hidden");
            gameState = "PLAYING";
        };
        upgradeOptions.appendChild(card);
    });
}

function initGame() {
    player = new Player();
    bullets = [];
    enemies = [];
    particles = [];
    score = 0;
    wave = 1;
    exp = 0;
    level = 1;
    scoreDisplay.textContent = "0";
    waveDisplay.textContent = "1";
    hpFill.style.width = "100%";
    expFill.style.width = "0%";
}

function startGame() {
    initGame();
    gameState = "PLAYING";
    overlay.classList.add("hidden");
}

function gameOver() {
    gameState = "GAMEOVER";
    overlay.classList.remove("hidden");
    document.getElementById("overlay-title").textContent = "CORE COLLAPSED";
    document.getElementById("overlay-desc").textContent = "Final Score: " + score;
    startBtn.textContent = "REBOOT PILOT";
}

function update() {
    ctx.fillStyle = "rgba(5, 6, 8, 0.3)"; // Trailing effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Pattern
    ctx.strokeStyle = "rgba(0, 242, 254, 0.05)";
    ctx.beginPath();
    for(let i=0; i<canvas.width; i+=50) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
    for(let i=0; i<canvas.height; i+=50) { ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); }
    ctx.stroke();

    if (gameState === "PLAYING") {
        player.update();
        
        // Update Entities
        bullets.forEach((b, i) => {
            b.update();
            if (!b.active) bullets.splice(i, 1);
        });

        enemies.forEach((e, ei) => {
            e.update();
            bullets.forEach((b, bi) => {
                const dx = e.x - b.x;
                const dy = e.y - b.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < e.radius) {
                    e.hp -= shipStats.bulletDmg;
                    b.active = false;
                    createExplosion(e.x, e.y, e.color, 3);
                    if (e.hp <= 0) {
                        enemies.splice(ei, 1);
                        createExplosion(e.x, e.y, "#f6d365", 10);
                        score += 10;
                        scoreDisplay.textContent = score;
                        exp += 20;
                        if (exp >= expNeeded) {
                            exp = 0;
                            level++;
                            showUpgrades();
                        }
                        expFill.style.width = (exp/expNeeded * 100) + "%";
                    }
                }
            });
        });

        // Spawn logic
        if (Math.random() < 0.03 + (wave * 0.005)) spawnEnemy();
        
        // Future Wave logic? Every 20 kills increase wave
        if (score > wave * 200) {
            wave++;
            waveDisplay.textContent = wave;
        }
    }

    // Draw All
    bullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
        else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 2, 2);
        }
    });
    ctx.globalAlpha = 1.0;
    if (player) player.draw();

    requestAnimationFrame(update);
}

// Inputs
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', () => mouse.down = false);

startBtn.addEventListener('click', startGame);

update();
