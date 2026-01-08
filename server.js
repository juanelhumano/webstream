const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuración de CORS para permitir conexiones desde cualquier lugar (tu frontend)
const io = new Server(server, {
    cors: {
        origin: "*", // En producción, cambia esto por la URL de tu página web
        methods: ["GET", "POST"]
    }
});

// Ruta básica para verificar que el servidor funciona
app.get('/', (req, res) => {
    res.send('Servidor de Streaming Activo. Usa este enlace en tu Frontend.');
});

io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado:', socket.id);

    // Evento: Unirse a una sala
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        // Avisar a los demás en la sala que alguien entró
        socket.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });

    // Eventos de WebRTC (Oferta, Respuesta, Candidatos ICE)
    // El servidor solo actúa como mensajero entre el Emisor y el Espectador
    
    socket.on('offer', (payload) => {
        // payload contiene: { target: id_destino, caller: id_origen, sdp: oferta }
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
