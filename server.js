require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post('/api/medicamentos', async (req, res) => {
  const { nome, principio_ativo, dosagem, unidade_saude, estoque_atual, estoque_minimo } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO medicamentos (nome, principio_ativo, dosagem, unidade_saude, estoque_atual, estoque_minimo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nome, principio_ativo, dosagem, unidade_saude || 'FarmaGerci Matriz', Number(estoque_atual), Number(estoque_minimo)]
    );
    res.status(201).json(r.rows);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.patch('/api/medicamentos/:id/estoque', async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE medicamentos SET estoque_atual = GREATEST(0, estoque_atual + $1), atualizado_em = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [Number(req.body.quantidade), req.params.id]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.delete('/api/medicamentos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM medicamentos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

const HTML_SITE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FarmaGerci | Controle Inteligente de Ruptura e Falta</title>
  <link href="https://googleapis.com" rel="stylesheet">
  <style>
    :root {
      --roxo-900: #2e1065;
      --roxo-800: #4c1d95;
      --roxo-700: #6d28d9;
      --roxo-600: #7c3aed;
      --roxo-100: #ede9fe;
      --roxo-50: #f5f3ff;
      --fundo: #f4f3f8;
      --texto: #1e1b4b;
      --cinza: #64748b;
      --borda: #e2e8f0;
      --vermelho: #e11d48;
      --vermelho-bg: #ffe4e6;
      --amarelo: #d97706;
      --amarelo-bg: #fef3c7;
      --verde: #059669;
      --verde-bg: #d1fae5;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: var(--fundo); color: var(--texto); min-height: 100vh; display: flex; flex-direction: column; }
    
    /* Topo */
    .topbar { background: var(--roxo-900); color: #ddd6fe; font-size: 12px; padding: 8px 24px; display: flex; justify-content: space-between; align-items: center; }
    .header { background: linear-gradient(135deg, var(--roxo-800), var(--roxo-600)); color: #fff; padding: 18px 24px; box-shadow: 0 4px 20px rgba(76, 29, 149, 0.25); position: sticky; top: 0; z-index: 30; }
    .header-inner { max-width: 1240px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon { width: 44px; height: 44px; background: #fff; color: var(--roxo-700); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 800; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .brand h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .brand span { color: #ddd6fe; font-weight: 600; }
    .brand p { font-size: 11px; color: #e9d5ff; }

    /* Busca Central */
    .search-box { flex: 1; min-width: 260px; max-width: 520px; position: relative; }
    .search-box input { width: 100%; padding: 13px 46px 13px 20px; border-radius: 999px; border: none; font-size: 14px; font-weight: 500; outline: none; box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
    .search-box input:focus { box-shadow: 0 0 0 4px rgba(196, 181, 253, 0.45); }
    .search-btn { position: absolute; right: 6px; top: 5px; width: 34px; height: 34px; border-radius: 50%; background: var(--roxo-700); color: #fff; border: none; display: flex; align-items: center; justify-content: center; }

    .header-actions { display: flex; gap: 10px; }
    .btn { cursor: pointer; border: none; border-radius: 999px; font-weight: 700; font-size: 13px; padding: 11px 20px; transition: 0.2s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-white { background: #fff; color: var(--roxo-800); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .btn-white:hover { background: var(--roxo-50); transform: translateY(-1px); }
    .btn-ghost { background: rgba(255,255,255,0.14); color: #fff; border: 1px solid rgba(255,255,255,0.25); }
    .btn-ghost:hover { background: rgba(255,255,255,0.24); }
    .btn-roxo { background: var(--roxo-700); color: #fff; }
    .btn-roxo:hover { background: var(--roxo-800); }

    /* Container Principal */
    .container { max-width: 1240px; width: 100%; margin: 28px auto; padding: 0 24px; flex: 1; }

    /* Banner Alerta */
    .alert-banner { background: linear-gradient(90deg, #be123c, #e11d48); color: #fff; border-radius: 18px; padding: 16px 24px; margin-bottom: 24px; display: none; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 8px 20px rgba(225, 29, 72, 0.22); }
    .alert-banner.show { display: flex; }

    /* Cards de Métricas */
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .metric-card { background: #fff; border-radius: 20px; padding: 20px; border: 2px solid transparent; box-shadow: 0 4px 15px rgba(30, 27, 75, 0.04); cursor: pointer; transition: 0.2s; text-align: left; }
    .metric-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(109, 40, 217, 0.12); }
    .metric-card.active { border-color: var(--roxo-600); background: var(--roxo-50); }
    .metric-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--cinza); }
    .metric-val { font-size: 34px; font-weight: 800; margin: 6px 0 4px; }
    .metric-sub { font-size: 12px; color: var(--cinza); }

    /* Filtros */
    .toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
    .pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .pill { padding: 8px 16px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid var(--borda); background: #fff; color: var(--cinza); cursor: pointer; transition: 0.2s; }
    .pill.active { background: var(--roxo-700); color: #fff; border-color: var(--roxo-700); }

    /* Vitrine de Produtos */
    .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 20px; }
    .prod-card { background: #fff; border-radius: 22px; padding: 20px; border: 1px solid var(--borda); box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between; transition: 0.22s; }
    .prod-card:hover { transform: translateY(-4px); box-shadow: 0 14px 28px rgba(109, 40, 217, 0.14); border-color: #c4b5fd; }
    .prod-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .badge { padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .badge-falta { background: var(--vermelho-bg); color: var(--vermelho); }
    .badge-critico { background: var(--amarelo-bg); color: var(--amarelo); }
    .badge-normal { background: var(--verde-bg); color: var(--verde); }
    .icon-actions button { background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 15px; padding: 4px 6px; border-radius: 8px; }
    .icon-actions button:hover { background: var(--roxo-50); color: var(--roxo-700); }

    .prod-box { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
    .rx-badge { width: 48px; height: 48px; border-radius: 14px; background: var(--roxo-100); color: var(--roxo-700); font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .prod-title { font-size: 17px; font-weight: 800; color: var(--texto); line-height: 1.25; }
    .prod-dose { display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; margin-top: 4px; }

    .prod-info { background: #f8fafc; border-radius: 14px; padding: 12px; font-size: 12px; color: #475569; margin-bottom: 14px; }
    .prod-info p { margin-bottom: 4px; }
    .prod-info p:last-child { margin-bottom: 0; }

    .stock-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 6px; }
