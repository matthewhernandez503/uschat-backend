// routes/messageRoutes.js
// Import necessary modules
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// 5.1 Get Messages
// POST: /api/messages/get-messages
router.post("/get-messages", verifyToken, async (req, res) => {
	console.log("Incoming getMessages request");
	console.log("Token from request:", req.cookies.jwt || req.headers.authorization?.split(" ")[1]);
	console.log("Authenticated user ID:", req.id);
	console.log("Request body", req.body);

	const { id: contactorId } = req.body; // Get the ID of the other user

	// Validate contactorId in the request body
	if (!contactorId) {
		console.error("Missing contactor ID in request.");
		return res.status(400).json({ message: "Missing contactorId in request body." });
	}

	// Ensure authenticated user is the one making the request
	if (req.id === contactorId) {
		console.error("Invalid request: User cannot fetch their own messages");
		return res.status(403).json({ message: "Invalid request. Please refresh and try again." });
	}

	try {
		// Fetch the messages between the user and the contactor
		const messages = await Message.find({
			$or: [
				{ sender: req.id, recipient: contactorId },
				{ sender: contactorId, recipient: req.id },
			]
		}).sort({ timestamp: 1 })
		
		console.log("Messages retrieved successfully for user:", req.id);
		return res.status(200).json({ messages });

	} catch (error) {
		console.error("Error fetching messages:", error);
		return res.status(500).json({ message: "Internal server error." });
	}
});

module.exports = router;
