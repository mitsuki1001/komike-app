const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MBまで
});

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 新規登録
app.post('/add-circle', upload.array('menu', 5), async (req, res) => {
  try {
    const { name, place, amount, memo, registrant, area, day } = req.body;
    const menuImages = req.files.map(file => file.buffer);
    const menuBase64Array = menuImages.map(buf => buf.toString('base64'));

    const query = `
      INSERT INTO circle_tab (name, place, amount, memo, menu, registrant, area, day)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [
      name,
      place,
      amount ? parseFloat(amount) : null,
      memo,
      JSON.stringify(menuBase64Array),
      registrant,
      area,
      day
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('登録エラー:', error.stack);
    res.status(500).send('サーバーエラーが発生しました');
  }
});

// 一覧取得
app.get('/circles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM circle_tab ORDER BY id DESC');
    const circles = result.rows.map(row => {
      try {
        if (typeof row.menu === 'string' && row.menu.trim().startsWith('[')) {
          row.menu = JSON.parse(row.menu);
        } else {
          row.menu = [];
        }
      } catch (e) {
        console.error(`menuのJSONパースエラー（id: ${row.id}）:`, e);
        row.menu = [];
      }
      return row;
    });
    res.json(circles);
  } catch (error) {
    console.error('一覧取得エラー:', error.stack);
    res.status(500).send('サーバーエラーが発生しました');
  }
});

// 詳細取得
app.get('/circle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM circle_tab WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('データが見つかりません');
    }
    const circle = result.rows[0];
    if (typeof circle.menu === 'string') {
      circle.menu = JSON.parse(circle.menu);
    }
    res.json(circle);
  } catch (error) {
    console.error('詳細取得エラー:', error.stack);
    res.status(500).send('サーバーエラーが発生しました');
  }
});

// 削除
app.delete('/circle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM circle_tab WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).send('指定されたデータは存在しません');
    }
    res.json({ message: '削除に成功しました', data: result.rows[0] });
  } catch (error) {
    console.error('削除エラー:', error.stack);
    res.status(500).send('サーバーエラーが発生しました');
  }
});

// 完了状態更新
app.put('/circle/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE circle_tab SET completed = true WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).send('指定されたデータが見つかりません');
    }
    const circle = result.rows[0];
    if (typeof circle.menu === 'string') {
      circle.menu = JSON.parse(circle.menu);
    }
    res.json(circle);
  } catch (error) {
    console.error('完了更新エラー:', error.stack);
    res.status(500).send('サーバーエラーが発生しました');
  }
});

// 完了状態を取り消す
app.put('/circle/:id/uncomplete', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE circle_tab SET completed = false WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).send('指定されたデータが見つかりません');
    }
    const circle = result.rows[0];
    if (typeof circle.menu === 'string') {
      circle.menu = JSON.parse(circle.menu);
    }
    res.json(circle);
  } catch (error) {
    console.error('完了取消エラー:', error.stack);
    res.status(500).send('サーバーエラーが発生しました');
  }
});


// 編集
app.put('/circle/:id', upload.array('menu', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, place, amount, memo, existingMenu, registrant, area, day } = req.body;

    let existingImages = [];
    if (existingMenu) {
      try {
        existingImages = JSON.parse(existingMenu);
      } catch (e) {
        console.error('既存画像のパースに失敗:', e);
        return res.status(400).send('既存画像の形式が不正です');
      }
    }

    const newImages = req.files.map(file => file.buffer.toString('base64'));
    const updatedMenu = [...existingImages, ...newImages];

    const query = `
      UPDATE circle_tab
      SET name = $1, place = $2, amount = $3, memo = $4, menu = $5, registrant = $6, area = $7, day = $8
      WHERE id = $9
      RETURNING *
    `;
    const result = await pool.query(query, [
      name,
      place,
      amount ? parseFloat(amount) : null,
      memo,
      JSON.stringify(updatedMenu),
      registrant,
      area,
      day,
      id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).send('指定されたデータが見つかりません');
    }

    const updated = result.rows[0];
    updated.menu = JSON.parse(updated.menu);
    res.json(updated);
  } catch (error) {
    console.error('更新エラー:', error.stack);
    res.status(500).send('サーバーエラーが発生しました');
  }
});


// 🔍 OCRエンドポイント
app.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '画像ファイルが必要です' });
    }

    const { buffer } = req.file;

    const result = await Tesseract.recognize(buffer, 'jpn', {
      logger: m => console.log(m) // 進捗ログ（任意）
    });

    res.json({ text: result.data.text });
  } catch (error) {
    console.error('OCRエラー:', error);
    res.status(500).json({ error: 'OCR処理中にエラーが発生しました' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
