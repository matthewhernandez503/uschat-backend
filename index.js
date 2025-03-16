// index.js
// Import necessary modules
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const socketIo = require('socket.io');

// Import models, middleware, and route handlers
const User = require('./models/User');
const Message = require('./models/Message');
const verifyToken = require('./middleware/verifyToken');
const contactRoutes = require("./routes/contactRoutes");
const messageRoutes = require("./routes/messageRoutes");
const authenticationRoutes = require("./routes/authenticationRoutes");

require('dotenv').config(); // Load environment variables

const app = express();
const server = http.createServer(app);
const PORT = 8747;

// Intialize Socket.IO for real-time communication
const io = socketIo(server, {
	cors: {
		origin: 'https://dreamqin68.github.io',
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

// Store connected users and their socket IDs
const connectedUsers = {};

// Middleware setup
app.use(cors({
	origin: "https://dreamqin68.github.io",
	credentials: true
}));

app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Enable cookie parsing

// Register API routes
app.use("/api/auth", authenticationRoutes); // Authenication routes
app.use("/api/contacts", contactRoutes); // Contact-related routes
app.use("/api/messages", messageRoutes); // Message-related routes

// Ensure JWT cookies persist across requests
app.use((req, res, next) => {
	res.cookie('jwt', req.cookies.jwt, { httpOnly: true, secure: true, sameSite: 'None' });
	next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
	.then(() => {
		console.log('Connected to MongoDB');
	})
	.catch((err) => {
		console.error('Failed to connect to MongoDB', err);
	});

// WebSocket Authentication Middleware
io.use((socket, next) => {
	console.log("WebSocket Handshake:", socket.handshake);

	// Extract JWT token from various possible locations
	let token = socket.handshake.auth?.token ||
		socket.handshake.headers?.authorization?.split(" ")[1] ||
		(socket.handshake.headers?.cookie?.match(/jwt=([^;]+)/)?.[1]);

	if (!token) {
		console.warn("No token found in WebSocket connection. Allowing connection for now.");
		return next();
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log("WebSocket authenticated user ID:", decoded.id);
		socket.user = decoded; // Attach user ID to socket
		next();
	} catch (error) {
		console.error("WebSocket invalid token:", error);
		return next(new Error("Authentication error"));
	}
});

// WebSocket Event Handling
io.on("connection", (socket) => {
	console.log("Socket connected with ID:", socket.id);
	const userId = socket.handshake.query.userId;
	if (userId) {
		connectedUsers[userId] = socket.id;
		console.log(`User ${userId} mapped to socket ${socket.id}`);
	}

	// Handle sending messages
	socket.on("sendMessage", async ({ recipient, content, messageType }) => {
		if (!socket.user) {
			console.error("WebSocket message received without authentication!");
			return;
		}

		const sender = socket.user.id;
		console.log(`New message from ${sender} to ${recipient}`);

		try {
			const senderUser = await User.findById(sender);
			const recipientUser = await User.findById(recipient);

			if (!senderUser || !recipientUser) {
				console.error("Error: Sender or recipient not found in the database.");
				return;
			}

			const newMessage = new Message({
				sender: senderUser._id,
				recipient: recipientUser._id,
				content,
				messageType,
				timestamp: new Date(),
			});

			await newMessage.save();

			// Construct the message payload
			const messageData = {
				id: newMessage._id,
				sender: senderUser,  // Full sender details
				recipient: recipientUser,  // Full recipient details
				content,
				messageType,
				timestamp: newMessage.timestamp,
			};

			// Emit the message to the sender and recipient
			io.to(connectedUsers[sender]).emit("receiveMessage", messageData);
			if (connectedUsers[recipient]) {
				io.to(connectedUsers[recipient]).emit("receiveMessage", messageData);
			}
		} catch (error) {
			console.error("Error sending message:", error);
		}
	});

	// Handle user disconnection
	socket.on("disconnect", () => {
		console.log(`Socket ${socket.id} disconnected`);
		for (const [userId, sockId] of Object.entries(connectedUsers)) {
			if (sockId === socket.id) {
				delete connectedUsers[userId];
				break;
			}
		}
	});
});

// Start the server
server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
