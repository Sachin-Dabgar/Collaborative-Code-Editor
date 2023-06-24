// Import necessary modules and libraries
const express = require("express"); // Import the Express framework
const http = require("http"); // Import the HTTP module
const { Server } = require("socket.io"); // Import the Socket.IO library
const dotenv = require("dotenv"); // Import the dotenv library for managing environment variables
const ACTIONS = require("./Actions.js");
const socketio = require("socket.io-client");
const cors = require("cors");
dotenv.config(); // Load environment variables from a .env file (if available)

const app = express(); // Create an instance of the Express application
// Enable CORS with proper options
app.use(
    cors({
        origin: "*", // Update with the allowed origin(s) for your API
        methods: ["GET", "POST"], // Update with the allowed HTTP methods
        allowedHeaders: ["Content-Type", "Authorization"], // Update with the allowed headers
    })
);

const server = http.createServer(app); // Create an HTTP server using the Express application
const io = new Server(server); // Create a Socket.IO server instance and attach it to the HTTP server

const userSocketMap = {}; // A mapping of user name to their respective socket connections

// Function to get all connected clients in a room
function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

// Event handler for a new client connection
io.on("connection", (socket) => {
    console.log("socket connected", socket.id); // Print a message indicating a new client has connected

    // Event handler for when a client wants to join a room
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username; // Map the user name to the socket connection
        socket.join(roomId); // Add the client to the specified room
        const clients = getAllConnectedClients(roomId); // Get a list of all connected clients in the room
        clients.forEach(({ socketId }) => {
            // Notify all other clients in the room about the newly joined client
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    // Event handler for when a client's code changes
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        // Broadcast the code change to all other clients in the same room
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {
            code,
        });
    });

    // Event handler for when a client wants to sync their code with another client
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        // Send the updated code directly to the specified client
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Event handler for when a client is disconnecting
    socket.on("disconnecting", () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            // Notify all other clients in the rooms the disconnected client was in
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id]; // Remove the disconnected client from the user-to-socket mapping
        socket.leave(); // Remove the client from all rooms
    });
});

const PORT = process.env.PORT || 5000; // Define the port on which the server will listen
server.listen(PORT, () => {
    console.log(`listening on ${PORT}`); // Print a message indicating the server has started listening on the specified port
});
