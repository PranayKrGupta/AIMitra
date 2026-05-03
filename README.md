# 🤖 AI Mitra - Advanced Multi-LLM Chat Ecosystem

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=render)](https://aimitra.onrender.com/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/PranayKrGupta/AIMitra)

AI Mitra is a sophisticated, full-stack AI chat application designed to provide a seamless and resilient conversational experience. By leveraging a tiered fallback mechanism across multiple Large Language Models (LLMs) like Google Gemini and Cohere, AI Mitra ensures high availability even during API rate limits or service outages.


---

## 🌟 Key Features

### 🧠 Intelligent Tiered Fallback & Resilience
- **Multi-Provider Support**: Integrates both Google Gemini (Flash and Pro) and Cohere (Command-R series).
- **Circuit Breaker Pattern**: Automatically skips failing or rate-limited models to prevent cascading delays.
- **Dynamic Context Handling**: Maintains up to 10 messages of conversation history for accurate, context-aware responses.
- **Self-Healing Responses**: If all API tiers fail, the system provides a graceful "Offline Fallback" message.

### 🔐 Secure Authentication System
- **Robust Auth Flow**: Complete Signup, Login, and Password Reset functionality.
- **Email Validation**: Real-time syntax and MX record verification using `deep-email-validator`.
- **JWT Protection**: Secure, token-based authentication for all API interactions.
- **Password Security**: Bcrypt-based hashing for industry-standard credential storage.

### 💬 Advanced Chat Capabilities
- **Message Editing**: Users can edit past messages. The system intelligently regenerates the conversation from that point onwards.
- **Conversation Management**: Organize chats with custom titles, rename conversations, and delete history.
- **Real-time UI**: A premium, responsive interface that supports dark mode and smooth animations.

### 🛠️ Developer-First Backend
- **Modular Routing**: Clean separation of concerns between `auth`, `user`, and `chat` routes.
- **Logging & Monitoring**: Every AI interaction is logged with details on the provider used and fallback events.
- **Production Ready**: Configured for deployment on platforms like Render with `trust proxy` support.

---

## 🚀 Tech Stack

- **Frontend**: Vanilla JavaScript, CSS3 (Rich Aesthetics), HTML5.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose ODM).
- **AI Models**: Google Gemini (1.5 Flash, 2.0 Flash, 1.5 Pro), Cohere (Command-R).
- **Authentication**: JWT, BcryptJS.
- **Email**: EmailJS Node.js SDK for transactional emails.

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- API Keys for Gemini and Cohere

### 1. Clone the Repository
```bash
git clone https://github.com/PranayKrGupta/AIMitra.git
cd AIMitra
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and populate it with the following:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
BASE_URL=http://localhost:3000

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
COHERE_API_KEY=your_cohere_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# EmailJS Configuration
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_SIGNUP=your_signup_template_id
EMAILJS_TEMPLATE_RESET=your_reset_template_id
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
```


### 4. Run the Application
```bash
# Development mode
node server.js

# Production mode
npm start
```

---

## 📁 Project Structure

```text
├── middleware/          # Authentication & security middleware
├── models/              # Mongoose schemas (User, Conversation, Message, ChatLog)
├── public/              # Static frontend assets (HTML, CSS, JS)
├── routes/              # Express API endpoints
├── services/            # Core business logic & AI fallback service
├── server.js            # Main entry point
└── .env                 # Environment configuration
```


Developed with ❤️ by [Pranay Kumar Gupta](https://github.com/PranayKrGupta)

