const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const lastWin = document.getElementById('last-win');
const spinVal = document.getElementById('spin-val');

// Config
const prizes = [
    { label: 'VOID CORE', color: '#00f2ff' },
    { label: 'SYNTH KEY', color: '#7000ff' },
    { label: 'CYBER CHIP', color: '#ff00ff' },
    { label: 'NEON CELL', color: '#00ff41' },
    { label: 'RETRY', color: '#555' },
    { label: 'ULTRA BIT', color: '#ff8a00' },
    { label: 'GLITCH', color: '#ff0044' },
    { label: 'DATA PACK', color: '#ffffff' }
];

let startAngle = 0;
let arc = Math.PI / (prizes.length / 2);
let spinTimeout = null;
let spinAngleStart = 0;
let spinTime = 0;
let spinTimeTotal = 0;

function drawWheel() {
    ctx.clearRect(0, 0, 500, 500);
    prizes.forEach((prize, i) => {
        const angle = startAngle + i * arc;
        
        ctx.fillStyle = prize.color;
        ctx.beginPath();
        ctx.moveTo(250, 250);
        ctx.arc(250, 250, 240, angle, angle + arc, false);
        ctx.lineTo(250, 250);
        ctx.fill();
        
        // Text
        ctx.save();
        ctx.fillStyle = "#050510";
        ctx.translate(250 + Math.cos(angle + arc / 2) * 180, 250 + Math.sin(angle + arc / 2) * 180);
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        ctx.font = 'bold 12px Orbitron';
        ctx.fillText(prize.label, -ctx.measureText(prize.label).width / 2, 0);
        ctx.restore();
    });
}

function rotateWheel() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }
    const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI / 180);
    drawWheel();
    spinTimeout = setTimeout(rotateWheel, 30);
    
    // Update Strength
    spinVal.innerText = Math.round((1 - spinTime / spinTimeTotal) * 100);
}

function stopRotateWheel() {
    clearTimeout(spinTimeout);
    const degrees = startAngle * 180 / Math.PI + 90;
    const arcd = arc * 180 / Math.PI;
    let index = Math.floor((360 - degrees % 360) / arcd);
    index = (index + prizes.length) % prizes.length; // Ensure index is within [0, 7]
    
    const win = prizes[index];
    if (win) {
        lastWin.innerText = `WIN: ${win.label}`;
        lastWin.style.color = win.color;
        lastWin.classList.add('active');
    }
    spinBtn.disabled = false;
    
    // SFX Safety
    try {
        const sfxWin = document.getElementById('sfx-win');
        if (sfxWin) sfxWin.play().catch(() => {});
    } catch(e) {}
}

function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

spinBtn.onclick = () => {
    spinAngleStart = Math.random() * 10 + 10;
    spinTime = 0;
    spinTimeTotal = (Math.random() * 3 + 4) * 1000; // 4 to 7 seconds
    spinBtn.disabled = true;
    
    // SFX Safety
    try {
        const sfxSpin = document.getElementById('sfx-spin');
        if (sfxSpin) sfxSpin.play().catch(() => {});
    } catch(e) {}
    
    rotateWheel();
};

drawWheel();
