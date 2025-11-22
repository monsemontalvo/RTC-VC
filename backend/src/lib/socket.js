import {Server} from "socket.io";
import http from "http";
import express from "express";

const app=express();
const server=http.createServer(app);

const io=new Server(server,{
    cors:{
        origin: ["http://localhost:5173", "https://rtc-vc-pzcf.onrender.com"],
        credentials: true,
    },
});

export function getReceiverSocketId(userId){
    return userSocketMap[userId];
}
//used to track connected users
const userSocketMap={}; // userId: socketId

io.on("connection",(socket)=>{
    console.log(`User connected: ${socket.id}`);

    const userId=socket.handshake.query.userId;
    if(userId) userSocketMap[userId]=socket.id;

    //io.emit es usado para enviar a todos los clientes conectados
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // --- INICIO: LÓGICA DE VIDEOLLAMADA ---

    // Un usuario (A) envía una oferta a otro usuario (B)
    socket.on("call:offer", ({ toUserId, offer, fromUser }) => {
        // Obtenemos el socketId del destinatario
        const receiverSocketId = userSocketMap[toUserId];
        if (receiverSocketId) {
            // Reenviamos la oferta al destinatario (usuario B)
            // 'call:incoming' le dice al usuario B que alguien lo está llamando
            io.to(receiverSocketId).emit("call:incoming", {
                fromUser: fromUser,
                offer: offer,
            });
        } else {
            // (Opcional) Manejar si el usuario no está conectado
            socket.emit("call:error", { message: "El usuario no está conectado." });
        }
    });

    // El usuario (B) responde a la oferta con una respuesta
    socket.on("call:answer", ({ toUserId, answer }) => {
        // Obtenemos el socketId del usuario que originó la llamada (usuario A)
        const callerSocketId = userSocketMap[toUserId];
        if (callerSocketId) {
            // Enviamos la respuesta de B de vuelta a A
            io.to(callerSocketId).emit("call:accepted", {
                fromUserId: userId,
                answer: answer,
            });
        }
    });

    // Intercambio de candidatos ICE (necesario para la conexión de red)
    socket.on("webrtc:ice-candidate", ({ toUserId, candidate }) => {
        const receiverSocketId = userSocketMap[toUserId];
        if (receiverSocketId) {
            // Reenviamos el candidato al otro usuario
            io.to(receiverSocketId).emit("webrtc:ice-candidate", {
                fromUserId: userId,
                candidate: candidate,
            });
        }
    });
    
    // (Opcional) Manejar rechazo o fin de llamada
    socket.on("call:end", ({ toUserId }) => {
         const receiverSocketId = userSocketMap[toUserId];
         if (receiverSocketId) {
            io.to(receiverSocketId).emit("call:ended");
         }
    });

    // --- FIN: LÓGICA DE VIDEOLLAMADA ---

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export {io, app, server};