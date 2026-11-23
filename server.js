const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicamentos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        principio_ativo VARCHAR(255),
        dosagem VARCHAR(100),
        unidade_saude VARCHAR(255),
        estoque_atual INTEGER DEFAULT 0,
        estoque_minimo INTEGER DEFAULT 10,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Banco PostgreSQL conectado!');
  } catch (err) {
    console.error('Erro no banco:', err.message);
  }
}
initDb();

app.get('/api/medicamentos', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM medicamentos ORDER BY id DESC');
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post('/api/medicamentos', async (req, res) => {
  const { nome, principio_ativo, dosagem, unidade_saude, estoque_atual, estoque_minimo } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO medicamentos (nome, principio_ativo, dosagem, unidade_saude, estoque_atual, estoque_minimo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [nome, principio_ativo || nome, dosagem || '', unidade_saude || 'FarmaGerci Matriz', Number(estoque_atual) || 0, Number(estoque_minimo) || 10]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.patch('/api/medicamentos/:id/estoque', async (req, res) => {
  const { quantidade } = req.body;
  try {
    const r = await pool.query(
      'UPDATE medicamentos SET estoque_atual = GREATEST(0, estoque_atual + $1) WHERE id = $2 RETURNING *',
      [Number(quantidade), req.params.id]
    );
    res.json(r.rows[0]);
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

app.get('/api/consultar-farmaco', async (req, res) => {
  const termo = (req.query.q || '').trim();
  if (termo.length < 2) return res.json({ principio: '', dosagens: [] });

  try {
    const rRx = await fetch(`https://nih.gov{encodeURIComponent(termo)}&maxEntries=5`);
    const dRx = await rRx.json();
    const cands = (dRx && dRx.approximateGroup && dRx.approximateGroup.candidate) || [];
    
    let principio = '';
    const dosagens = new Set();

    for (const c of cands) {
      if (c.rxcui) {
        const rProps = await fetch(`https://nih.gov{c.rxcui}/properties.json`);
        const dProps = await rProps.json();
        const nomeOficial = dProps && dProps.properties && dProps.properties.name;
        if (nomeOficial && !principio) {
          principio = nomeOficial;
        }
        const matches = (nomeOficial || '').match(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|unt)(\/ml|\/5ml)?\b/gi);
        if (matches) matches.forEach(m => dosagens.add(m.toLowerCase()));
      }
    }

    res.json({
      principio: principio || '',
      dosagens: Array.from(dosagens)
    });
  } catch (err) {
    res.json({ principio: '', dosagens: [] });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('FarmaGerci rodando na porta ' + PORT));
