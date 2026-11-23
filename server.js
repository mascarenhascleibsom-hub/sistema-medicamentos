const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pngRoxo = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64'
);
app.get(['/icon-192.png', '/icon-512.png'], (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.send(pngRoxo);
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

let baseAnvisa = new Array();

function normTxt(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function colAt(arr, idx) {
  return (arr[idx] || '').replace(/"/g, '').trim();
}

function formatarApresentacao(apres) {
  if (!apres) return '';
  let txt = apres.replace(/\s+/g, ' ').trim();
  txt = txt.replace(/\bCT BL AL PLAS\b/gi, 'Cartela');
  txt = txt.replace(/\bCT STR AL\b/gi, 'Cartela');
  txt = txt.replace(/\bCT FR PLAS\b/gi, 'Frasco');
  txt = txt.replace(/\bCT BG AL\b/gi, 'Bisnaga');
  txt = txt.replace(/\bCOM REV\b/gi, 'Comp. Rev.');
  txt = txt.replace(/\bCOM\b/gi, 'Comp.');
  txt = txt.replace(/\bSOL OR\b/gi, 'Sol. Oral');
  txt = txt.replace(/\bSUSP OR\b/gi, 'Susp. Oral');
  txt = txt.replace(/\bX\s*(\d+)\b/gi, 'Caixa c/ $1');
  return txt.slice(0, 52);
}

function carregarCatalogoLocalAnvisa() {
  const arquivosCsv = fs.readdirSync(__dirname).filter(f => f.toLowerCase().endsWith('.csv'));
  if (arquivosCsv.length === 0) {
    console.log('Nenhum arquivo .csv encontrado na raiz.');
    return;
  }
  const nomeArq = arquivosCsv.shift();
  const arq = path.join(__dirname, nomeArq);
  console.log('Lendo planilha oficial:', nomeArq);

  try {
    const buffer = fs.readFileSync(arq);
    const textoUtf = new TextDecoder('utf-8').decode(buffer);
    const texto = textoUtf.includes('\uFFFD') || textoUtf.includes('Ã')
      ? new TextDecoder('latin1').decode(buffer)
      : textoUtf;
    const linhas = texto.split(/\r?\n/);
    if (linhas.length < 2) return;

    const primeiraLinha = linhas.slice(0, 1).shift() || '';
    const cab = primeiraLinha.split(';').map(c => normTxt(c.replace(/"/g, '')));
    const idxSub = cab.findIndex(c => c === 'substancia' || c.includes('principio'));
    const idxProd = cab.findIndex(c => c === 'produto' || c.includes('nome_produto'));
    const idxApres = cab.findIndex(c => c === 'apresentacao');
    const idxTipo = cab.findIndex(c => c.includes('tipo de produto') || c.includes('categoria'));

    const colSub = idxSub >= 0 ? idxSub : 0;
    const colProd = idxProd >= 0 ? idxProd : 8;
    const colApres = idxApres >= 0 ? idxApres : 9;
    const colTipo = idxTipo >= 0 ? idxTipo : 11;

    const mapa = new Map();

    for (let i = 1; i < linhas.length; i++) {
      const cols = linhas[i].split(';');
      if (cols.length <= Math.max(colProd, colSub)) continue;

      let principio = colAt(cols, colSub).replace(/\s*;\s*/g, ' + ');
      const nomeProd = colAt(cols, colProd);
      const apres = colAt(cols, colApres);
      const catReg = colAt(cols, colTipo);

      if (!nomeProd && !principio) continue;
      const nomeFinal = nomeProd || principio;

      let tipo = 'Similar';
      const cNorm = normTxt(catReg);
      if (cNorm.includes('generico')) tipo = 'Genérico';
      else if (cNorm.includes('novo') || cNorm.includes('referencia') || cNorm.includes('biologico') || cNorm.includes('especifico')) tipo = 'Original';

      const chave = normTxt(nomeFinal);
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          nome: nomeFinal,
          nomeNorm: chave,
          principio: principio || nomeFinal,
          principioNorm: normTxt(principio || nomeFinal),
          tipo,
          dosagens: new Set()
        });
      } else if (principio && principio.length > mapa.get(chave).principio.length) {
        mapa.get(chave).principio = principio;
        mapa.get(chave).principioNorm = normTxt(principio);
      }

      if (apres) {
        const formatada = formatarApresentacao(apres);
        if (formatada) mapa.get(chave).dosagens.add(formatada);
      }
    }

    baseAnvisa = Array.from(mapa.values()).map(item => ({
      nome: item.nome,
      nomeNorm: item.nomeNorm,
      principio: item.principio,
      principioNorm: item.principioNorm,
      tipo: item.tipo,
      dosagens: Array.from(item.dosagens)
    }));
    console.log('Base CMED/ANVISA indexada com sucesso: ' + baseAnvisa.length + ' medicamentos!');
  } catch (e) {
    console.error('Erro ao ler CSV:', e.message);
  }
}

carregarCatalogoLocalAnvisa();

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
    res.json(r.rows.shift());
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
    res.json(r.rows.shift());
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

app.get('/api/consultar-farmaco', (req, res) => {
  const termo = normTxt(req.query.q || '');
  if (termo.length < 2 || baseAnvisa.length === 0) {
    return res.json({ principio: '', tipo: '', dosagens: new Array(), sugestoes: new Array() });
  }

  const palavras = termo.split(/\s+/).filter(Boolean);
  const exato = baseAnvisa.find(m => m.nomeNorm === termo || m.principioNorm === termo);
  const comecaCom = baseAnvisa.filter(m => m.nomeNorm.startsWith(termo) || m.principioNorm.startsWith(termo));
  const contemTodas = baseAnvisa.filter(m =>
    !m.nomeNorm.startsWith(termo) &&
    !m.principioNorm.startsWith(termo) &&
    palavras.every(p => m.nomeNorm.includes(p) || m.principioNorm.includes(p))
  );

  const combinados = comecaCom.concat(contemTodas).slice(0, 20);
  const escolhido = exato || combinados.slice(0, 1).shift();

  res.json({
    principio: escolhido ? escolhido.principio : '',
    tipo: escolhido ? escolhido.tipo : '',
    dosagens: escolhido ? escolhido.dosagens : new Array(),
    sugestoes: combinados.map(p => ({ nome: p.nome, principio: p.principio, tipo: p.tipo }))
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('FarmaGerci rodando na porta ' + PORT));
