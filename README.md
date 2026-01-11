# Inventario Cafetería (Actividad 8)

Aplicativo Web con **Frontend (HTML/CSS/JS)** + **Backend (Node.js/Express)** + **Base de datos PostgreSQL**.

## Requisitos
- Node.js 18+
- PostgreSQL 12+

## 1) Base de datos
Crea la base:
```sql
CREATE DATABASE inventario_cafeteria;
```

Luego ejecuta el script:
- `backend/sql/schema.sql`

## 2) Backend
```bash
cd backend
cp .env.example .env
# Edita DATABASE_URL y JWT_SECRET
npm install
npm run dev
```
API: `http://localhost:3000`

## 3) Frontend
Abre `frontend/index.html` con Live Server (VSCode) o cualquier servidor estático.
- Login/Registro: `index.html`
- Dashboard: `app.html`

## Funcionalidades
- Registro/Login (JWT)
- CRUD de productos
- Entradas/Salidas (movimientos) con ajuste de stock
- Historial de movimientos
- Interfaz responsive (Bootstrap)
