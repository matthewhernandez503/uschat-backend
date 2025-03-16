// models/Message.js
const mongoose = require('mongoose');

// Define the Message schema
const MessageSchema = new mongoose.Schema({
	sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	content: { type: String, required: true },
	messageType: { type: String, default: "text" },
	timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);
