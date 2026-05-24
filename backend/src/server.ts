import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { initSocketHandlers } from "./modules/chat/socket.handler";

// Création du serveur HTTP à partir de l'app Express
const httpServer = createServer(app);

// Attache Socket.io sur server HTTP
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Reconnexion automatique si la connexion est perdue
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialise tous les handlers WebSocket
initSocketHandlers(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Socket.io activé`);
  console.log(`Environnement : ${process.env.NODE_ENV}`);
});
