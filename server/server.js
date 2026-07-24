const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'circle-management-secret-2026';


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MBまで
});

const app = express();
app.use(express.json());

const allowedOrigins = [
  'https://comike-client.onrender.com',
  'https://www.example.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // originがundefined（例: curlやリロード時）でも許可
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // 許可
    } else {
      callback(new Error('CORSポリシーによりアクセスが拒否されました'));
    }
  },
  credentials: true
}));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ユーザー登録
app.post('/register', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        message: '名前とパスワードは必須です'
      });
    }

    const exists = await pool.query(
      'SELECT id FROM users WHERE name = $1',
      [name]
    );

    if (exists.rowCount > 0) {
      return res.status(409).json({
        message: '既に存在するユーザーです'
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (
        name,
        password_hash
      )
      VALUES
      (
        $1,
        $2
      )
      RETURNING
      id,
      name,
      is_admin,
      created_at
      `,
      [
        name,
        hashedPassword
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error('ユーザー登録エラー:', error);

    res.status(500).json({
      message: 'ユーザー登録に失敗しました'
    });
  }
});
// ログイン
app.post('/login', async (req, res) => {
  try {

    const { name, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE name = $1',
      [name]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        message: 'ユーザー名またはパスワードが違います'
      });
    }

    const user = result.rows[0];

    const isValidPassword =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!isValidPassword) {
      return res.status(401).json({
        message: 'ユーザー名またはパスワードが違います'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        isAdmin: user.is_admin
      },
      JWT_SECRET,
      {
        expiresIn: '30d'
      }
    );

    res.json({
      token,
      id: user.id,
      name: user.name,
      isAdmin: user.is_admin
    });

  } catch (error) {
    console.error('ログインエラー:', error);

    res.status(500).json({
      message: 'ログインに失敗しました'
    });
  }
});

// ログインユーザー取得
app.get('/me', async (req, res) => {

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: '認証情報がありません'
    });
  }

  try {

    const token =
      authHeader.replace('Bearer ', '');

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    res.json(decoded);

  } catch (error) {

    res.status(401).json({
      message: 'トークンが無効です'
    });

  }
});

// 新規登録
app.post('/add-circle', upload.array('menu', 5), async (req, res) => {
  try {
    const { name, place, amount, memo, registrant, area, day, priorityLabel, priorityValue, buyer, actualAmount, readPermission } = req.body;
    const menuImages = req.files.map(file => file.buffer);
    const menuBase64Array = menuImages.map(buf => buf.toString('base64'));

    const query = `
      INSERT INTO circle_tab (name, place, amount, memo, menu, registrant, area, day, priority_label, priority_value, buyer, actual_amount,read_permission)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      day,
      priorityLabel,
      parseInt(priorityValue),
      buyer,
      actualAmount ? parseInt(actualAmount) : null,
      readPermission || 'public'
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('登録エラー:', error.stack);
    res.status(500).send('サーバーエラーが発生しました');
  }
});

// 一覧取得
// 一覧取得
app.get('/circles', async (req, res) => {
  try {
    const isAdmin =
      req.query.isAdmin === 'true';
    let result;
    if (isAdmin) {
      result = await pool.query(`
        SELECT *
        FROM circle_tab
        ORDER BY id DESC
      `);
    } else {
      result = await pool.query(`
        SELECT *
        FROM circle_tab
        WHERE read_permission = 'public'
        ORDER BY id DESC
      `);
    }
    const circles = result.rows.map(row => {
      try {
        if (
          typeof row.menu === 'string' &&
          row.menu.trim().startsWith('[')
        ) {
          row.menu = JSON.parse(row.menu);
        } else {
          row.menu = [];
        }
      } catch (e) {
        console.error(
          `menuのJSONパースエラー（id: ${row.id}）:`,
          e
        );
        row.menu = [];
      }
      return row;
    });
    res.json(circles);
  } catch (error) {
    console.error(
      '一覧取得エラー:',
      error.stack
    );
    res.status(500).send(
      'サーバーエラーが発生しました'
    );
  }
});
// 詳細取得
app.get('/circle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin =
      req.query.isAdmin === 'true';
    const result = await pool.query(
      'SELECT * FROM circle_tab WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .send('データが見つかりません');
    }
    const circle = result.rows[0];
    // 管理者限定チェック
    if (
      circle.read_permission === 'admin'
      &&
      !isAdmin
    ) {
      return res
        .status(403)
        .send('閲覧権限がありません');
    }
    if (typeof circle.menu === 'string') {
      circle.menu =
        JSON.parse(circle.menu);
    }
    res.json(circle);
  } catch (error) {
    console.error(
      '詳細取得エラー:',
      error.stack
    );
    res.status(500).send(
      'サーバーエラーが発生しました'
    );
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
    const { buyer } = req.body;
    const result = await pool.query(
      `UPDATE circle_tab 
       SET completed = true,
       buyer = $2,
       actual_amount = COALESCE(actual_amount, amount)
       WHERE id = $1
       RETURNING *`,
      [id, buyer || null]
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

// 完売状態更新
app.put('/circle/:id/soldout', async (req, res) => {
  try {
    const { id } = req.params;
    const { buyer } = req.body;

    const result = await pool.query(
      `UPDATE circle_tab
       SET completed = true,
           buyer = $2,
           actual_amount = 0
       WHERE id = $1
       RETURNING *`,
      [id, buyer || null]
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
    console.error('完売更新エラー:', error.stack);
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
    const { name, place, amount, memo, existingMenu, registrant, area, day, priorityLabel, priorityValue, buyer, actualAmount, readPermission } = req.body;

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
      SET name = $1, place = $2, amount = $3, memo = $4, menu = $5, registrant = $6, area = $7, day = $8, priority_label = $9, priority_value = $10, buyer = $11, actual_amount = $12, read_permission = $13
      WHERE id = $14
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
      priorityLabel,
      priorityValue,
      buyer,
      actualAmount ? parseInt(actualAmount) : null,
      readPermission || 'public',
      id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).send('指定されたデータが見つかりません');
    }

    const updated = result.rows[0];
    // updated.menu = JSON.parse(updated.menu); 20251229更新対応 JSON変換いらなくなった
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

// 金額データを取得
app.get('/settlement', async (req, res) => {
  const { day } = req.query;

  try {
    let query = 'SELECT buyer, registrant, actual_amount, amount, day FROM circle_tab';
    const params = [];

    if (day) {
      query += ' WHERE day = $1';
      params.push(day);
    }

    const result = await pool.query(query, params);
    const rows = result.rows;

    const settlements = {};

    rows.forEach(row => {
      const { buyer, registrant, actual_amount, amount } = row;
      if (!buyer || !registrant || buyer === registrant) return;

      const actual = actual_amount ? parseInt(actual_amount) : 0;
      const estimated = amount ? parseInt(amount) : 0;

      if (!settlements[registrant]) {
        settlements[registrant] = {
          registrant,
          payments: [],
          actualTotal: 0,
          estimatedTotal: 0
        };
      }

      settlements[registrant].payments.push({
        to: buyer,
        actualAmount: actual,
        amount: estimated,
        day: row.day 
      });

      settlements[registrant].actualTotal += actual;
      settlements[registrant].estimatedTotal += estimated;
    });

    res.json(Object.values(settlements));
  } catch (error) {
    console.error('精算集計エラー:', error.stack);
    res.status(500).send('精算データの取得に失敗しました');
  }
});


// 購入者と登録者一覧を取得
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT buyer, registrant FROM circle_tab');
    const buyers = new Set();
    const registrants = new Set();

    result.rows.forEach(row => {
      if (row.buyer) buyers.add(row.buyer);
      if (row.registrant) registrants.add(row.registrant);
    });

    res.json({
      buyers: Array.from(buyers),
      registrants: Array.from(registrants)
    });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error.stack);
    res.status(500).send('ユーザー一覧の取得に失敗しました');
  }
});

// 精算計算
app.get('/payment', async (req, res) => {
  const { buyer, registrant, day } = req.query;

  if (!buyer || !registrant) {
    return res.status(400).send('buyerとregistrantを指定してください');
  }

  try {
    // A → B の支払い
    const conditionsAB = ['buyer = $1', 'registrant = $2'];
    const valuesAB = [buyer, registrant];

    if (day) {
      conditionsAB.push('day = $3');
      valuesAB.push(day);
    }

    const resultAB = await pool.query(
      `SELECT actual_amount, amount FROM circle_tab WHERE ${conditionsAB.join(' AND ')}`,
      valuesAB
    );

    // B → A の支払い（逆方向）
    const conditionsBA = ['buyer = $1', 'registrant = $2'];
    const valuesBA = [registrant, buyer];

    if (day) {
      conditionsBA.push('day = $3');
      valuesBA.push(day);
    }

    const resultBA = await pool.query(
      `SELECT actual_amount, amount FROM circle_tab WHERE ${conditionsBA.join(' AND ')}`,
      valuesBA
    );

    let actualAB = 0;
    let estimatedAB = 0;
    resultAB.rows.forEach(row => {
      actualAB += row.actual_amount ? parseInt(row.actual_amount) : 0;
      estimatedAB += row.amount ? parseInt(row.amount) : 0;
    });

    let actualBA = 0;
    let estimatedBA = 0;
    resultBA.rows.forEach(row => {
      actualBA += row.actual_amount ? parseInt(row.actual_amount) : 0;
      estimatedBA += row.amount ? parseInt(row.amount) : 0;
    });

    // 相殺後の金額（A → B）
    const netActual = actualAB - actualBA;
    const netEstimated = estimatedAB - estimatedBA;

    res.json({
      from: registrant,
      to: buyer,
      actualAmount: netActual > 0 ? netActual : 0,
      amount: netEstimated > 0 ? netEstimated : 0
    });
  } catch (error) {
    console.error('個別精算取得エラー:', error.stack);
    res.status(500).send('精算データの取得に失敗しました');
  }
});

function authenticateToken(
  req,
  res,
  next
) {

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.sendStatus(401);
  }

  const token =
    authHeader.replace(
      'Bearer ',
      ''
    );

  jwt.verify(
    token,
    JWT_SECRET,
    (err, user) => {

      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;

      next();
    }
  );
}

function requireAdmin(
  req,
  res,
  next
) {

  if (!req.user.isAdmin) {

    return res.status(403).json({
      message: '管理者権限が必要です'
    });

  }

  next();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
