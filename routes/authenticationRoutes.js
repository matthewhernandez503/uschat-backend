// routes/authenticationRoutes.js
// Import necessary modules
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// Function to hash the password
const hashPassword = async (password) => {
	const salt = await bcrypt.genSalt(10);
	return await bcrypt.hash(password, salt);
};

// 3.1 Signup
// POST: /api/auth/signup
router.post("/signup", async(req, res) => {
	const { email, password } = req.body;

	// Ensure the email and password are provided
	if (!email || !password) {
		return res.status(400).json({ message: 'Email and password are required.' });
	}

	// Check if the user already exists
	const existingUser = await User.findOne({ email });
	if (existingUser) {
		return res.status(400).json({ message: 'Email is already registered.' });
	}

	try {
		const hashedPassword = await hashPassword(password);

		const newUser = new User({
			email,
			password: hashedPassword,
		});

		// Save the user to the database
		await newUser.save();

		res.status(201).json({ message: 'User registered successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
});

// 3.2 Login
// POST: /api/auth/login
router.post("/login", async(req, res) => {
	const { email, password } = req.body;

	// Validate input
	if (!email || !password) {
		console.log("Missing email or password");
		return res.status(400).json({ message: "Email and password are required." });
	}

	try {
		// Find user by email
		const user = await User.findOne({ email });
		if (!user) {
			console.log("User not found");
			return res.status(400).json({ message: "Invalid email or password" });
		}

		// Compare entered password with stored hashed password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			console.log("Password mismatch");
			return res.status(400).json({ message: "Invalid email or password" });
		}

		// Create JWT token
		const token = jwt.sign(
			{ id: user._id },
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);
		console.log("JWT created");
		
		res.cookie("jwt", token, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			maxAge: 60 * 60 * 1000,
			path: "/",
		});

		// Send token and user data back to client	
		return res.status(201).json({
      			user: {
        		id: user?.id,
        		email: user?.email,
      			},
    		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
});

// 3.3 Logout
// POST: /api/auth/logout
router.post("/logout", verifyToken, async (req, res) => {
	try {
		res.clearCookie("jwt", {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			path: "/",
		});

		console.log(`User ${req.id} logged out`);
		return res.status(200).json({ message: "Logout successful" });
	} catch (error) {
		console.error("Logout error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
});

// 3.4 Get User Info
// GET: /api/auth/userinfo
router.get("/userinfo", verifyToken, async (req, res) => {
	try {
		// Find the user by the id from the token
		const user = await User.findById(req.id);

		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		// Return user data
		res.status(200).json({
			email: user.email,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
});

// 3.5 Update Profile
// POST: /api/auth/update-profile
router.post("/update-profile", verifyToken, async (req, res) => {
	try {
		const { firstName, lastName, color } = req.body;

		// Validate required fields
		if (!firstName || !lastName) {
			return res.status(400).json({ message: "First name and last name are required." });
		}

		// Find and update the user
		const updatedUser = await User.findByIdAndUpdate(
			req.id,
			{ firstName, lastName, profileSetup: true, ...(color && { color }) },
			{ new: true }
		);

		if (!updatedUser) {
			return res.status(400).json({ message: "User not found." });
		}

		//res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
		return res.status(200).json({
			id: updatedUser.id,
			email: updatedUser.email,
			firstName: updatedUser.firstName,
			lastName: updatedUser.lastName,
			image: updatedUser.profilePicture,
			profileSetup: updatedUser.profileSetup,
			color: updatedUser.color,
		});
	} catch (error) {
		console.error("Error updating profile:", error);
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;
