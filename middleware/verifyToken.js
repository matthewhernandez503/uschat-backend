// middleware/verifyToken.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
	let token = req.cookies.jwt ||
		req.headers.authorization?.split(" ")[1];

	//console.log("Token Check - Cookies:", req.cookies.jwt);
	//console.log("Token Check - Authorization Header:", req.headers.authorization);

	if (!token) {
		console.warn("No token found in request");
		return res.status(401).json({ message: "Access denied. No token provided." });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log("Verified token for user:", decoded.id);
		req.id = decoded.id;

		if (req.body.id && req.originalUrl !== "/api/messages/get-messages" && req.id !== req.body.id) {
			console.error("Token mismatch! Authenticated User:", req.id, " | Expected:", req.body.id);
			return res.status(403).json({ message: "Invalid session. Please log in again." });
		}

		next();
	} catch(error) {
		console.error("Invalid token:", error);
		return res.status(400).json({ message: "Invalid token." });
	}
};

module.exports = verifyToken;
