# Notes App — Cohort 9 MERN Assignment

**10Pearls Shine Internship Program** · MERN (Node.js + React.js) Domain
**Candidate:** Aamir Javed

A full-stack note-taking application with JWT-based authentication and real-time note updates, built for the 10Pearls Shine candidate portal assignment.

---

## Tech Stack

Node.js, Express.js, React.js, PostgreSQL, JWT + bcrypt, Socket.IO, Pino, Mocha/Chai/Sinon, SonarQube

## Features

- User Authentication (Register, Login, Logout, Refresh Token, Get Current User)
- Protected Routes & Per-User Resource Ownership
- Notes CRUD
- Real-Time Note Updates (Socket.IO)
- Centralized Error Handling
- Request Logging
- Input Validation
- Unit Testing

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env
createdb notes_app
npm run init-db
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Testing

```bash
cd backend
npm test
npm run test:coverage
```

## Demo & Code Quality

- **Project Demo Video:** [Recorded_10Pearl_intenship_project.mp4](./Recorded_10Pearl_intenship_project.mp4)
- **Backend SonarQube Quality Screenshot:** [sonarQubeBackend_Quality.png](./backend/sonarQubeBackend_Quality.png)
- **Frontend SonarQube Quality Screenshot:** [sonarQubeFrontend_Quality.png](./frontend/sonarQubeFrontend_Quality.png)

## Git Workflow

`develop` — integration branch · `feature/backend/<name>` / `feature/frontend/<name>` — feature branches, rebased onto `develop` before PR · work done on a personal fork, submitted via pull request

---

## Author

**Aamir Javed** — Cohort 9, 10Pearls Shine Internship Program (MERN Domain)