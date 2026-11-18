const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database(path.join(__dirname, 'workouts.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise TEXT NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight REAL DEFAULT 0,
    date TEXT NOT NULL,
    notes TEXT
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validate(body) {
  const { exercise, sets, reps, date } = body;
  if (!exercise || !exercise.trim()) return 'Exercise name is required';
  if (!Number.isInteger(Number(sets)) || Number(sets) < 1) return 'Sets must be a whole number greater than 0';
  if (!Number.isInteger(Number(reps)) || Number(reps) < 1) return 'Reps must be a whole number greater than 0';
  if (!date) return 'Date is required';
  return null;
}

app.get('/api/workouts', (req, res) => {
  const search = (req.query.exercise || '').trim();
  const rows = search
    ? db.prepare('SELECT * FROM workouts WHERE exercise LIKE ? ORDER BY date DESC, id DESC').all('%' + search + '%')
    : db.prepare('SELECT * FROM workouts ORDER BY date DESC, id DESC').all();
  res.json(rows);
});

app.post('/api/workouts', (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { exercise, sets, reps, weight, date, notes } = req.body;
  const info = db
    .prepare('INSERT INTO workouts (exercise, sets, reps, weight, date, notes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(exercise.trim(), Number(sets), Number(reps), Number(weight) || 0, date, notes || '');
  res.status(201).json({ id: info.lastInsertRowid });
});

app.put('/api/workouts/:id', (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { exercise, sets, reps, weight, date, notes } = req.body;
  const info = db
    .prepare('UPDATE workouts SET exercise = ?, sets = ?, reps = ?, weight = ?, date = ?, notes = ? WHERE id = ?')
    .run(exercise.trim(), Number(sets), Number(reps), Number(weight) || 0, date, notes || '', req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Workout not found' });
  res.json({ ok: true });
});

app.delete('/api/workouts/:id', (req, res) => {
  const info = db.prepare('DELETE FROM workouts WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Workout not found' });
  res.json({ ok: true });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));