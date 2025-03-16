// models/User.js
const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true, },
	password: { type: String, required: true },
	firstName: { type: String, required: false },
	lastName: { type: String, required: false },
	profilePicture: { type: String, required: false },
	color: { type: String, required: false },
	profileSetup: { type: Boolean, default: false, },
}, { timestamps: true });

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
