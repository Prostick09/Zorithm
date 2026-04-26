# AlgoBot - AI-Powered Algorithm Chatbot

A modern, full-stack AI chatbot application designed to analyze algorithms and data structures using the Google Gemini API. Built with React (Vite) and Node.js (Express), following a scalable, feature-based architecture.

## 🚀 Features

- **Algorithm Analysis**: Get structured break-downs of algorithms (Time & Space complexity, intuition, step-by-step approach).
- **Gemini AI Integration**: Powered by Google's `gemini-1.5-flash` model.
- **Premium UI/UX**: Dark mode (with light mode toggle), glassmorphism design, clean animations.
- **Syntax Highlighting**: Beautiful code block outputs.
- **Session History**: Persisted, multi-session chat side panel for conversation history.
- **Feature-based Architecture**: Ensures code scalability and modularity.

## 📁 Project Architecture

The project is structured as a monorepo containing a `client` and a `server`, both leveraging feature-based folders.

```
algobot/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── features/           # Feature modules
│   │   │   └── chat/           # Chat logic, UI, and API calls
│   │   ├── shared/             # Reusable UI components & logic
│   │   │   ├── components/     # Navbar, Sidebar, etc.
│   │   │   ├── utils/          # Formatting & helpers
│   │   │   └── api/            # Axios API config
│   │   ├── App.jsx             # Root layout
│   │   └── index.css           # Global design system & theme variables
├── server/                     # Express Backend
│   ├── src/
│   │   ├── features/           # Isolated backend domains
│   │   │   ├── chat/           # Gemini API integrations
│   │   │   ├── history/        # Session retrieval
│   │   │   └── user/           # User preferences placeholder
│   │   ├── shared/
│   │   │   ├── config/         # Environment & Gemini setup
│   │   │   ├── middleware/     # Error handlers & rate limiters
│   │   │   └── utils/          # Standard response generators
│   │   ├── app.js              # Express app definition
│   │   └── index.js            # Server entry point
│   ├── .env                    # Secrets & config
│   └── package.json            
└── package.json                # Monorepo root
```

## 🛠️ Step-by-Step Installation

### Step 1: Install Dependencies
This project uses `concurrently` in the root folder to manage both halves of the project easily. Open your terminal at `algobot/` and run:

```bash
npm run install:all
```
*(This commands installs dependencies in the root, inside `/client`, and inside `/server`.)*

### Step 2: Configure Environment Variables
Inside `server/.env`, ensure you supply a valid Google Gemini API Key. To acquire one, visit [Google AI Studio](https://aistudio.google.com/app/apikey).

```
# server/.env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:5173
```

### Step 3: Run the Application
Finally, start up both the React frontend and the Express backend simultaneously from the root `algobot` directory:

```bash
npm run dev
```

You can now view AlgoBot natively on **http://localhost:5173**! 🎉
