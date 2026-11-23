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

// Base em memória com todos os medicamentos oficiais da ANVISA (A-Z)
let baseAnvisa = [];

function normTxt(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

async function carregarBaseAnvisa() {
  try {
    console.log('Sincronizando catálogo completo da ANVISA...');
    const url = 'https://anvisa.gov.br';
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const buffer = await resp.arrayBuffer();
    const texto = new TextDecoder('latin1').decode(buffer);
    const linhas = texto.split(/\r?\n/);

    const mapa = new Map();
    for (let i = 1; i < linhas.length; i++) {
      const cols = linhas[i].split(';');
      if (cols.length < 11) continue;
      const nomeProd = (cols[1] || '').replace(/"/g, '').trim();
      const catReg = (cols[5] || '').replace(/"/g, '').trim();
      const situacao = (cols[9] || '').replace(/"/g, '').trim().toUpperCase();
      const principio = (cols[10] || '').replace(/"/g, '').trim();

      if (!nomeProd || situacao !== 'ATIVO') continue;

      let tipo = 'Similar';
      const cNorm = normTxt(catReg);
      if (cNorm.includes('generico')) tipo = 'Genérico';
      else if (cNorm.includes('novo') || cNorm.includes('referencia') || cNorm.includes('biologico') || cNorm.includes('especifico')) tipo = 'Original';

      const chave = normTxt(nomeProd);
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          nome: nomeProd,
          nomeNorm: chave,
          principio: principio || nomeProd,
          principioNorm: normTxt(principio),
          tipo
        });
      }
    }
    baseAnvisa = Array.from(mapa.values());
    console.log('Catálogo ANVISA carregado: ' + baseAnvisa.length + ' medicamentos ativos!');
  } catch (e) {
    console.error('Aviso ao baixar CSV ANVISA:', e.message);
  }
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
carregarBaseAnvisa();

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

// Consulta Universal nos +25.000 medicamentos ativos da ANVISA + Bulário + RxNorm
app.get('/api/consultar-farmaco', async (req, res) => {
  const termo = normTxt(req.query.q || '');
  if (termo.length < 2) return res.json({ principio: '', tipo: '', dosagens: [], sugestoes: [] });

  let principio = '';
  let tipo = '';
  const dosagens = new Set();
  const sugestoes = [];

  // 1. Busca instantânea no catálogo oficial completo da ANVISA carregado em memória
  if (baseAnvisa.length > 0) {
    const exato = baseAnvisa.find(m => m.nomeNorm === termo);
    const parecidos = baseAnvisa.filter(m => m.nomeNorm.startsWith(termo) || m.principioNorm.startsWith(termo)).slice(0, 15);
    const escolhido = exato || parecidos[0];

    if (escolhido) {
      principio = escolhido.principio;
      tipo = escolhido.tipo;
    }
    parecidos.forEach(p => {
      sugestoes.push({ nome: p.nome, principio: p.principio, tipo: p.tipo });
    });
  }

  // 2. Busca miligramas e apresentações no Bulário Eletrônico
  try {
    const rBr = await fetch(`https://vercel.app{encodeURIComponent(termo)}&pagina=1`);
    if (rBr.ok) {
      const dBr = await rBr.json();
      const itens = (dBr && dBr.content) || [];
      if (itens.length > 0) {
        const primeiro = itens[0];
        if (!principio && primeiro.principioAtivo) principio = primeiro.principioAtivo;
        if (!tipo) {
          const cat = normTxt(primeiro.categoriaRegulatoria);
          if (cat.includes('generico')) tipo = 'Genérico';
          else if (cat.includes('novo') || cat.includes('referencia') || cat.includes('biologico')) tipo = 'Original';
          else if (cat.includes('similar')) tipo = 'Similar';
        }
        if (primeiro.numProcesso) {
          const rDet = await fetch(`https://vercel.app{primeiro.numProcesso}`);
          if (rDet.ok) {
            const det = await rDet.json();
            (det.apresentacoes || []).forEach(ap => {
              const m = (ap.apresentacao || '').match(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|unt)(\s*\+\s*\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui))?(\/ml|\/5ml|\/g)?\b/gi);
              if (m) m.forEach(x => dosagens.add(x.toUpperCase()));
            });
          }
        }
      }
    }
  } catch (e) {}

  res.json({
    principio: principio || '',
    tipo: tipo || '',
    dosagens: Array.from(dosagens),
    sugestoes
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('FarmaGerci rodando na porta ' + PORT));
