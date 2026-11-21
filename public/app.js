var lista = new Array();
var filtroAtivo = 'TODOS';
var timerRede = null;

var FARMACOS = {
  'trazodona':'Cloridrato de Trazodona','donaren':'Cloridrato de Trazodona',
  'dipirona':'Dipirona Monoidratada','novalgina':'Dipirona Monoidratada',
  'paracetamol':'Paracetamol','tylenol':'Paracetamol',
  'ibuprofeno':'Ibuprofeno','advil':'Ibuprofeno','alivium':'Ibuprofeno',
  'amoxicilina':'Amoxicilina Tri-hidratada','azitromicina':'Azitromicina Di-hidratada',
  'cefalexina':'Cefalexina Monoidratada','losartana':'Losartana Potássica',
  'enalapril':'Maleato de Enalapril','captopril':'Captopril',
  'hidroclorotiazida':'Hidroclorotiazida','atenolol':'Atenolol',
  'anlodipino':'Besilato de Anlodipino','sinvastatina':'Sinvastatina',
  'atorvastatina':'Atorvastatina Cálcica','rosuvastatina':'Rosuvastatina Cálcica',
  'metformina':'Cloridrato de Metformina','glifage':'Cloridrato de Metformina',
  'omeprazol':'Omeprazol','pantoprazol':'Pantoprazol Sódico',
  'loratadina':'Loratadina','prednisona':'Prednisona','dexametasona':'Dexametasona',
  'clonazepam':'Clonazepam','rivotril':'Clonazepam','diazepam':'Diazepam',
  'alprazolam':'Alprazolam','sertralina':'Cloridrato de Sertralina',
  'fluoxetina':'Cloridrato de Fluoxetina','escitalopram':'Oxalato de Escitalopram',
  'amitriptilina':'Cloridrato de Amitriptilina','venlafaxina':'Cloridrato de Venlafaxina',
  'quetiapina':'Hemifumarato de Quetiapina','risperidona':'Risperidona',
  'levotiroxina':'Levotiroxina Sódica','puran':'Levotiroxina Sódica',
  'salbutamol':'Sulfato de Salbutamol','buscopan':'Butilbrometo de Escopolamina',
  'dramin':'Dimenidrinato','plasil':'Cloridrato de Metoclopramida',
  'ondansetrona':'Cloridrato de Ondansetrona','nimesulida':'Nimesulida',
  'diclofenaco':'Diclofenaco Sódico','torsilax':'Cafeína + Carisoprodol + Diclofenaco + Paracetamol',
  'dorflex':'Dipirona + Orfenadrina + Cafeína','neosaldina':'Dipirona + Isometepteno + Cafeína'
};

function montarTela() {
  var root = document.getElementById('app');
  root.innerHTML = [
    '<div id="toast" class="toast">Salvo!</div>',
    '<div class="top"><span>Portal de Controle de Falta & Reposição • <strong>FarmaGerci</strong></span><span id="status-db">● Conectando...</span></div>',
    '<header class="hdr"><div class="hdr-in">',
    '  <div class="logo"><div class="logo-box">+</div><div><h1>Farma<span style="color:#ddd6fe">Gerci</span></h1><p>Gestão Inteligente de Falta de Medicamentos</p></div></div>',
    '  <div class="search"><input type="text" id="busca" placeholder="Buscar medicamento, princípio ativo ou filial..." /></div>',
    '  <div style="display:flex;gap:8px"><button type="button" id="btn-copiar" class="btn btn-g">Copiar Pedido</button><button type="button" id="btn-novo" class="btn btn-w">+ Registrar Falta / Item</button></div>',
    '</div></header>',
    '<main class="wrap">',
    '  <div id="banner" class="alert"><div><strong>Alerta de Ruptura na FarmaGerci</strong><br><small id="banner-txt"></small></div><div style="display:flex;gap:8px"><button type="button" id="btn-wpp" class="btn btn-g">WhatsApp</button><button type="button" id="btn-ver-faltas" class="btn btn-w" style="color:#be123c">Ver Faltas</button></div></div>',
    '  <section class="metrics">',
    '    <button type="button" class="mcard active" data-filtro="TODOS"><small>Catálogo Total</small><h2 id="m-total">0</h2><span style="font-size:12px;color:#6d28d9;font-weight:600">Todos os itens</span></button>',
    '    <button type="button" class="mcard" data-filtro="FALTA"><small style="color:#e11d48">Em Falta (Zero)</small><h2 id="m-falta" style="color:#e11d48">0</h2><span style="font-size:12px;color:#64748b">Ruptura no balcão</span></button>',
    '    <button type="button" class="mcard" data-filtro="CRITICO"><small style="color:#d97706">Estoque Baixo</small><h2 id="m-critico" style="color:#d97706">0</h2><span style="font-size:12px;color:#64748b">Abaixo do mínimo</span></button>',
    '    <button type="button" class="mcard" data-filtro="NORMAL"><small style="color:#059669">Disponíveis</small><h2 id="m-normal" style="color:#059669">0</h2><span style="font-size:12px;color:#64748b">Estoque regular</span></button>',
    '  </section>',
    '  <div class="bar">',
    '    <div class="pills">',
    '      <button type="button" class="pill active" data-filtro="TODOS">Todos</button>',
    '      <button type="button" class="pill" data-filtro="FALTA">Em Falta</button>',
    '      <button type="button" class="pill" data-filtro="CRITICO">Nível Crítico</button>',
    '      <button type="button" class="pill" data-filtro="NORMAL">Disponíveis</button>',
    '    </div>',
    '    <button type="button" id="btn-csv" class="pill">Exportar Planilha CSV</button>',
    '  </div>',
    '  <section id="vitrine" class="grid"></section>',
    '</main>',
    '<div id="modal" class="modal-bg"><div class="modal">',
    '  <div class="mhead"><strong id="modal-titulo">Registrar Medicamento</strong><button type="button" id="btn-fechar" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer">&times;</button></div>',
    '  <form id="form" class="mbody">',
    '    <input type="hidden" id="edit-id" />',
    '    <div class="fg"><label><span>Nome + Dosagem *</span><span id="ia-status" style="color:#6d28d9"></span></label><input type="text" id="nome" required placeholder="Ex: Trazodona 50mg" /></div>',
    '    <div class="frow">',
    '      <div class="fg"><label>Princípio Ativo (Auto)</label><input type="text" id="principio" placeholder="Preenchido sozinho..." /></div>',
    '      <div class="fg"><label>Dosagem (Auto)</label><input type="text" id="dosagem" placeholder="Ex: 50mg" /></div>',
    '    </div>',
    '    <div class="fg"><label>Unidade / Filial</label><input type="text" id="unidade" value="FarmaGerci Matriz" /></div>',
    '    <div class="frow">',
    '      <div class="fg"><label>Estoque Atual *</label><input type="number" id="atual" min="0" value="0" required /></div>',
    '      <div class="fg"><label>Estoque Mínimo *</label><input type="number" id="minimo" min="1" value="10" required /></div>',
    '    </div>',
    '    <div class="mfoot"><button type="button" id="btn-cancelar" class="pill">Cancelar</button><button type="submit" class="btn btn-p">Salvar na FarmaGerci</button></div>',
    '  </form>',
    '</div></div>'
  ].join('');

  document.getElementById('busca').addEventListener('input', renderizar);
  document.getElementById('btn-novo').addEventListener('click', abrirModalNovo);
  document.getElementById('btn-fechar').addEventListener('click', fecharModal);
  document.getElementById('btn-cancelar').addEventListener('click', fecharModal);
  document.getElementById('btn-copiar').addEventListener('click', copiarPedido);
  document.getElementById('btn-wpp').addEventListener('click', copiarPedido);
  document.getElementById('btn-ver-faltas').addEventListener('click', function() { filtrar('FALTA'); });
  document.getElementById('btn-csv').addEventListener('click', exportarCSV);
  document.getElementById('nome').addEventListener('input', reconhecer);
  document.getElementById('form').addEventListener('submit', salvarFormulario);

  var botoesFiltro = document.querySelectorAll('[data-filtro]');
  for (var i = 0; i < botoesFiltro.length; i++) {
    botoesFiltro[i].addEventListener('click', function() {
      filtrar(this.getAttribute('data-filtro'));
    });
  }
}

function norm(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function reconhecer() {
  var txt = document.getElementById('nome').value;
  var badge = document.getElementById('ia-status');
  var rx = /\b(\d+(?:[.,]\d+)?\s*(?:mg\/ml|mg|mcg|g|ml|ui|%))\b/i;
  var m = txt.match(rx);
  if (m) {
    document.getElementById('dosagem').value = m[1].replace(/\s+/g, '');
  }
  var limpo = norm(txt.replace(rx, ''));
  if (limpo.length < 3) { badge.textContent = ''; return; }

  for (var k in FARMACOS) {
    if (limpo === k || limpo.indexOf(k + ' ') === 0 || limpo.indexOf(k) !== -1) {
      document.getElementById('principio').value = FARMACOS[k];
      badge.textContent = '✓ Identificado';
      return;
    }
  }

  clearTimeout(timerRede);
  badge.textContent = 'Buscando...';
  timerRede = setTimeout(async function() {
    try {
      var r = await fetch('https://nih.gov' + encodeURIComponent(limpo) + '&maxEntries=1');
      var d = await r.json();
      var cands = d && d.approximateGroup && d.approximateGroup.candidate;
      if (cands && cands.length > 0 && cands[0].name) {
        document.getElementById('principio').value = cands[0].name;
        badge.textContent = '✓ Encontrado na rede';
      } else { badge.textContent = ''; }
    } catch (e) { badge.textContent = ''; }
  }, 450);
}

function avisar(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2800);
}

function statusDe(x) {
  if (Number(x.estoque_atual) === 0) return 'FALTA';
  if (Number(x.estoque_atual) <= Number(x.estoque_minimo)) return 'CRITICO';
  return 'NORMAL';
}

async function carregar() {
  try {
    var res = await fetch('/api/medicamentos');
    if (!res.ok) throw new Error();
    lista = await res.json();
    document.getElementById('status-db').textContent = '● Sistema Online';
    atualizarResumo();
    renderizar();
  } catch (e) {
    document.getElementById('status-db').textContent = '● Erro de conexão';
  }
}

function atualizarResumo() {
  var f = 0, c = 0, n = 0;
  for (var i = 0; i < lista.length; i++) {
    var s = statusDe(lista[i]);
    if (s === 'FALTA') f++;
    else if (s === 'CRITICO') c++;
    else n++;
  }
  document.getElementById('m-total').textContent = lista.length;
  document.getElementById('m-falta').textContent = f;
  document.getElementById('m-critico').textContent = c;
  document.getElementById('m-normal').textContent = n;

