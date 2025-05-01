const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const dbFilename = 'users.db';
const dbPath = path.join(dataDir, dbFilename);

const fs = require('fs');
if (!fs.existsSync(dataDir)){
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`資料目錄 ${dataDir} 已建立。`);
    } catch (err) {
        console.error(`無法建立資料目錄 ${dataDir}:`, err);
        process.exit(1);
    }
} else {
    console.log(`資料目錄 ${dataDir} 已存在。`);
}

console.log(`嘗試連接資料庫於: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("資料庫連接失敗:", err.message);
    console.error("資料庫路徑:", dbPath);
  } else {
    console.log(`成功連接到 SQLite 資料庫: ${dbPath}`);
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    )`, (err) => {
      if (err) {
        console.error("建立資料表失敗:", err.message);
      } else {
        console.log("Users 資料表已準備就緒.");
      }
    });
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/users', (req, res) => {
  const sql = "SELECT id, name, email FROM users ORDER BY id DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("查詢用戶失敗:", err.message);
      res.status(500).json({ error: '無法讀取用戶資料' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: '姓名和 Email 不得為空' });
  }
  const sql = "INSERT INTO users (name, email) VALUES (?, ?)";
  db.run(sql, [name, email], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
          console.error("新增用戶失敗 (Email重複):", email);
          return res.status(409).json({ error: '此 Email 已被註冊' });
      }
      console.error("新增用戶失敗:", err.message);
      return res.status(500).json({ error: '無法儲存用戶資料' });
    } else {
      console.log(`成功新增用戶: ID ${this.lastID}, Name: ${name}, Email: ${email}`);
      res.status(201).json({ id: this.lastID, name: name, email: email });
    }
  });
});

app.listen(port, () => {
  console.log(`伺服器正在監聽 port ${port}`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('資料庫連接已關閉.');
    process.exit(0);
  });
});