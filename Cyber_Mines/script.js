const gridDisplay = document.getElementById("grid");
const mineCountDisplay = document.getElementById("mine-count");
const timerDisplay = document.getElementById("timer");
const statusText = document.getElementById("status-text");
const detailsText = document.getElementById("details-text");
const overlay = document.getElementById("overlay");
const resetBtn = document.getElementById("reset-btn");

const width = 10;
const mineAmount = 15;
let flags = 0;
let squares = [];
let isGameOver = false;
let startTime;
let timerInterval;

function initGame() {
    gridDisplay.innerHTML = "";
    squares = [];
    isGameOver = false;
    flags = 0;
    mineCountDisplay.textContent = mineAmount.toString().padStart(2, '0');
    
    // Create random mine locations
    const minesArray = Array(mineAmount).fill('mine');
    const emptyArray = Array(width * width - mineAmount).fill('empty');
    const gameArray = emptyArray.concat(minesArray);
    const shuffledArray = gameArray.sort(() => Math.random() - 0.5);

    for (let i = 0; i < width * width; i++) {
        const square = document.createElement("div");
        square.setAttribute("id", i);
        square.classList.add("cell");
        square.dataset.type = shuffledArray[i];
        gridDisplay.appendChild(square);
        squares.push(square);

        // Click actions
        square.addEventListener("click", () => handleClick(square));
        square.oncontextmenu = (e) => {
            e.preventDefault();
            addFlag(square);
        };
    }

    // Add proximity totals
    for (let i = 0; i < squares.length; i++) {
        let total = 0;
        const isLeftEdge = i % width === 0;
        const isRightEdge = i % width === width - 1;

        if (squares[i].dataset.type === "empty") {
            if (i > 0 && !isLeftEdge && squares[i-1].dataset.type === "mine") total++;
            if (i > 9 && !isRightEdge && squares[i+1-width].dataset.type === "mine") total++;
            if (i > 10 && squares[i-width].dataset.type === "mine") total++;
            if (i > 11 && !isLeftEdge && squares[i-1-width].dataset.type === "mine") total++;
            if (i < 98 && !isRightEdge && squares[i+1].dataset.type === "mine") total++;
            if (i < 90 && !isLeftEdge && squares[i-1+width].dataset.type === "mine") total++;
            if (i < 88 && !isRightEdge && squares[i+1+width].dataset.type === "mine") total++;
            if (i < 89 && squares[i+width].dataset.type === "mine") total++;
            squares[i].dataset.total = total;
        }
    }

    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    let sec = 0;
    timerInterval = setInterval(() => {
        sec++;
        timerDisplay.textContent = sec.toString().padStart(3, '0');
    }, 1000);
}

function addFlag(square) {
    if (isGameOver) return;
    if (!square.classList.contains("revealed") && (flags < mineAmount)) {
        if (!square.classList.contains("flagged")) {
            square.classList.add("flagged");
            flags++;
            mineCountDisplay.textContent = (mineAmount - flags).toString().padStart(2, '0');
            checkForWin();
        } else {
            square.classList.remove("flagged");
            flags--;
            mineCountDisplay.textContent = (mineAmount - flags).toString().padStart(2, '0');
        }
    }
}

function handleClick(square) {
    if (isGameOver || square.classList.contains("revealed") || square.classList.contains("flagged")) return;

    if (square.dataset.type === "mine") {
        gameOver(square);
    } else {
        let total = square.dataset.total;
        if (total != 0) {
            square.classList.add("revealed");
            square.classList.add("num-" + total);
            square.innerHTML = total;
            return;
        }
        checkSquare(square);
    }
    square.classList.add("revealed");
}

// Flood fill for empty squares
function checkSquare(square) {
    const currentId = parseInt(square.id);
    const isLeftEdge = currentId % width === 0;
    const isRightEdge = currentId % width === width - 1;

    setTimeout(() => {
        if (currentId > 0 && !isLeftEdge) revealSquare(currentId - 1);
        if (currentId > 9 && !isRightEdge) revealSquare(currentId + 1 - width);
        if (currentId > 10) revealSquare(currentId - width);
        if (currentId > 11 && !isLeftEdge) revealSquare(currentId - 1 - width);
        if (currentId < 98 && !isRightEdge) revealSquare(currentId + 1);
        if (currentId < 90 && !isLeftEdge) revealSquare(currentId - 1 + width);
        if (currentId < 88 && !isRightEdge) revealSquare(currentId + 1 + width);
        if (currentId < 89) revealSquare(currentId + width);
    }, 10);
}

function revealSquare(id) {
    const square = squares[id];
    if (square.classList.contains("revealed") || square.classList.contains("flagged")) return;
    
    square.classList.add("revealed");
    let total = square.dataset.total;
    if (total != 0) {
        square.classList.add("num-" + total);
        square.innerHTML = total;
    } else {
        checkSquare(square);
    }
    checkForWin();
}

function gameOver(square) {
    isGameOver = true;
    clearInterval(timerInterval);
    
    // Show ALL mines
    squares.forEach(s => {
        if (s.dataset.type === "mine") {
            s.classList.add("revealed", "mine");
            s.innerHTML = "X";
        }
    });

    statusText.textContent = "CRITICAL FAILURE";
    detailsText.textContent = "Data corrupted. Containment breach detected.";
    statusText.className = "danger";
    overlay.classList.remove("hidden");
}

function checkForWin() {
    let matches = 0;
    for (let i = 0; i < squares.length; i++) {
        if (squares[i].classList.contains("flagged") && squares[i].dataset.type === "mine") {
            matches++;
        }
    }
    if (matches === mineAmount) {
        isGameOver = true;
        clearInterval(timerInterval);
        statusText.textContent = "THREAT NEUTRALIZED";
        detailsText.textContent = "Sector secured. System access granted.";
        statusText.className = "success";
        overlay.classList.remove("hidden");
    }
}

resetBtn.addEventListener("click", initGame);
initGame();
