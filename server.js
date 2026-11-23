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
    res.json(r.rows);
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

// Consulta Universal: Base Brasileira (Bulario/ANVISA) + Base Farmacológica Internacional
app.get('/api/consultar-farmaco', async (req, res) => {
  const termo = (req.query.q || '').trim();
  if (termo.length < 2) return res.json({ principio: '', tipo: '', dosagens: [] });

  let principio = '';
  let tipo = '';
  const dosagens = new Set();

  // 1. Consulta Base Oficial Brasileira (Bulario Eletrônico / ANVISA)
  try {
    const rBr = await fetch(`https://vercel.app{encodeURIComponent(termo)}&pagina=1`);
    if (rBr.ok) {
      const dBr = await rBr.json();
      const itens = (dBr && dBr.content) || [];
      if (itens.length > 0) {
        const primeiro = itens;
        if (primeiro.principioAtivo) {
          principio = primeiro.principioAtivo;
        }
        const cat = (primeiro.categoriaRegulatoria || '').toLowerCase();
        if (cat.includes('generico') || cat.includes('genérico')) tipo = 'Genérico';
        else if (cat.includes('novo') || cat.includes('referencia') || cat.includes('referência') || cat.includes('biologico')) tipo = 'Original';
        else if (cat.includes('similar')) tipo = 'Similar';

        // Busca detalhes do registro para extrair todas as miligramas/apresentações cadastradas na ANVISA
        if (primeiro.numProcesso) {
          const rDet = await fetch(`https://vercel.app{primeiro.numProcesso}`);
          if (rDet.ok) {
            const det = await rDet.json();
            if (det.principioAtivo && !principio) principio = det.principioAtivo;
            const apres = det.apresentacoes || [];
            apres.forEach(ap => {
              const txtAp = ap.apresentacao || '';
              const m = txtAp.match(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|unt)(\s*\+\s*\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui))?(\/ml|\/5ml|\/g)?\b/gi);
              if (m) m.forEach(x => dosagens.add(x.toUpperCase()));
            });
          }
        }
      }
    }
  } catch (e) {}

  // 2. Complemento Internacional (RxNorm) caso não retorne nada da base BR
  if (!principio || dosagens.size === 0) {
    try {
      const rRx = await fetch(`https://nih.gov{encodeURIComponent(termo)}&maxEntries=5`);
      const dRx = await rRx.json();
      const cands = (dRx && dRx.approximateGroup && dRx.approximateGroup.candidate) || [];
      for (const c of cands) {
        if (c.rxcui) {
          const rProps = await fetch(`https://nih.gov{c.rxcui}/properties.json`);
          const dProps = await rProps.json();
          const nomeOficial = dProps && dProps.properties && dProps.properties.name;
          if (nomeOficial && !principio) principio = nomeOficial;
          const matches = (nomeOficial || '').match(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|unt)(\/ml|\/5ml)?\b/gi);
          if (matches) matches.forEach(m => dosagens.add(m.toLowerCase()));
        }
      }
    } catch (e) {}
  }

  res.json({
    principio: principio || '',
    tipo: tipo || '',
    dosagens: Array.from(dosagens)
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('FarmaGerci rodando na porta ' + PORT));
