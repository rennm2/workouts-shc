const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database('./workouts.db', (err) => {
  if (err) {
    throw err;
  }
  console.log('Database connected');
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function createTable() {
  db.run(
    `CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL DEFAULT 0,
      date TEXT NOT NULL,
      notes TEXT
    )`,
    (err) => {
      if (err) console.error('Could not create table', err.message);
      else console.log('Table ready for workouts');
    }
  );
}

createTable();

function validate(body = {}) {
  const { exercise, sets, reps, date } = body;
  if (!exercise || !String(exercise).trim()) return 'Exercise name is required';
  if (!Number.isInteger(Number(sets)) || Number(sets) < 1) return 'Sets must be a whole number greater than 0';
  if (!Number.isInteger(Number(reps)) || Number(reps) < 1) return 'Reps must be a whole number greater than 0';
  if (!date) return 'Date is required';
  return null;
}

app.get('/', async (req, res) => {
  const result = await all('SELECT * FROM workouts ORDER BY date DESC, id DESC');
  res.status(200).json(result);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/workouts', async (req, res) => {
  const search = String(req.query.exercise || '').trim();
  const result = search
    ? await all('SELECT * FROM workouts WHERE exercise LIKE ? ORDER BY date DESC, id DESC', ['%' + search + '%'])
    : await all('SELECT * FROM workouts ORDER BY date DESC, id DESC');
  res.status(200).json(result);
});

app.get('/api/workout/:id', async (req, res) => {
  const thisWorkout = await get('SELECT * FROM workouts WHERE id = ?', [req.params.id]);
  if (!thisWorkout) return res.status(404).json({ error: 'Workout not found' });
  res.status(200).json(thisWorkout);
});

app.post('/api/create-workout', async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { exercise, sets, reps, weight, date, notes } = req.body;
  const { id } = await run(
    'INSERT INTO workouts (exercise, sets, reps, weight, date, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [exercise.trim(), Number(sets), Number(reps), Number(weight) || 0, date, notes || '']
  );
  const thisWorkout = await get('SELECT * FROM workouts WHERE id = ?', [id]);
  res.status(201).json(thisWorkout);
});

app.put('/api/update-workout/:id', async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { exercise, sets, reps, weight, date, notes } = req.body;
  const { changes } = await run(
    'UPDATE workouts SET exercise = ?, sets = ?, reps = ?, weight = ?, date = ?, notes = ? WHERE id = ?',
    [exercise.trim(), Number(sets), Number(reps), Number(weight) || 0, date, notes || '', req.params.id]
  );
  if (changes === 0) return res.status(404).json({ error: 'Workout not found' });
  const thisWorkout = await get('SELECT * FROM workouts WHERE id = ?', [req.params.id]);
  res.status(200).json(thisWorkout);
});

app.delete('/api/delete-workout/:id', async (req, res) => {
  const { changes } = await run('DELETE FROM workouts WHERE id = ?', [req.params.id]);
  if (changes === 0) return res.status(404).json({ error: 'Workout not found' });
  res.status(200).json({ message: 'Workout deleted' });
});

app.listen(port, () => {
  console.log(`Express app listening on port ${port}`);
});