const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

function carregarCatalogoLocalAnvisa() {
  const arq = path.join(__dirname, 'DADOS_ABERTOS_MEDICAMENTOS.csv');
  if (!fs.existsSync(arq)) {
    console.log('Arquivo DADOS_ABERTOS_MEDICAMENTOS.csv não encontrado na raiz.');
    return;
  }
  try {
    const buffer = fs.readFileSync(arq);
    const textoUtf = new TextDecoder('utf-8').decode(buffer);
    const texto = textoUtf.includes('\uFFFD') || textoUtf.includes('Ã')
      ? new TextDecoder('latin1').decode(buffer)
      : textoUtf;
    const linhas = texto.split(/\r?\n/);
    if (linhas.length < 2) return;

    // Detecta automaticamente o índice das colunas pelo cabeçalho do CSV da CMED/ANVISA
    const cab = linhas[0].split(';').map(c => normTxt(c.replace(/"/g, '')));
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

      const principio = colAt(cols, colSub);
      const nomeProd = colAt(cols, colProd);
      const apres = colAt(cols, colApres);
      const catReg = colAt(cols, colTipo);

      if (!nomeProd && !principio) continue;
      const nomeFinal = nomeProd || principio;

      let tipo = 'Similar';
      const cNorm = normTxt(catReg);
      if (cNorm.includes('generico')) tipo = 'Genérico';
      else if (cNorm.includes('novo') || cNorm.includes('referencia') || cNorm.includes('biologico') || cNorm.includes('especifico')) tipo = 'Original';

      const chave = normTxt(nomeFinal) + '|' + normTxt(principio);
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          nome: nomeFinal,
          nomeNorm: normTxt(nomeFinal),
          principio: principio || nomeFinal,
          principioNorm: normTxt(principio || nomeFinal),
          tipo,
          dosagens: new Set()
        });
      }

      if (apres) {
        // Extrai dosagens (ex: 50 MG, 100.000 UI/G + 200 MG/G, 250 MG/5ML)
        const matches = apres.match(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|unt)(\/[a-z0-9]+)?(\s*\+\s*\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|unt)(\/[a-z0-9]+)?)?/gi);
        if (matches) {
          matches.forEach(m => mapa.get(chave).dosagens.add(m.toUpperCase()));
        } else {
          // Se não achou número isolado, guarda a apresentação resumida
          mapa.get(chave).dosagens.add(apres.slice(0, 35));
        }
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

app.get('/api/consultar-farmaco', (req, res) => {
  const termo = normTxt(req.query.q || '');
  if (termo.length < 2 || baseAnvisa.length === 0) {
    return res.json({ principio: '', tipo: '', dosagens: new Array(), sugestoes: new Array() });
  }

  // Busca por correspondência exata primeiro, depois início da palavra, depois qualquer parte (includes)
  const exato = baseAnvisa.find(m => m.nomeNorm === termo || m.principioNorm === termo);
  const comecaCom = baseAnvisa.filter(m => m.nomeNorm.startsWith(termo) || m.principioNorm.startsWith(termo));
  const contem = baseAnvisa.filter(m => !m.nomeNorm.startsWith(termo) && !m.principioNorm.startsWith(termo) && (m.nomeNorm.includes(termo) || m.principioNorm.includes(termo)));

  const combinados = comecaCom.concat(contem).slice(0, 20);
  const escolhido = exato || combinados[0];

  // Reúne todas as dosagens disponíveis para o medicamento escolhido
  const todasDosagens = new Set();
  if (escolhido) {
    baseAnvisa
      .filter(m => m.nomeNorm === escolhido.nomeNorm)
      .forEach(m => m.dosagens.forEach(d => todasDosagens.add(d)));
  }

  res.json({
    principio: escolhido ? escolhido.principio : '',
    tipo: escolhido ? escolhido.tipo : '',
    dosagens: Array.from(todasDosagens),
    sugestoes: combinados.map(p => ({ nome: p.nome, principio: p.principio, tipo: p.tipo }))
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('FarmaGerci rodando na porta ' + PORT));
