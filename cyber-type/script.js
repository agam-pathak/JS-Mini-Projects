const wordPool = [
    "firewall", "mainboard", "algorithm", "bandwidth", "encryption", 
    "cybernetics", "neuralnet", "protocol", "mainframe", "bitstream",
    "overclock", "nanotech", "biosphere", "gateway", "datacore",
    "synapse", "uplink", "payload", "cryptic", "binary", "terminal",
    "rootkit", "sandbox", "pixel", "vector", "glitch", "proxy", "server",
    "node", "logic", "syntax", "runtime", "compile", "buffer", "kernel",
    "access", "denied", "override", "bypass", "isolate", "decompile"
];

// Difficulty multipliers
const diffSpeeds = {
    60: 1.5,
    30: 2.5,
    15: 4.0
};

// State Variables
let score = 0;
let wpm = 0;
let accuracy = 100;
let timeLeft = 60;
let totalTyped = 0;
let correctTyped = 0;
let activeWords = [];
let gameInterval;
let spawnInterval;
let isStarted = false;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameOver = document.getElementById('game-over');
const arena = document.getElementById('arena');
const wordField = document.getElementById('word-field');
const typeInput = document.getElementById('type-input');
const timerEl = document.getElementById('timer');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('accuracy');
const finalWPM = document.getElementById('final-wpm');
const finalAcc = document.getElementById('final-accuracy');
const finalScore = document.getElementById('final-score');

// Sound Effects
const sfxCorrect = document.getElementById('sfx-correct');
const sfxWrong = document.getElementById('sfx-wrong');
const sfxStart = document.getElementById('sfx-start');

// Initialize
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', () => location.reload());

// Difficulty selection
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelector('.diff-btn.active').classList.remove('active');
        e.target.classList.add('active');
        timeLeft = parseInt(e.target.dataset.time);
        timerEl.innerText = timeLeft;
    });
});

function startGame() {
    isStarted = true;
    startScreen.classList.add('hidden');
    typeInput.disabled = false;
    typeInput.focus();
    sfxStart.play();

    // Reset stats
    score = 0;
    correctTyped = 0;
    totalTyped = 0;
    activeWords = [];

    // Game loops
    gameInterval = setInterval(updateGame, 100);
    spawnInterval = setInterval(spawnWord, 1200 / diffSpeeds[parseInt(document.querySelector('.diff-btn.active').dataset.time)]);
}

function spawnWord() {
    if (!isStarted) return;
    
    const text = wordPool[Math.floor(Math.random() * wordPool.length)];
    const wordObj = {
        id: Date.now() + Math.random(),
        text: text,
        x: Math.random() * (arena.clientWidth - 150),
        y: -30,
        speed: (Math.random() * 2 + 1) * diffSpeeds[parseInt(document.querySelector('.diff-btn.active').dataset.time)],
        element: document.createElement('div')
    };

    wordObj.element.className = 'falling-word';
    wordObj.element.innerText = text;
    wordObj.element.style.left = `${wordObj.x}px`;
    wordObj.element.style.top = `${wordObj.y}px`;
    wordField.appendChild(wordObj.element);

    activeWords.push(wordObj);
}

function updateGame() {
    if (!isStarted) return;

    // Timer logic
    if (Date.now() % 1000 < 100) {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) endGame();
    }

    // Movement
    activeWords.forEach((word, index) => {
        word.y += word.speed;
        word.element.style.top = `${word.y}px`;

        // Check overflow
        if (word.y > arena.clientHeight) {
            word.element.remove();
            activeWords.splice(index, 1);
            updateStats(false); // Missed count
        }
    });

    // Update Live WPM
    updateWPM();
}

typeInput.addEventListener('input', (e) => {
    const input = e.target.value.toLowerCase();
    let hit = false;

    // Check if input matches any active word
    activeWords.forEach((word, index) => {
        if (word.text.startsWith(input)) {
            word.element.classList.add('typing');
        } else {
            word.element.classList.remove('typing');
        }

        if (word.text === input) {
            word.element.remove();
            activeWords.splice(index, 1);
            typeInput.value = '';
            updateStats(true);
            sfxCorrect.currentTime = 0;
            sfxCorrect.play();
            hit = true;
        }
    });

    // Handle backspace/partial mismatch for accuracy
    // (Simplification: Only update on full word completion)
});

function updateStats(isCorrect) {
    totalTyped++;
    if (isCorrect) {
        correctTyped++;
        score += 100 * diffSpeeds[parseInt(document.querySelector('.diff-btn.active').dataset.time)];
    } else {
        // Shake screen for errors?
        arena.classList.add('shake');
        setTimeout(() => arena.classList.remove('shake'), 300);
        sfxWrong.play();
    }

    accuracy = (correctTyped / totalTyped) * 100;
    accEl.innerText = Math.round(accuracy);
}

function updateWPM() {
    const timeElapsedInMinutes = (60 - timeLeft) / 60;
    if (timeElapsedInMinutes > 0) {
        // WPM calculation: (Characters / 5) / Time
        const characters = correctTyped * 5; // Simplified Average
        wpm = Math.round((characters / 5) / timeElapsedInMinutes);
        if (wpm > 500) wpm = 0; // Prevent infinity at start
        wpmEl.innerText = wpm;
    }
}

function endGame() {
    isStarted = false;
    clearInterval(gameInterval);
    clearInterval(spawnInterval);
    typeInput.disabled = true;
    
    gameOver.classList.remove('hidden');
    finalWPM.innerText = wpm;
    finalAcc.innerText = Math.round(accuracy);
    finalScore.innerText = Math.round(score);
}
