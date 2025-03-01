const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve the frontend
const frontendPath = path.join(__dirname, "../ecommerce-frontend");
app.use(express.static(frontendPath));

// ✅ Serve the images folder correctly
app.use("/images", express.static(path.join(frontendPath, "images")));

// ✅ Database setup
const db = new sqlite3.Database("ecommerce.db", (err) => {
  if (err) console.error("Database connection error:", err.message);
  else console.log("✅ Connected to SQLite database.");
});

// ✅ Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    productId INTEGER,
    productName TEXT,
    FOREIGN KEY(productId) REFERENCES products(id)
  )`);
});

// ✅ Route to fetch all products
app.get("/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

// ✅ Route to fetch a specific product
app.get("/product/:id", (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) res.status(500).json({ error: err.message });
    else if (!row) res.status(404).json({ error: "Product not found" });
    else res.json(row);
  });
});

// ✅ Route to handle purchases
app.post("/purchase", (req, res) => {
  const { transactionId, productId, productName } = req.body;

  // Check if product exists before inserting transaction
  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!product) return res.status(400).json({ error: "Invalid product ID" });

    db.run(
      "INSERT INTO transactions (id, productId, productName) VALUES (?, ?, ?)",
      [transactionId, productId, productName],
      (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ transactionId, message: "Purchase successful" });
      }
    );
  });
});

// ✅ Serve frontend index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ✅ Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
