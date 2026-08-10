# flowtalk
# 🚀 FlowTalk – Real-Time Messaging Platform

FlowTalk is a secure, real-time messaging platform inspired by WhatsApp. It enables private chat rooms, message persistence, delivery/read receipts, AI-assisted conversations, and real-time communication using modern web technologies.

---

## 🔗 Repository

GitHub: [https://github.com/amitk2003/flowtalk](https://github.com/amitk2003/flowtalk)

---

## 🛠 Tech Stack

* **Frontend:** React, Next.js, TypeScript
* **Backend:** Node.js
* **Real-Time Communication:** Socket.IO
* **Video/Voice Signaling:** WebRTC
* **Database:** PostgreSQL
* **Authentication:** JWT (Access + Refresh Tokens)

---

## ✨ Features

### 🔐 Secure Authentication System

* Layered JWT authentication architecture
* Short-lived access tokens
* Database-backed refresh tokens
* Token blacklisting for enhanced security
* Secure WebSocket handshake verification

### 💬 Real-Time Messaging

* Private chat rooms
* Room-based authorization
* Real-time message delivery with Socket.IO
* Message persistence in PostgreSQL
* Delivery and read receipts
* User presence tracking (online/offline status)

### 🎥 WebRTC Signaling

* Offer/Answer exchange
* ICE candidate handling
* Peer-to-peer communication signaling via Socket.IO

### 🤖 AI-Assisted Conversations

* AI message streaming integrated directly into chat sessions
* Real-time AI responses within conversations

---

## 🏗 Architecture Overview

FlowTalk follows a modular and scalable architecture:

* **Client (Next.js + React)** handles UI rendering, state management, and WebRTC peer connections.
* **Socket.IO Server** manages real-time communication, presence tracking, and room events.
* **Node.js Backend** handles authentication, authorization, and API logic.
* **PostgreSQL** stores users, messages, refresh tokens, and chat metadata.

---

## 🔒 Security Highlights

* Access tokens are short-lived to minimize risk.
* Refresh tokens are securely stored and validated from the database.
* Token revocation supported via blacklisting.
* WebSocket connections validated using JWT before establishing sessions.
* Room-level authorization ensures only permitted users can access chat rooms.

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/amitk2003/flowtalk.git
cd flowtalk
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Environment Variables

Create a `.env` file in the root directory and configure:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

### 4️⃣ Run the Development Server

```bash
npm run dev
```

---

## 📌 Future Enhancements

* End-to-end encryption (E2EE)
* Group video calls
* Message reactions and media sharing
* Push notifications
* Mobile app support

---

## 👨‍💻 Author

**Amit Kumar**
Full-Stack Developer | Real-Time Systems Enthusiast

---

## 📄 License

This project is open-source and available under the MIT License.
