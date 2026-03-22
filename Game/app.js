/**
 * Arcade Rush - Core Engine
 * Manages game state and interactive feedback
 */

let userScore = 0;
let compScore = 0;

const choices = document.querySelectorAll(".choice");
const msg = document.querySelector("#msg");
const userScorePara = document.querySelector("#user-score");
const compScorePara = document.querySelector("#comp-score");
const resetBtn = document.querySelector("#reset-btn");

/**
 * Generates a random move for the computer
 */
const genCompChoice = () => {
  const options = ["rock", "paper", "scissors"];
  return options[Math.floor(Math.random() * 3)];
};

/**
 * Handles Draw scenario
 */
const drawGame = (choice) => {
  msg.innerText = `It's a draw! Both picked ${choice}.`;
  msg.style.borderColor = "var(--neon-draw)";
  msg.style.color = "var(--neon-draw)";
  msg.style.boxShadow = "0 0 15px rgba(148, 163, 184, 0.2)";
};

/**
 * Updates UI and Score when someone wins
 */
const showWinner = (userWin, userChoice, compChoice) => {
  if (userWin) {
    userScore++;
    userScorePara.innerText = userScore;
    msg.innerText = `VICTORY! ${userChoice} obliterates ${compChoice}`;
    msg.style.borderColor = "var(--neon-user)";
    msg.style.color = "var(--neon-user)";
    msg.style.boxShadow = "0 0 20px rgba(34, 211, 238, 0.4)";
  } else {
    compScore++;
    compScorePara.innerText = compScore;
    msg.innerText = `DEFEAT! ${compChoice} crushed your ${userChoice}`;
    msg.style.borderColor = "var(--neon-comp)";
    msg.style.color = "var(--neon-comp)";
    msg.style.boxShadow = "0 0 20px rgba(244, 114, 182, 0.4)";
  }
};

/**
 * Primary Game Controller
 */
const playGame = (userChoice) => {
  const compChoice = genCompChoice();

  if (userChoice === compChoice) {
    drawGame(userChoice);
  } else {
    let userWin = true;
    if (userChoice === "rock") {
      userWin = compChoice === "paper" ? false : true;
    } else if (userChoice === "paper") {
      userWin = compChoice === "scissors" ? false : true;
    } else {
      userWin = compChoice === "rock" ? false : true;
    }
    showWinner(userWin, userChoice, compChoice);
  }
};

// Input Handlers
choices.forEach((choice) => {
  choice.addEventListener("click", () => {
    const userChoice = choice.getAttribute("id");
    // Add temporary scale effect on click
    choice.style.transform = "scale(0.9)";
    setTimeout(() => choice.style.transform = "", 150);
    playGame(userChoice);
  });
});

/**
 * Resets the game state
 */
resetBtn.addEventListener("click", () => {
    userScore = 0;
    compScore = 0;
    userScorePara.innerText = "0";
    compScorePara.innerText = "0";
    msg.innerText = "Awaiting your first move...";
    msg.style.borderColor = "var(--glass-border)";
    msg.style.color = "var(--text-white)";
    msg.style.boxShadow = "none";
});