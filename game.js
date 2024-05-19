const RollModel = require('./models/rollModel');

// Variabler för att spåra spelets tillstånd och spelare
let gameStarted = false;
let currentPlayerIndex = 0;
let currentTurnPoints = 0;
const targetScore = 20;

let players = [];
let startingTurnPoints = 0;

// Funktion för att låta en användare gå med i spelet
function joinGame(username, socket, io) {
    // Kontrollera om användaren redan är med i spelet
    if (!players.some((player) => player.username === username)) {
        // Kontrollera om det finns plats i spelet för en ny användare
        if (players.length < 4) {
            players.push({ username, socketId: socket.id, totalPoints: 0 });
            socket.emit('gameJoined', { gameStarted });
            updatePlayers(io);
        } else {
            socket.emit('gameFull');
        }
    } else {
        socket.emit('alreadyInGame');
    }
}

// Funktion för att låta en användare lämna spelet
function leaveGame(username, io) {
    const index = players.findIndex((player) => player.username === username);
    if (index !== -1) {
        players.splice(index, 1);
        updatePlayers(io);
    }
}

// Funktion för att starta spelet om tillräckligt med spelare finns
function startGame(io) {
    if (players.length >= 2 && players.length <= 4) {
        gameStarted = true;
        io.emit('gameStarted');
        startTurn(io);
    } else {
        io.emit('needMorePlayers');
    }
}

// Funktion för att starta en ny spelomgång
async function startTurn(io) {
    currentTurnPoints = 0;
    const currentPlayer = players[currentPlayerIndex];
    startingTurnPoints = currentPlayer.totalPoints;
    io.to(currentPlayer.socketId).emit('yourTurn');
    io.emit('turnStarted', currentPlayer.username);
}

// Funktion för att rulla tärningarna
async function rollDice(socket, io, currentPlayer) {
    const roll = Math.floor(Math.random() * 6) + 1;

    // Om spelaren rullar en etta
    if (roll === 1) {
        currentTurnPoints = 0;
        currentPlayer.totalPoints = startingTurnPoints;

        const newRoll = new RollModel({
            playerName: currentPlayer.username,
            rollValue: roll,
            totalSum: currentPlayer.totalPoints,
        });

        saveRollToDatabase(newRoll);
        setTimeout(() => {
            nextPlayer(io);
        }, 2000);
        io.emit(
            'chatMessage',
            `${currentPlayer.username} slog tyvärr en etta.`
        );
    } else {
        currentTurnPoints += roll;
        currentPlayer.totalPoints = startingTurnPoints + currentTurnPoints;

        const newRoll = new RollModel({
            playerName: currentPlayer.username,
            rollValue: roll,
            totalSum: currentPlayer.totalPoints,
        });

        saveRollToDatabase(newRoll);
        io.emit('chatMessage', `${currentPlayer.username} slog ${roll}.`);
    }

    socket.emit('diceRolled', roll, currentTurnPoints);
    io.emit('updateTurnPoints', currentTurnPoints);
}

// Funktion för att spara ett kast till databasen
function saveRollToDatabase(roll) {
    roll.save()
        .then(() => {
            console.log('Roll saved to database:', roll);
        })
        .catch((error) => {
            console.error('Error saving roll to database:', error);
        });
}

// Funktion för att låta en spelare spara sina poäng och gå vidare till nästa spelare
function holdTurn(io, socket) {
    const currentPlayer = players.find(
        (player) => player.socketId === socket.id
    );
    io.emit(
        'chatMessage',
        `${currentPlayer.username} valde att spara sina poäng.`
    );
    currentPlayer.totalPoints = startingTurnPoints + currentTurnPoints;

    const newRoll = new RollModel({
        playerName: currentPlayer.username,
        rollValue: 0,
        totalSum: currentPlayer.totalPoints,
    });

    saveRollToDatabase(newRoll);
    currentTurnPoints = 0;
    io.emit('updateScores', players);
    if (currentPlayer.totalPoints >= targetScore) {
        io.emit('gameOver', currentPlayer.username);
        console.log(`${currentPlayer.username} won the game!`);
        resetPlayers(io);
    } else {
        nextPlayer(io);
    }
}

// Funktion för att gå vidare till nästa spelare
function nextPlayer(io) {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    startTurn(io);
}

// Funktion för att uppdatera spelarlistan
function updatePlayers(io) {
    const usernames = players.map((player) => player.username);
    io.emit('updatePlayers', usernames);
}

// Funktion för att återställa spelets tillstånd och spelare
function resetPlayers(io) {
    console.log('Resetting players and game state.');
    players = [];
    gameStarted = false;
    io.emit('updatePlayers', []);
}

module.exports = {
    joinGame,
    leaveGame,
    startGame,
    rollDice,
    holdTurn,
    updatePlayers,
    players,
    resetPlayers,
};
