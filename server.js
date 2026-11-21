require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

async function iniciarBanco() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicamentos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        principio_ativo VARCHAR(150),
        dosagem VARCHAR(50),
        unidade_saude VARCHAR(120) DEFAULT 'FarmaGerci Matriz',
        estoque_atual INTEGER NOT NULL DEFAULT 0,
        estoque_minimo INTEGER NOT NULL DEFAULT 10,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Banco PostgreSQL conectado!');
  } catch (erro) {
    console.error('Erro no banco:', erro.message);
  }
}
iniciarBanco();

app.get('/api/medicamentos', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT * FROM medicamentos
      ORDER BY CASE WHEN estoque_atual = 0 THEN 1 WHEN estoque_atual <= estoque_minimo THEN 2 ELSE 3 END, nome ASC
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.post('/api/medicamentos', async (req, res) => {
  const { nome, principio_ativo, dosagem, unidade_saude, estoque_atual, estoque_minimo } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO medicamentos (nome, principio_ativo, dosagem, unidade_saude, estoque_atual, estoque_minimo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nome, principio_ativo, dosagem, unidade_saude || 'FarmaGerci Matriz', Number(estoque_atual), Number(estoque_minimo)]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.patch('/api/medicamentos/:id/estoque', async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE medicamentos SET estoque_atual = GREATEST(0, estoque_atual + $1), atualizado_em = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [Number(req.body.quantidade), req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.delete('/api/medicamentos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM medicamentos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('FarmaGerci rodando na porta ' + PORT));
