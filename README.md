# The Last Race – Dystopic London Underground Escape

A web application simulating a high-stakes escape through a dystopic London Underground network, built with **React** (Vite, React Router, React Bootstrap) on the frontend and **Node.js** (Express, Passport.js, SQLite3) on the backend.

It was developed locally as **Exam #1** for the **Web Applications I** course at Politecnico di Torino by **Francesco Maria Madaro** (`s355068`), and is published here as a snapshot of the finished project, so the repository has no development history.

---

## Gameplay & Mission Mechanics

- **Objective**: Navigate through an underground dystopic metro network from an assigned **starting station** to a **destination station** before time runs out.
- **Route Assignment**: Upon starting a mission, the server generates a random route assignment. The shortest distance between start and destination is guaranteed to be at least 3 stations ($\ge 3$ stops).
- **Segment Selection & Memory Test**: The player builds a path by selecting contiguous station-to-station segments. While in execution mode, full line layouts are hidden on the map to test the agent's spatial memory.
- **90-Second Submission Timer**: The agent has 90 seconds to plan the route and click **TRANSMIT**. Exceeding the timer results in mission failure (0 points).
- **Scoring & Coin System**:
  - The agent starts with an initial budget of **20 coins**.
  - **Valid Route**: Submitting a continuous, valid path from start to end triggers the travel phase. Each traversed station segment triggers a random event that modifies the coin balance (bonus or penalty).
  - **Invalid Route or Timeout**: Invoking an incomplete route, non-adjacent stations, wrong start/end points, or running out of time results in zero coins (**0 score**).
  - **Score Floor**: The total coin balance cannot drop below 0.
- **Travel Phase & Random Events**: A step-by-step travel simulation with ambient video playback resolves events per station segment. Events are selected server-side using weighted probabilities (e.g., secret shortcuts, guards, pickpockets).
- **Leaderboard**: Successful mission scores are recorded in the database, with a global ranking showing each user's maximum score.

---

## Controls & Interface

| Interface Element / Action | Description |
| :--- | :--- |
| **EXECUTE Button** | Initiates a new mission, requesting a randomized start and destination from the server and starting the 90s timer. |
| **Map Canvas (Interactive SVG)** | Displays stations and network geography. Lines are shown in briefing mode and hidden during active mission execution. |
| **Segment Selection List** | Lists available adjacent station pairs. Clicking a segment toggles its inclusion in the planned escape path. |
| **TRANSMIT Button** | Submits the selected path segments to the server for graph validation and begins the travel phase. |
| **Login / Logout** | Authenticates agents with session persistence using secure cookie-based credentials. |

---

## How It Works

Main application execution is divided into a RESTful Express server handling stateful graph validation and a dynamic React single-page application.

### Backend & Graph Architecture
- **Graph Representation**: Upon initialization, the server fetches network stations and line ordering from the database and builds an in-memory graph where stations act as nodes. Each node maintains a **Double-Linked List** mapping adjacent stations per line and flagging multi-line interchange hubs (`exchange: true`).
- **Shortest Path & Route Generator**: Uses Breadth-First Search (BFS) over the double-linked graph structure to select valid start and end nodes separated by at least 3 hops.
- **Session-Locked Validation**: Route assignments are stored securely in `req.session.assignedRoute`. Client-submitted segment arrays are verified against graph adjacencies to prevent client-side path spoofing or cheating.
- **Weighted Event Engine**: Server selects segment events based on database event weights ($\text{Probability} \propto \text{weight}$) and updates game scores in SQLite.

---

## Code Layout

```
.
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/        # UI & Game components
│   │   │   ├── Play.jsx       # Main mission control interface & timer state
│   │   │   ├── DystopicMap.jsx# SVG Map rendering (lines & stations)
│   │   │   ├── SegmentHandler.jsx # Segment list & selection handler
│   │   │   ├── Travel.jsx     # Video-backed travel phase & event sequence
│   │   │   ├── Result.jsx     # Mission report & final score breakdown
│   │   │   ├── UserProfile.jsx# User details & historical score leaderboard
│   │   │   ├── Home.jsx       # Introductory mission dossier landing page
│   │   │   ├── Login.jsx      # Authentication form
│   │   │   └── ProtectedRoute.jsx # Route authentication guard
│   │   ├── assets/            # Video media assets (travel.webm)
│   │   ├── api.js             # Client API service wrapper (fetch with credentials)
│   │   └── App.jsx            # React Router route definitions
├── server/                     # Express Backend & DAO
│   ├── index.js               # Server entry point, middleware & REST API endpoints
│   ├── dao.js                 # SQLite database query methods & scrypt auth
│   └── network-builder.js     # Double-linked list graph, BFS route generator & path validator
├── database.db                 # SQLite database storing users, games, network topology & events
├── images/                     # Application screenshots
└── README.md                   # Project documentation
```

---

## Screenshots

![Leaderboard](images/best.png)
*Global Leaderboard showing top scores*

![Full Map View](images/lines.png)
*Briefing mode: Full network lines and stations visible*

![Execution Mode](images/no_lines.png)
*Execution mode: Lines hidden to test spatial memory*

---

## User Credentials

Test accounts available in the database (Password: `password123` for all):

- `john_doe` : `password123`
- `jane_smith` : `password123`
- `alice_wonder` : `password123`
- `bob_builder` : `password123` *(New agent with no recorded games)*

---

## Code Origin

The project was developed from scratch as Exam #1 for the Web Applications I course at Politecnico di Torino (A.Y. 2024/2025). 

The application logic, SQLite database schema design, double-linked graph representation, path validation algorithm, React UI components, custom styling, and dystopic theme styling are my own work. Generative AI tools were utilized for UI design inspiration and debugging support during development. All generated suggestions were carefully verified, adapted, and tested for correctness.

---

## Build and Run

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### Setup & Execution

1. **Install Dependencies**:
   Install root, server, and client dependencies:
   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

2. **Start the Backend Server**:
   ```bash
   npm run dev:server
   ```
   The Express API server starts on `http://localhost:3001`.

3. **Start the Frontend Client**:
   In a second terminal, launch the Vite development server:
   ```bash
   npm run dev:client
   ```
   Open `http://localhost:5173` in your browser to access the application.

---

## Limitations

- **Session State Persistence**: Mission state (`assignedRoute`) is stored in server session memory (`express-session`). Reloading or hard refreshing the browser mid-game during `/play` resets local component state.
- **Single Active Mission**: Only one active mission route per session can be held at a time.
- **Leaderboard Scope**: The global ranking displays the single highest score achieved by each user (`MAX(score)`), rather than full historical match logs.
- **Station Coordinates**: SVG map rendering uses pre-calculated station coordinate points, tuned for desktop resolutions.
