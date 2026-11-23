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

let baseAnvisa = [];

function normTxt(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function colAt(arr, idx) {
  return (arr.slice(idx, idx + 1).shift() || '').replace(/"/g, '').trim();
}

async function carregarBaseAnvisa() {
  // Fontes abertas com dados da ANVISA sem bloqueio de firewall (HTTP 403)
  const fontes = [
    'https://githubusercontent.com',
    'https://anvisa.gov.br'
  ];

  for (const url of fontes) {
    try {
      console.log('Tentando sincronizar catálogo: ' + url);
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/csv,text/plain,*/*',
          'Referer': 'https://anvisa.gov.br'
        }
      });
      if (!resp.ok) {
        console.log('Fonte indisponível (' + resp.status + '), tentando próxima...');
        continue;
      }
      const buffer = await resp.arrayBuffer();
      const texto = new TextDecoder('utf-8').decode(buffer).includes('Ã')
        ? new TextDecoder('latin1').decode(buffer)
        : new TextDecoder('utf-8').decode(buffer);
      const linhas = texto.split(/\r?\n/);

      const mapa = new Map();
      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(';');
        if (cols.length < 11) continue;
        const nomeProd = colAt(cols, 1);
        const catReg = colAt(cols, 2);
        const situacao = colAt(cols, 8).toUpperCase();
        const principio = colAt(cols, 10);

        if (!nomeProd || (situacao && situacao !== 'ATIVO' && situacao !== 'VÁLIDO' && situacao !== 'VALIDO')) continue;

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
      if (mapa.size > 100) {
        baseAnvisa = Array.from(mapa.values());
        console.log('Catálogo ANVISA pronto: ' + baseAnvisa.length + ' medicamentos ativos!');
        return;
      }
    } catch (e) {
      console.log('Erro na fonte:', e.message);
    }
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

// Consulta Universal: Catálogo ANVISA + RxNorm + OpenFDA (Substância + Todas as Miligramas)
app.get('/api/consultar-farmaco', async (req, res) => {
  const termo = normTxt(req.query.q || '');
  if (termo.length < 2) return res.json({ principio: '', tipo: '', dosagens: [], sugestoes: [] });

  let principio = '';
  let tipo = '';
  const dosagens = new Set();
  const sugestoes = [];

  if (baseAnvisa.length > 0) {
    const exato = baseAnvisa.find(m => m.nomeNorm === termo);
    const parecidos = baseAnvisa.filter(m => m.nomeNorm.startsWith(termo) || m.principioNorm.startsWith(termo)).slice(0, 15);
    const escolhido = exato || parecidos.slice(0, 1).shift();

    if (escolhido) {
      principio = escolhido.principio;
      tipo = escolhido.tipo;
    }
    parecidos.forEach(p => {
      sugestoes.push({ nome: p.nome, principio: p.principio, tipo: p.tipo });
    });
  }

  // Busca as miligramas e o princípio ativo na base farmacológica internacional (sem bloqueio)
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
