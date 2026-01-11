const express = require("express");
const { pool } = require("./db");
const { authRequired } = require("./middleware_auth");

const router = express.Router();
router.use(authRequired);

// Registrar entrada/salida y ajustar stock
router.post("/", async (req, res) => {
  const { product_id, tipo, cantidad, nota } = req.body || {};
  const qty = +cantidad;

  if (!product_id || !["ENTRADA", "SALIDA"].includes(tipo)) {
    return res.status(400).json({ message: "Datos inválidos" });
  }
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ message: "Cantidad debe ser entero > 0" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pr = await client.query(
      "SELECT stock FROM products WHERE id=$1 AND activo=TRUE FOR UPDATE",
      [product_id]
    );
    if (pr.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const stockActual = pr.rows[0].stock;
    const nuevoStock = tipo === "ENTRADA" ? stockActual + qty : stockActual - qty;
    if (nuevoStock < 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Stock insuficiente para salida" });
    }

    await client.query("UPDATE products SET stock=$1 WHERE id=$2", [nuevoStock, product_id]);

    const mr = await client.query(
      `INSERT INTO movements(product_id, user_id, tipo, cantidad, nota)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [product_id, req.user.id, tipo, qty, nota || null]
    );

    await client.query("COMMIT");
    res.json({ movement: mr.rows[0], nuevoStock });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Error registrando movimiento" });
  } finally {
    client.release();
  }
});

// Listar historial
router.get("/", async (_req, res) => {
  const r = await pool.query(
    `SELECT m.*, p.nombre AS producto, u.nombre AS usuario
     FROM movements m
     JOIN products p ON p.id=m.product_id
     LEFT JOIN users u ON u.id=m.user_id
     ORDER BY m.id DESC
     LIMIT 200`
  );
  res.json(r.rows);
});

module.exports = router;
