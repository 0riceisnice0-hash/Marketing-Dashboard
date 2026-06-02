CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  requester TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Marketing',
  priority TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'New',
  owner TEXT NOT NULL DEFAULT 'Zac',
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  impact TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Inbox',
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  lane TEXT NOT NULL DEFAULT 'Today',
  owner TEXT NOT NULL DEFAULT 'Zac',
  due_date TEXT NOT NULL DEFAULT '',
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  requester TEXT NOT NULL DEFAULT '',
  asset_type TEXT NOT NULL DEFAULT 'Photo',
  deadline TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Needed',
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS website_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'Website',
  status TEXT NOT NULL DEFAULT 'Planned',
  release_date TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS changelog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  shipped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  area TEXT NOT NULL DEFAULT 'Marketing',
  detail TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_type TEXT NOT NULL,
  parent_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, lane, owner, due_date) VALUES
  ('Review open showroom requests', 'Today', 'Zac', ''),
  ('Plan this week''s content priorities', 'This Week', 'Zac', ''),
  ('Prepare next website update notes', 'Later', 'Zac', '');

INSERT INTO website_updates (title, area, status, release_date, detail) VALUES
  ('Homepage refresh queue', 'Homepage', 'Planned', '', 'Track hero copy, product image swaps, offers, and showroom CTAs here.'),
  ('Latest shipped website changes', 'Changelog', 'Live', '', 'Use this area to keep Adam and Nick up to date without side-channel chasing.');

INSERT INTO changelog (title, area, detail) VALUES
  ('Dashboard first version', 'Operations', 'Tickets, tasks, ideas, website updates, content requests, tools placeholder, and changelog are ready.');
