require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes_auth");
const productRoutes = require("./routes_products");
const movementRoutes = require("./routes_movements");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ ok: true, name: "Inventario Cafetería API" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/movements", movementRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API running on port", PORT));
