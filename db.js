import Database from "better-sqlite3";

const db = new Database("helpdesk.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','in_progress','closed')),
    priority   TEXT NOT NULL DEFAULT 'medium'
               CHECK (priority IN ('low','medium','high')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

if (db.prepare("SELECT COUNT(*) AS n FROM tickets").get().n === 0) {
  const insert = db.prepare(
    "INSERT INTO tickets (title, status, priority) VALUES (?, ?, ?)"
  );
  insert.run("Login page throws 500 error", "open", "high");
  insert.run("Update footer copyright year", "open", "low");
  insert.run("Slow dashboard on mobile", "in_progress", "medium");
  insert.run("Password reset email not arriving", "open", "high");
}

export default db;