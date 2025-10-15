// --- 1. Game State Variables ---
let origBoard; // The array representing the board (0-8)
const huPlayer = 'X';
const aiPlayer = 'O';
let gameActive = true;

const winCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [6, 4, 2]             // Diagonals
];

// Get all the cell elements from the HTML
const cells = document.querySelectorAll('.cell');

// --- 2. Initial Setup and Start Game ---
startGame();

function startGame() {
    // Reset the board array to numbers (representing empty slots)
    origBoard = Array.from(Array(9).keys()); 
    gameActive = true;
    document.getElementById('message').innerText = "Your turn (X)";

    // Set up the board display and event listeners
    for (let i = 0; i < cells.length; i++) {
        cells[i].innerText = '';
        cells[i].classList.remove('X', 'O'); // Clear markers
        cells[i].style.backgroundColor = ''; // Clear win/loss highlights
        
        // Remove and re-add listeners to ensure a clean state
        cells[i].removeEventListener('click', turnClick, false);
        cells[i].addEventListener('click', turnClick, false);
    }
}

// --- 3. Player's Turn Handler ---
function turnClick(square) {
    // Check if the game is active and the slot is empty (contains a number)
    if (gameActive && typeof origBoard[square.target.id] === 'number') {
        // Player (Human) makes a move
        turn(square.target.id, huPlayer);
        
        // If the game is not won or tied after the player's move, it's the AI's turn
        if (gameActive) {
            document.getElementById('message').innerText = "AI is thinking...";
            // Delay the AI move slightly for a better user experience
            setTimeout(() => {
                turn(bestSpot(), aiPlayer);
            }, 500);
        }
    }
}

// --- 4. Making a Move ---
function turn(squareId, player) {
    // Update the game state array
    origBoard[squareId] = player;
    
    // Update the HTML display
    document.getElementById(squareId).innerText = player;
    document.getElementById(squareId).classList.add(player);

    // Check if the current move resulted in a win
    let gameWon = checkWin(origBoard, player);
    if (gameWon) {
        gameOver(gameWon);
        return;
    }
    
    // Check for a tie
    if (checkTie()) {
        document.getElementById('message').innerText = "It's a Tie!";
        gameActive = false;
        return;
    }
    
    // Update message for the next player (only if the game is still active)
    if (gameActive) {
        let nextPlayer = (player === huPlayer) ? aiPlayer : huPlayer;
        document.getElementById('message').innerText = `${nextPlayer === huPlayer ? 'Your' : 'AI'}'s turn (${nextPlayer})`;
    }
}

// --- 5. Check for Win and Game Over ---
function checkWin(board, player) {
    // Use the reduce function to find all indexes the player has played
    let plays = board.reduce((a, e, i) => (e === player) ? a.concat(i) : a, []);
    let gameWon = null;

    // Check every winning combination
    for (let [index, win] of winCombos.entries()) {
        // Use the every method to check if the player's plays array includes ALL elements of a winCombo
        if (win.every(elem => plays.indexOf(elem) > -1)) {
            gameWon = { index: index, player: player };
            break;
        }
    }
    return gameWon;
}

function gameOver(gameWon) {
    gameActive = false;
    
    // Highlight the winning combination
    for (let index of winCombos[gameWon.index]) {
        cells[index].style.backgroundColor = gameWon.player === huPlayer ? "rgba(100, 255, 100, 0.7)" : "rgba(255, 100, 100, 0.7)";
    }
    
    // Display the winner message
    const message = gameWon.player === huPlayer ? "You Win! 🎉" : "You Lose! 🤖";
    document.getElementById('message').innerText = message;
}

// --- 6. Tie Check and Available Moves ---
function emptySquares() {
    // Filter the board to return only the array indices (the numbers)
    return origBoard.filter(s => typeof s === 'number');
}

function checkTie() {
    if (emptySquares().length === 0) {
        gameActive = false; // Game over
        return true;
    }
    return false;
}

// --- 7. AI Logic: Find the Best Move (using Minimax) ---
function bestSpot() {
    // This calls minimax to get the optimal move index
    return minimax(origBoard, aiPlayer).index;
}

function minimax(newBoard, player) {
    // Get all available spots for the current board state
    const availSpots = emptySquares(newBoard);

    // --- Terminal States (Base Cases) ---
    // 1. Check if Human (minimizer) wins
    if (checkWin(newBoard, huPlayer)) {
        return { score: -10 };
    } 
    // 2. Check if AI (maximizer) wins
    else if (checkWin(newBoard, aiPlayer)) {
        return { score: 10 };
    } 
    // 3. Check for a tie
    else if (availSpots.length === 0) {
        return { score: 0 };
    }

    // --- Collect Scores for all Possible Moves ---
    let moves = [];
    
    for (let i = 0; i < availSpots.length; i++) {
        let move = {};
        
        // 1. Record the index of the spot
        move.index = newBoard[availSpots[i]]; 
        
        // 2. Make the temporary move on the new board
        newBoard[availSpots[i]] = player;

        // 3. Recursive Call: Calculate the score for this move
        if (player === aiPlayer) {
            // AI (Maximizer) calls minimax for the Human (Minimizer)
            let result = minimax(newBoard, huPlayer);
            move.score = result.score;
        } else {
            // Human (Minimizer) calls minimax for the AI (Maximizer)
            let result = minimax(newBoard, aiPlayer);
            move.score = result.score;
        }

        // 4. Undo the move (reset the spot to its index)
        newBoard[availSpots[i]] = move.index;
        
        // 5. Save the score and the index
        moves.push(move);
    }

    // --- Minimax Logic: Find the Best Move in the current set of 'moves' ---
    let bestMove;
    
    if (player === aiPlayer) {
        // MAXIMIZER: Find the move with the highest score
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        // MINIMIZER: Find the move with the lowest score
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    // The function returns the chosen move (index and score)
    return moves[bestMove];
}