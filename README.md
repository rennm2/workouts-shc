# Workout Log API

An Express and SQLite API for logging workouts.

## Run

```
npm install
node index.js
```

The server runs on http://localhost:3000

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | List all workouts |
| GET | /api/health | Health check |
| GET | /api/workouts?exercise=squat | Search workouts by exercise name |
| GET | /api/workout/:id | Get one workout |
| POST | /api/create-workout | Add a workout |
| PUT | /api/update-workout/:id | Update a workout |
| DELETE | /api/delete-workout/:id | Delete a workout |

## Example request body

```json
{
  "exercise": "Squat",
  "sets": 3,
  "reps": 10,
  "weight": 60,
  "date": "2026-11-19",
  "notes": "felt good"
}
```