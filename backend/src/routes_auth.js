const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("./db");

const router = express.Router();

// Registro
router.post("/register", async (req, res) => {
  const { cedula, nombre, password } = req.body || {};
  if (!cedula || !nombre || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }
  if (!/^\d{10}$/.test(cedula)) {
    return res.status(400).json({ message: "Cédula debe tener 10 dígitos" });
  }
  if (password.length < 4) {
    return res.status(400).json({ message: "Contraseña muy corta" });
  }

  const password_hash = await bcrypt.hash(password, 10);

  try {
    const q = `
      INSERT INTO users (cedula, nombre, password_hash)
      VALUES ($1,$2,$3)
      RETURNING id, cedula, nombre
    `;
    const r = await pool.query(q, [cedula, nombre, password_hash]);
    return res.json({ user: r.rows[0] });
  } catch (e) {
    if (String(e).includes("duplicate")) {
      return res.status(409).json({ message: "Cédula ya registrada" });
    }
    return res.status(500).json({ message: "Error al registrar" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { cedula, password } = req.body || {};
  if (!cedula || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  const r = await pool.query("SELECT * FROM users WHERE cedula=$1", [cedula]);
  if (r.rowCount === 0) return res.status(401).json({ message: "Credenciales inválidas" });

  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

  const token = jwt.sign(
    { id: user.id, cedula: user.cedula, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: "6h" }
  );

  return res.json({ token, user: { id: user.id, cedula: user.cedula, nombre: user.nombre } });
});

module.exports = router;
