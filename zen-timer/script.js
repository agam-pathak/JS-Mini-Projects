let timer;
let isPaused = true;
let timeLeft = 25 * 60; // 25 minutes
let currentMode = 'focus';
let sessions = 0;
let totalFocusTime = 0; // in minutes

const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const modeLabel = document.getElementById('mode-label');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const bellSfx = document.getElementById('bell-sfx');

const sessionCount = document.getElementById('session-count');
const totalFocusTimeEl = document.getElementById('total-focus-time');

const modes = {
    focus: { label: 'FOCUS', time: 25, class: 'work-mode' },
    shortBreak: { label: 'REST', time: 5, class: 'break-mode' },
    longBreak: { label: 'LONG REST', time: 15, class: 'long-mode' }
};

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        switchMode(mode);
        // UI reset
        document.querySelector('.mode-btn.active').classList.remove('active');
        e.target.classList.add('active');
    });
});

function startTimer() {
    isPaused = false;
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    
    timer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            if (currentMode === 'focus') totalFocusTime += (1/60);
            updateDisplay();
            
            if (timeLeft < 0) {
                completeSession();
            }
        }
    }, 1000);
}

function pauseTimer() {
    isPaused = true;
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    clearInterval(timer);
}

function resetTimer() {
    pauseTimer();
    switchMode(currentMode);
}

function updateDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    minutesEl.innerText = min.toString().padStart(2, '0');
    secondsEl.innerText = sec.toString().padStart(2, '0');

    // Update Browser Tab
    document.title = `${min}:${sec.toString().padStart(2, '0')} | ZenTimer`;
}

function switchMode(mode) {
    currentMode = mode;
    timeLeft = modes[mode].time * 60;
    modeLabel.innerText = modes[mode].label;
    
    document.body.className = modes[mode].class;
    updateDisplay();
}

function completeSession() {
    pauseTimer();
    bellSfx.play();
    
    if (currentMode === 'focus') {
        sessions++;
        sessionCount.innerText = sessions;
        totalFocusTimeEl.innerText = Math.round(totalFocusTime);
        switchMode('shortBreak');
    } else {
        switchMode('focus');
    }
}

// Initial update
updateDisplay();
