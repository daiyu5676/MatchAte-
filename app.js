let game;
let isProcessingTurn = false;
let streak = 0;
// Timer State
let timerInterval;
let secondsElapsed = 0;
let timerStarted = false;

// Array of DOM elements so we don't have to search for them
let cardElements = []; 

Module.onRuntimeInitialized = function() {
    console.log("WebAssembly Booted Successfully!");
    game = new Module.GameEngine();
    game.initializeDeck();
    
    buildBoardDOM();
    updateBoardVisuals();
    loadHighScores();
};

// 1. Build the physical HTML cards ONCE
function buildBoardDOM() {
    const board = document.getElementById("game-board");
    board.innerHTML = "";
    cardElements = [];

    const deckSize = game.getDeckSize();

    for (let i = 0; i < deckSize; i++) {
        // Build the 3D structure: container -> card -> front/back faces
        const container = document.createElement("div");
        container.classList.add("card-container");

        const card = document.createElement("div");
        card.classList.add("card");

        const backFace = document.createElement("div");
        backFace.classList.add("card-face", "card-back"); // The pattern

        const frontFace = document.createElement("div");
        frontFace.classList.add("card-face", "card-front"); // The emoji
        frontFace.innerText = game.getCardSymbol(i);

        card.appendChild(backFace);
        card.appendChild(frontFace);
        container.appendChild(card);
        board.appendChild(container);

        // Store the card reference and add click event
        cardElements.push(card);
        card.addEventListener("click", () => handleCardClick(i));
    }
}

// 2. Just update CSS classes based on C++ state (keeps animations smooth)
function updateBoardVisuals() {
    document.getElementById("moveCount").innerText = game.getMoves();

    for (let i = 0; i < cardElements.length; i++) {
        const card = cardElements[i];
        
        if (game.isCardMatched(i)) {
            card.classList.add("matched");
        } else if (game.isCardFlipped(i)) {
            card.classList.add("flipped");
        } else {
            card.classList.remove("flipped", "matched");
        }
    }
}

function handleCardClick(index) {
    if (isProcessingTurn) return;

    // Start timer on very first click
    if (!timerStarted) {
        timerStarted = true;
        timerInterval = setInterval(() => {
            secondsElapsed++;
            document.getElementById("timeCount").innerText = secondsElapsed;
        }, 1000);
    }

    if (game.flipCard(index)) {
        updateBoardVisuals(); 

        setTimeout(() => {
    const isMatch = game.checkMatch();
    updateBoardVisuals();

    if (isMatch) {
        streak++;

        showStreakMessage(streak);
    } else {
        streak = 0;
        document.getElementById("streakMessage").innerText = "";
    }

    document.getElementById("streakCount").innerText = streak;

    if (game.isGameWon()) {
        clearInterval(timerInterval);
        setTimeout(() => handleWin(), 500);
    }

    isProcessingTurn = false;
}, 900); // Let the user see the card for 0.8 seconds
    }
}

function showStreakMessage(streak) {
    const msg = document.getElementById("streakMessage");

    let text = "";

    if (streak === 1) text = "Good 👍";
    else if (streak === 2) text = "Great 🔥";
    else if (streak === 3) text = "Amazing ✨";
    else if (streak === 4) text = "Unstoppable 💅";
    else if (streak >= 5) text = "GOD MODE 💖";

    msg.innerText = text;

    // small pop animation
    msg.style.transform = "scale(1.2)";
    setTimeout(() => {
        msg.style.transform = "scale(1)";
    }, 200);
}


function saveScore(name, time, moves) {
    // Pull existing scores from the browser's local storage
    let scores = JSON.parse(localStorage.getItem("memoryScores")) || [];
    
    scores.push({ name, time, moves });
    
    // Sort by best time, then best moves
    scores.sort((a, b) => {
        if (a.time === b.time) return a.moves - b.moves;
        return a.time - b.time;
    });

    // Keep only top 5
    scores = scores.slice(0, 5);
    
    // Save back to local storage
    localStorage.setItem("memoryScores", JSON.stringify(scores));
}

function loadHighScores() {
    const list = document.getElementById("scoreList");
    list.innerHTML = "";
    
    let scores = JSON.parse(localStorage.getItem("memoryScores")) || [];
    
    if (scores.length === 0) {
        list.innerHTML = "<li>No data found. Be the first.</li>";
        return;
    }

    scores.forEach((s, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>#${i + 1} ${s.name}</span> <span>${s.time}s (${s.moves} moves)</span>`;
        list.appendChild(li);
    });
}


function restartGame() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    timerStarted = false;

    document.getElementById("timeCount").innerText = 0;
    document.getElementById("moveCount").innerText = 0;

    // ✅ hide modal again
    document.getElementById("winModal").classList.add("hidden");

    game.initializeDeck();
    buildBoardDOM();
    updateBoardVisuals();
}

function handleWin() {
    document.getElementById("winModal").classList.remove("hidden");

    document.getElementById("finalStats").innerText =
        `Time: ${secondsElapsed}s | Moves: ${game.getMoves()}`;

    document.getElementById("playerNameInput").value = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById("saveScoreBtn");

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const nameInput = document.getElementById("playerNameInput");
            const playerName = nameInput.value.trim();

            if (!playerName) {
                alert("Enter a name!");
                return;
            }

            saveScore(playerName, secondsElapsed, game.getMoves());
            loadHighScores();

            restartGame();
        });
    }
});