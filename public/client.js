// Hämta DOM-element
const socket = io();
const formUser = document.querySelector('#formUser');
const inputUser = document.querySelector('#inputUser');
const formMessage = document.querySelector('#formMessage');
const inputMessage = document.querySelector('#inputMessage');
const userContainer = document.querySelector('#userContainer');
const messages = document.querySelector('#messages');
const body2 = document.querySelector('#body2');
const joinButton = document.querySelector('#joinButton');
const cancelButton = document.querySelector('#cancelButton');
const startButton = document.querySelector('#startButton');
const rollButton = document.querySelector('#rollButton');
const holdButton = document.querySelector('#holdButton');
const playerList = document.querySelector('#playerList');
const turnIndicator = document.querySelector('#turnIndicator');
const messageDisplay = document.querySelector('#messageDisplay');

let myUser;

// Hantera händelse för att skicka användarnamn
formUser.addEventListener('submit', function (e) {
    e.preventDefault();
    myUser = inputUser.value;
    userContainer.innerHTML = `<h2>Välkommen ${myUser}</h2>`;
    document.querySelector('.container').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('chat').style.display = 'block';
    document.getElementById('userContainer').style.display = 'block';
    body2.style.display = 'flex';
    // Skicka meddelande om användaren ansluter till chatten
    socket.emit('chatMessage', {
        user: myUser,
        message: 'joined',
    });
});

// Hantera händelse för att skicka meddelande
formMessage.addEventListener('submit', function (e) {
    e.preventDefault();
    if (inputMessage.value) {
        socket.emit('chatMessage', {
            user: myUser,
            message: inputMessage.value,
        });
        inputMessage.value = '';
    }
});

// Hantera händelse för att ansluta till spelet
joinButton.addEventListener('click', function () {
    socket.emit('joinGame', myUser);
});

// Hantera händelse för att avbryta spelet
cancelButton.addEventListener('click', function () {
    document.getElementById('cancelButton').style.display = 'none';
    document.getElementById('joinButton').style.display = 'block';
    socket.emit('leaveGame', myUser);
});

// Hantera händelse för att starta spelet
startButton.addEventListener('click', function () {
    socket.emit('startGame');
});

// Hantera händelse för att kasta tärning
rollButton.addEventListener('click', function () {
    socket.emit('rollDice');
});

// Hantera händelse för att hålla i turen
holdButton.addEventListener('click', function () {
    socket.emit('holdTurn');
});

// Lyssna på chattmeddelanden
socket.on('chatMessage', function (msg) {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

// Lyssna på nya chattmeddelanden
socket.on('newChatMessage', function (msg) {
    let item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

// Uppdatera spelarlistan
socket.on('updatePlayers', function (usernames) {
    playerList.innerHTML = '';
    usernames.forEach((username) => {
        let item = document.createElement('li');
        item.textContent = username;
        playerList.appendChild(item);
    });

    // Visa startknappen beroende på antalet spelare
    if (usernames.length >= 2 && usernames.length <= 4) {
        startButton.style.display = 'block';
    } else {
        startButton.style.display = 'none';
    }

    // Inaktivera anslutningsknappen om spelet är fullt
    if (usernames.length === 4) {
        joinButton.disabled = true;
    } else {
        joinButton.disabled = false;
    }
});

// Hantera händelse för att meddela att användaren har anslutit till spelet
socket.on('gameJoined', function () {
    joinButton.disabled = true;
    joinButton.style.display = 'none';
    cancelButton.style.display = 'inline-block';
});

// Hantera händelse för att meddela att spelet är fullt
socket.on('gameFull', function () {
    alert('Spelet är fullt!');
});

// Hantera händelse för att starta spelet
socket.on('gameStarted', function () {
    joinButton.style.display = 'none';
    cancelButton.style.display = 'none';
    startButton.style.display = 'none';
    rollButton.style.display = 'block';
    holdButton.style.display = 'block';
});

// Hantera händelse för att indikera vars tur det är
socket.on('turnStarted', function (username) {
    turnIndicator.textContent = `${username}'s tur att kasta`;
    // Inaktivera kast- och hållknappar om det inte är användarens tur
    if (username !== myUser) {
        rollButton.disabled = true;
        holdButton.disabled = true;
    }
});

// Lyssna på händelse för att indikera användarens tur
socket.on('yourTurn', function () {
    rollButton.disabled = false;
    holdButton.disabled = false;
});

// Lyssna på händelse för att visa resultatet av tärningskastet
socket.on('diceRolled', function (roll, turnPoints) {
    messageDisplay.textContent = `Du fick ${roll}. Din nuvarande poäng är: ${turnPoints}`;
    // Inaktivera kast- och hållknappar om användaren slår en etta
    if (roll === 1) {
        rollButton.disabled = true;
        holdButton.disabled = true;
        messageDisplay.textContent = '';
    }
});

// Lyssna på händelse för att uppdatera poängen för turen
socket.on('updateTurnPoints', function (turnPoints) {
    turnIndicator.textContent += ` | ${turnPoints}`;
});

// Lyssna på händelse för att uppdatera spelarnas poäng
socket.on('updateScores', function (players) {
    playerList.innerHTML = '';
    players.forEach((player) => {
        let item = document.createElement('li');
        item.textContent = `${player.username}: ${player.totalPoints} poäng`;
        playerList.appendChild(item);
    });
});

// Lyssna på händelse för att meddela att spelet är över och visa vinnaren
socket.on('gameOver', function (winner) {
    const message = `${winner} vann spelet!`;
    messageDisplay.textContent = message;

    // Lägg till ett meddelande i chatten
    const item = document.createElement('li');
    item.textContent = message;
    messages.appendChild(item);

    // Töm players-arrayen
    socket.emit('resetPlayers');

    console.log('Game over event received');

    // Återställ knappar
    rollButton.style.display = 'none';
    holdButton.style.display = 'none';
    joinButton.style.display = 'block';
    joinButton.disabled = false;
});

// Lyssna på händelse för att meddela att fler spelare behövs för att starta spelet
socket.on('needMorePlayers', function () {
    alert('Minst 2 spelare behövs för att starta spelet!');
});
