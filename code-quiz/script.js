const questions = [
    { q: "What is the result of '1' + 1?", a: "'11'", o: ["'11'", "2", "NaN", "Error"] },
    { q: "Which company developed JavaScript?", a: "Netscape", o: ["Microsoft", "Netscape", "Google", "Oracle"] },
    { q: "How do you declare a constant in ES6?", a: "const", o: ["var", "let", "const", "def"] },
    { q: "What does DOM stand for?", a: "Document Object Model", o: ["Data Object Mode", "Document Object Model", "Dynamic Output Member"] },
    { q: "Is JavaScript single-threaded?", a: "Yes", o: ["Yes", "No", "Depends", "Only in Node"] },
    { q: "What is the typeof null?", a: "object", o: ["null", "object", "undefined", "NaN"] }
];

let currentLevel = 0;
let score = 0;
let level = 1;

const questionText = document.getElementById('question-text');
const optionsGrid = document.getElementById('options');
const progressBar = document.getElementById('progress');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const resultScreen = document.getElementById('result-screen');
const finalRankEl = document.getElementById('final-rank');
const finalScoreEl = document.getElementById('final-score');

// Sound Effects
const sfxCorrect = document.getElementById('sfx-correct');
const sfxWrong = document.getElementById('sfx-wrong');

function loadQuestion() {
    if (currentLevel >= questions.length) {
        showResults();
        return;
    }
    
    const qData = questions[currentLevel];
    questionText.innerText = qData.q;
    optionsGrid.innerHTML = '';
    
    // Progress
    progressBar.style.width = `${(currentLevel / questions.length) * 100}%`;
    
    qData.o.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = option;
        btn.onclick = () => checkAnswer(option, qData.a, btn);
        optionsGrid.appendChild(btn);
    });
}

function checkAnswer(selected, correct, btn) {
    if (selected === correct) {
        btn.classList.add('correct');
        score += 100 * level;
        currentLevel++;
        sfxCorrect.play();
        setTimeout(loadQuestion, 800);
    } else {
        btn.classList.add('wrong');
        currentLevel++; // Skip to next or end? Let's skip.
        sfxWrong.play();
        setTimeout(loadQuestion, 800);
    }
    
    scoreEl.innerText = score;
}

function showResults() {
    progressBar.style.width = "100%";
    resultScreen.classList.remove('hidden');
    finalScoreEl.innerText = score;
    
    let rank = "JUNIOR DEV";
    if (score >= 300) rank = "SENIOR ARCHITECT";
    if (score >= 500) rank = "SYSTEM OVERLORD";
    
    finalRankEl.innerText = rank;
}

// Start
loadQuestion();
