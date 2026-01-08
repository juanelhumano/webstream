const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuración de CORS
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.send('Servidor de Streaming + Chat Activo.');
});

io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado:', socket.id);

    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });

    // --- LÓGICA DEL CHAT (NUEVO) ---
    socket.on('send-chat-message', (roomId, messageData) => {
        // messageData = { user: "Streamer/Espectador", text: "Hola", time: "10:00" }
        // Enviar a todos los DEMÁS en la sala (no al que lo envió)
        socket.to(roomId).emit('receive-chat-message', messageData);
    });

    // --- WebRTC Signalling ---
    socket.on('offer', (payload) => {
        io.to(payload.target).emit('offer', payload);
    });

    socket.on('answer', (payload) => {
        io.to(payload.target).emit('answer', payload);
    });

    socket.on('ice-candidate', (incoming) => {
        io.to(incoming.target).emit('ice-candidate', incoming.candidate);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
