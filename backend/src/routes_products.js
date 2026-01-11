const express = require("express");
const { pool } = require("./db");
const { authRequired } = require("./middleware_auth");

const router = express.Router();
router.use(authRequired);

// Listar
router.get("/", async (_req, res) => {
  const r = await pool.query(
    "SELECT * FROM products WHERE activo=TRUE ORDER BY id DESC"
  );
  res.json(r.rows);
});

// Crear
router.post("/", async (req, res) => {
  const { nombre, categoria, stock, stock_min, precio } = req.body || {};
  if (!nombre || !categoria) return res.status(400).json({ message: "Nombre y categoría requeridos" });

  const r = await pool.query(
    `INSERT INTO products(nombre,categoria,stock,stock_min,precio)
     VALUES($1,$2,$3,$4,$5) RETURNING *`,
    [
      nombre,
      categoria,
      Number.isFinite(+stock) ? +stock : 0,
      Number.isFinite(+stock_min) ? +stock_min : 0,
      Number.isFinite(+precio) ? +precio : 0
    ]
  );
  res.json(r.rows[0]);
});

// Actualizar
router.put("/:id", async (req, res) => {
  const id = +req.params.id;
  const { nombre, categoria, stock, stock_min, precio } = req.body || {};

  const r = await pool.query(
    `UPDATE products
     SET nombre=$1, categoria=$2, stock=$3, stock_min=$4, precio=$5
     WHERE id=$6 AND activo=TRUE
     RETURNING *`,
    [
      nombre,
      categoria,
      Number.isFinite(+stock) ? +stock : 0,
      Number.isFinite(+stock_min) ? +stock_min : 0,
      Number.isFinite(+precio) ? +precio : 0,
      id
    ]
  );
  if (r.rowCount === 0) return res.status(404).json({ message: "Producto no encontrado" });
  res.json(r.rows[0]);
});

// Eliminar (borrado lógico)
router.delete("/:id", async (req, res) => {
  const id = +req.params.id;
  const r = await pool.query(
    "UPDATE products SET activo=FALSE WHERE id=$1 RETURNING id",
    [id]
  );
  if (r.rowCount === 0) return res.status(404).json({ message: "Producto no encontrado" });
  res.json({ ok: true });
});

module.exports = router;
