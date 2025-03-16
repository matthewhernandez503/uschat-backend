// routes/contactRoutes.js
// Import necessary modules
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// 4.1 Search Contacts
// POST: /api/contacts/search
router.post('/search', verifyToken, async (req, res) => {
	const { searchTerm } = req.body;

	if (!searchTerm) {
		return res.status(400).json({ message: "searchTerm is required" });
	}

	try {
		const users = await User.find({
			$or: [
				{ firstName: { $regex: searchTerm, $options: 'i' } },
				{ lastName: { $regex: searchTerm, $options: 'i' } },
				{ email: { $regex: searchTerm, $options: 'i' } }
			]
		}).select('_id firstName lastName email');

		return res.status(200).json({ contacts: users });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Unexpected server error" });
	}
});

// 4.2 Get All Contacts
// GET: /api/contacts/all-contacts
router.get('/all-contacts', verifyToken, async (req, res) => {
	try {
		const contacts = await User.find().select('_id firstName lastName email');
		return res.status(200).json({ contacts });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Unexpected server error" });
	}
});

// 4.3 Get Contacts for List
// GET: /api/contacts/get-contacts-for-list
router.get('/get-contacts-for-list', verifyToken, async (req, res) => {
	try {
		const id = req.id;

		const messages = await Message.find({
			$or: [{ sender: id }, { recipient: id }]
		}).populate('sender', '_id firstName lastName')
		  .populate('recipient', '_id firstName lastName')
		  .sort({ timestamp: -1 });

		// Get unique contacts (senders + recipients)
		const contacts = [];
		messages.forEach(msg => {
			if (msg.sender._id.toString() !== id.toString()) {
				contacts.push(msg.sender);
			} else if (msg.recipient._id.toString() !== id.toString()) {
				contacts.push(msg.recipient);
			}
		});

		// Remove duplicate contacts
		const uniqueContacts = [...new Set(contacts.map(c => c._id.toString()))]
			.map(id => contacts.find(c => c._id.toString() === id));

		return res.status(200).json({ contacts: uniqueContacts });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Unexpected server error" });
	}
});

// 4.4 Delete Direct Messages
// DELETE: /api/contacts/delete-dm/:dmId
router.delete('/delete-dm/:dmId', verifyToken, async (req, res) => {
	const { dmId } = req.params;
	const userId = req.id; // Authenticated user ID

	if (!dmId) {
		return res.status(400).json({ message: "dmId is required" });
	}

	try {
		// Delete all messages between the authenticated user and the specified contact (dmId)
		const result = await Message.deleteMany({
			$or: [
				{ sender: userId, recipient: dmId },
				{ sender: dmId, recipient: userId }
			]
		});

		if (result.deletedCount === 0) {
			return res.status(404).json({ message: "No direct messages found to delete" });
		}

		console.log(`Deleted ${result.deletedCount} messages between ${userId} and ${dmId}`);

		return res.status(200).json({ message: "DM deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Unexpected server error" });
	}
});

module.exports = router;
