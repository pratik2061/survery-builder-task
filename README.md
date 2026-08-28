# Dynamic Survey Application

A full-stack dynamic survey application built with Node.js, Express, Prisma, PostgreSQL, React, and Tailwind CSS.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- pnpm
- PostgreSQL database

### 1. Backend Setup
```bash
cd backend
pnpm install
```
1. Create a `.env` file in the `backend` directory (copy from `.env.example`).
2. Add your PostgreSQL connection string to `DATABASE_URL`.
3. Push the Prisma schema and generate the client:
```bash
npx prisma db push
```
4. Start the backend server:
```bash
pnpm run dev
```

### 2. Frontend Setup
```bash
cd frontend
pnpm install
pnpm run dev
```
The frontend will be available at `http://localhost:5173`.

## Architecture Decisions & Trade-offs

1. **Database Schema (JSON vs. Normalized)**
   - **Decision:** The `Survey` model stores `questions` as a structured `JSONB` array, and the `Response` model stores `answers` as a `JSONB` object.
   - **Why:** This approach provides maximum flexibility and iteration speed for dynamic features like conditional logic and question ordering. Creating a fully normalized schema (Survey -> Question -> Option, etc.) requires complex joins and makes ordering and conditional dependencies very hard to manage at the database level.
   - **Trade-off:** We lose some strict referential integrity at the database level. To mitigate this, we use **Zod** on the backend to enforce strict schema validation for the JSON payload.

2. **Conditional Logic Engine**
   - **Decision:** Evaluated on the frontend in the React component during rendering.
   - **Why:** Keeps the client snappy. When a question's `dependsOnId` answer does not equal `equalsValue`, the question is hidden from the user, and its value is ignored/removed upon submission.

3. **Prisma Version**
   - **Decision:** Downgraded from the Prisma 8 Release Candidate to stable Prisma 5.
   - **Why:** The Prisma 8 RC has experimental syntax and changes (e.g. `contract emit`, missing `@updatedAt` support), which introduced instability for this tight timeframe. Prisma 5 is stable, widely adopted, and fits the standard Express/Prisma setup perfectly.

4. **UI Framework**
   - **Decision:** Tailwind CSS + custom React components (without heavy component libraries).
   - **Why:** Ensures a clean, modern aesthetic quickly without the overhead of learning or fighting a heavy UI framework.

## Future Improvements (Given more time)
- **Authentication:** Add JWT-based auth for the admin panel to prevent unauthorized survey creation.
- **Advanced Conditional Logic:** Support `NOT_EQUALS`, `GREATER_THAN`, `CONTAINS`, and multi-rule logic (`AND`/`OR`).
- **Drag & Drop:** Implement a library like `dnd-kit` for smoother question reordering in the builder.
- **Analytics Charts:** Add Recharts or Chart.js for visual data representation in the dashboard.
