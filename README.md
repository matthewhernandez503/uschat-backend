# UsChat Backend

## Overview
UsChat is a real-time chat application designed to facilitate event organization through seamless user authentication, chat room management, and instant messaging. This repository contains the **backend** implementation, built with **Node.js, Express, MongoDB, and Socket.IO**.

## Features
- User authentication (JWT-based)
- Real-time messaging using **Socket.IO**
- Contact management
- Secure session handling with cookies
- MongoDB database for persistence

## Setup Instructions

### Prerequisites
Ensure you have the following installed on your system:
- **Node.js** (v16 or later)
- **MongoDB** (local instance or MongoDB Atlas)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/matthewhernandez503/uschat-backend
   cd uschat-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following variables:
   ```env
   MONGO_URI=<your-mongodb-uri>
   JWT_SECRET=<your-secret-key>
   ```

4. Start the server:
   ```bash
   npm start
   ```

The backend should now be running on `http://localhost:8747`.

## API Endpoints
### Authentication Routes
- **POST** `/api/auth/signup` – Register a new user
- **POST** `/api/auth/login` – Authenticate and receive a JWT
- **POST** `/api/auth/logout` – Logout and clear the JWT cookie
- **GET** `/api/auth/userinfo` – Retrieve user details
- **POST** `/api/auth/update-profile` – Update profile information

### Contact Routes
- **POST** `/api/contacts/search` – Search for users
- **GET** `/api/contacts/all-contacts` – Get all available contacts
- **GET** `/api/contacts/get-contacts-for-list` – Retrieve recent contacts
- **DELETE** `/api/contacts/delete-dm/:dmId` – Delete direct messages

### Message Routes
- **POST** `/api/messages/get-messages` – Fetch chat history

## WebSocket Events
UsChat uses **Socket.IO** for real-time messaging.

### Client Events
- **`sendMessage`** – Sends a new message
  ```json
  {
    "recipient": "user_id",
    "content": "Hello!",
    "messageType": "text"
  }
  ```

- **`receiveMessage`** – Receives incoming messages
- **`disconnect`** – Handles user disconnection

## Testing
- **Manual API Testing:** Use **Postman** to send requests.
- **WebSocket Testing:** Use **multiple browser sessions** to verify real-time chat.

## Notes for Grading
- The backend **is designed to work with the TA's remote frontend**.
- Ensure **cookies are enabled** when testing authentication.
- WebSockets require an **active JWT session** for messaging.

## License
This project is for educational purposes. No official license included.

---

If you encounter any issues while testing, please let me know!


