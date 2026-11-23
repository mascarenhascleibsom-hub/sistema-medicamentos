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

function normTxt(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

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

// Consulta em Tempo Real: API Oficial ANVISA Consultas + RxNorm + OpenFDA
app.get('/api/consultar-farmaco', async (req, res) => {
  const termo = (req.query.q || '').trim();
  if (termo.length < 2) return res.json({ principio: '', tipo: '', dosagens: [], sugestoes: [] });

  let principio = '';
  let tipo = '';
  const dosagens = new Set();
  const sugestoes = [];

  // 1. Consulta direta na API JSON do Portal de Consultas da ANVISA
  try {
    const urlAnvisa = `https://anvisa.gov.br{encodeURIComponent(termo)}&page=1`;
    const rAnv = await fetch(urlAnvisa, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': 'Guest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    if (rAnv.ok) {
      const dAnv = await rAnv.json();
      const listaBr = (dAnv && dAnv.content) || [];
      if (listaBr.length > 0) {
        const primeiro = listaBr.slice(0, 1).shift();
        if (primeiro.principioAtivo) principio = primeiro.principioAtivo;
        const cat = normTxt(primeiro.categoriaRegulatoria);
        if (cat.includes('generico')) tipo = 'Genérico';
        else if (cat.includes('novo') || cat.includes('referencia') || cat.includes('biologico')) tipo = 'Original';
        else if (cat.includes('similar')) tipo = 'Similar';

        listaBr.forEach(item => {
          let tItem = 'Similar';
          const cI = normTxt(item.categoriaRegulatoria);
          if (cI.includes('generico')) tItem = 'Genérico';
          else if (cI.includes('novo') || cI.includes('referencia') || cI.includes('biologico')) tItem = 'Original';
          sugestoes.push({
            nome: item.nomeProduto,
            principio: item.principioAtivo || item.nomeProduto,
            tipo: tItem
          });
        });

        // Busca apresentações/miligramas oficiais desse medicamento na ANVISA
        if (primeiro.numProcesso) {
          const rMed = await fetch(`https://anvisa.gov.br{primeiro.numProcesso}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Guest',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36'
            }
          });
          if (rMed.ok) {
            const det = await rMed.json();
            const apres = det.apresentacoes || [];
            apres.forEach(ap => {
              const txtAp = ap.apresentacao || '';
              const matches = txtAp.match(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|unt)(\s*\+\s*\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui))?(\/ml|\/5ml|\/g)?\b/gi);
              if (matches) matches.forEach(m => dosagens.add(m.toUpperCase()));
            });
          }
        }
      }
    }
  } catch (e) {}

  // 2. Complemento garantido via RxNorm (sempre responde 200 OK e traz miligramas)
  const termosBusca = [principio, termo].filter(Boolean);
  for (const tBusca of termosBusca) {
    if (dosagens.size > 0 && principio) break;
    try {
      const rRx = await fetch(`https://nih.gov{encodeURIComponent(tBusca)}&maxEntries=15`);
      if (rRx.ok) {
        const dRx = await rRx.json();
        const cands = (dRx && dRx.approximateGroup && dRx.approximateGroup.candidate) || [];
        for (const c of cands.slice(0, 10)) {
          if (c.rxcui) {
            const rProps = await fetch(`https://nih.gov{c.rxcui}/properties.json`);
            if (rProps.ok) {
              const dProps = await rProps.json();
              const nomeOficial = dProps && dProps.properties && dProps.properties.name;
              if (nomeOficial && !principio) {
                principio = nomeOficial.replace(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|unt).*$/i, '').trim();
              }
              const matches = (nomeOficial || '').match(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|unt)(\/ml|\/5ml)?\b/gi);
              if (matches) matches.forEach(m => dosagens.add(m.toLowerCase()));
            }
          }
        }
      }
    } catch (e) {}
  }

  res.json({
    principio: principio || '',
    tipo: tipo || '',
    dosagens: Array.from(dosagens),
    sugestoes
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('FarmaGerci rodando na porta ' + PORT));
