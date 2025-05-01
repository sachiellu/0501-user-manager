// 1. 引入需要的模組
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 2. 初始化 Express 應用程式
const app = express();
const port = process.env.PORT || 3000;

// --- 資料庫設定修改 ---
// 1. 定義持久性磁碟的掛載點 (Render 通常是 /var/data)
const dataDir = process.env.RENDER_DISK_MOUNT_PATH || path.join(__dirname, 'data'); 
const dbFilename = 'users.db';
const dbPath = path.join(dataDir, dbFilename);

// 2. 確保資料庫目錄存在 (尤其是在本地第一次執行時)
const fs = require('fs');
if (!fs.existsSync(dataDir)){
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`資料目錄 ${dataDir} 已建立。`);
    } catch (err) {
        console.error(`無法建立資料目錄 ${dataDir}:`, err);
        // 如果無法建立目錄，可能無法繼續，可以考慮拋出錯誤或退出
        process.exit(1);
    }
} else {
    console.log(`資料目錄 ${dataDir} 已存在。`);

// 3. 使用新的 dbPath 連接資料庫
console.log(`嘗試連接資料庫於: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("資料庫連接失敗:", err.message);
    // 在 Render 上查看 log 很重要，這裡可以印出更詳細的路徑資訊
    console.error("資料庫路徑:", dbPath);
  } else {
    console.log(`成功連接到 SQLite 資料庫: ${dbPath}`);
    // 建立資料表的程式碼不變...
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

// --- 中介軟體設定 ---
app.use(express.json());
// 提供 public 資料夾內容 (路徑維持不變)
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoints (路由) ---
// (GET /api/users 和 POST /api/users 的程式碼維持不變)
// ... (省略不變的 API 程式碼) ...
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


// --- 啟動伺服器 (使用更新後的 port) ---
app.listen(port, () => {
  // 注意：Render 環境不一定能從 localhost 訪問，顯示公開 URL 更有用
  // 但我們在啟動時不知道公開 URL，所以只顯示端口即可
  console.log(`伺服器正在監聽 port ${port}`);
});

// 優雅地關閉資料庫連接 (維持不變)
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('資料庫連接已關閉.');
    process.exit(0);
  });
});