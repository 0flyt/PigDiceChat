const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const port = 3000;

const MessageModel = require('./models/messageModel');
const RollModel = require('./models/rollModel');
const connectToMongoDB = require('./connectionMongoDB');
const game = require('./game');

connectToMongoDB();

app.use(express.static('public'));

// Route för att hämta alla meddelanden
app.get('/messages', async (req, res) => {
    try {
        const allMessages = await MessageModel.find();
        return res.status(200).json(allMessages);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Route för att hämta alla tärningskast
app.get('/rolls', async (req, res) => {
    try {
        const allRolls = await RollModel.find();
        res.status(200).json(allRolls);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Socket.io händelser
io.on('connection', (socket) => {
    console.log(`A client with id ${socket.id} connected to the chat!`);

    // Hantera chatMessage-händelser
    socket.on('chatMessage', async (msg) => {
        io.emit('newChatMessage', `${msg.user} : ${msg.message}`);

        let dateTime = new Date();
        try {
            const newMessage = new MessageModel({
                user: msg.user,
                message: msg.message,
                date: dateTime,
            });
            await newMessage.save();
            console.log('Message saved to MongoDB!');
        } catch (error) {
            console.error('Error saving message to MongoDB:', error.message);
        }
    });

    // Spelhändelser
    socket.on('joinGame', (username) => {
        game.joinGame(username, socket, io);
    });

    socket.on('leaveGame', (username) => {
        game.leaveGame(username, io);
    });

    socket.on('startGame', () => {
        game.startGame(io);
    });

    socket.on('rollDice', () => {
        const currentPlayer = game.players.find(
            (player) => player.socketId === socket.id
        );
        game.rollDice(socket, io, currentPlayer);
    });

    socket.on('holdTurn', () => {
        game.holdTurn(io, socket);
    });

    socket.on('resetPlayers', () => {
        console.log('resetPlayers event received');
        game.resetPlayers(io);
    });

    socket.on('disconnect', () => {
        console.log(`Client ${socket.id} disconnected!`);
        const player = game.players.find(
            (player) => player.socketId === socket.id
        );
        if (player) {
            game.leaveGame(player.username, io);
        }
    });

    game.updatePlayers(io);
});

server.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});
