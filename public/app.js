var lista = new Array();
var filtroAtivo = 'TODOS';

var ORIGINAIS = {
  donaren: 'Cloridrato de Trazodona', novalgina: 'Dipirona Monoidratada',
  tylenol: 'Paracetamol', advil: 'Ibuprofeno', amoxil: 'Amoxicilina Tri-hidratada',
  clavulin: 'Amoxicilina + Clavulanato', astro: 'Azitromicina Di-hidratada',
  keflex: 'Cefalexina', cipro: 'Cloridrato de Ciprofloxacino',
  flagyl: 'Metronidazol', cozaar: 'Losartana Potássica',
  renitec: 'Maleato de Enalapril', capoten: 'Captopril',
  lasix: 'Furosemida', selozok: 'Succinato de Metoprolol',
  concor: 'Hemifumarato de Bisoprolol', norvasc: 'Besilato de Anlodipino',
  zocor: 'Sinvastatina', lipitor: 'Atorvastatina Cálcica',
  crestor: 'Rosuvastatina Cálcica', glifage: 'Cloridrato de Metformina',
  daonil: 'Glibenclamida', amaryl: 'Glimepirida', galvus: 'Vildagliptina',
  januvia: 'Fosfato de Sitagliptina', forxiga: 'Dapagliflozina',
  jardiance: 'Empagliflozina', ozempic: 'Semaglutida',
  losec: 'Omeprazol', pantozol: 'Pantoprazol Sódico',
  nexium: 'Esomeprazol Magnésio', claritin: 'Loratadina',
  desalex: 'Desloratadina', allegra: 'Cloridrato de Fexofenadina',
  polaramine: 'Maleato de Dexclorfeniramina', meticorten: 'Prednisona',
  prelone: 'Prednisolona', decadron: 'Dexametasona',
  rivotril: 'Clonazepam', valium: 'Diazepam', frontal: 'Alprazolam',
  lexotan: 'Bromazepam', lorax: 'Lorazepam', stilnox: 'Zolpidem',
  zoloft: 'Cloridrato de Sertralina', prozac: 'Cloridrato de Fluoxetina',
  lexapro: 'Oxalato de Escitalopram', cipramil: 'Bromidrato de Citalopram',
  pondera: 'Cloridrato de Paroxetina', tryptanol: 'Cloridrato de Amitriptilina',
  efexor: 'Cloridrato de Venlafaxina', pristiq: 'Desvenlafaxina',
  cymbalta: 'Cloridrato de Duloxetina', wellbutrin: 'Cloridrato de Bupropiona',
  seroquel: 'Hemifumarato de Quetiapina', risperdal: 'Risperidona',
  zyprexa: 'Olanzapina', haldol: 'Haloperidol', tegretol: 'Carbamazepina',
  gardenal: 'Fenobarbital', depakene: 'Valproato de Sódio',
  puran: 'Levotiroxina Sódica', euthyrox: 'Levotiroxina Sódica',
  aerolin: 'Sulfato de Salbutamol', buscopan: 'Escopolamina',
  dramin: 'Dimenidrinato', plasil: 'Metoclopramida',
  vonau: 'Ondansetrona', cataflam: 'Diclofenaco Potássico',
  voltaren: 'Diclofenaco Sódico', celebra: 'Celecoxibe',
  arcoxia: 'Etoricoxibe', luftal: 'Simeticona', imosec: 'Loperamida',
  viagra: 'Citrato de Sildenafila', cialis: 'Tadalafila',
  xarelto: 'Rivaroxabana', eliquis: 'Apixabana', plavix: 'Clopidogrel'
};

var SIMILARES = {
  aradois: 'Losartana Potássica', anador: 'Dipirona Monoidratada',
  alivium: 'Ibuprofeno', busprofem: 'Ibuprofeno', nisulid: 'Nimesulida',
  scaflam: 'Nimesulida', neosaldina: 'Dipirona + Isometepteno + Cafeína',
  dorflex: 'Dipirona + Orfenadrina + Cafeína', torsilax: 'Cafeína + Carisoprodol + Diclofenaco + Paracetamol',
  tandrilax: 'Cafeína + Carisoprodol + Diclofenaco + Paracetamol',
  miosan: 'Ciclobenzaprina', cimegripe: 'Paracetamol + Clorfeniramina + Fenilefrina',
  benegrip: 'Dipirona + Clorfeniramina + Cafeína', resfenol: 'Paracetamol + Clorfeniramina + Fenilefrina',
  histamin: 'Maleato de Dexclorfeniramina', hixizine: 'Cloridrato de Hidroxizina',
  daforin: 'Cloridrato de Fluoxetina', exodus: 'Oxalato de Escitalopram',
  zetron: 'Cloridrato de Bupropiona', bup: 'Cloridrato de Bupropiona',
  velija: 'Cloridrato de Duloxetina', patz: 'Hemitartarato de Zolpidem',
  levoid: 'Levotiroxina Sódica', busonid: 'Budesonida',
  fluimucil: 'Acetilcisteína', bisolvon: 'Cloridrato de Bromexina',
  nebacetin: 'Sulfato de Neomicina + Bacitracina', bepantol: 'Dexpantenol',
  enterogermina: 'Bacillus clausii', repoflor: 'Saccharomyces boulardii',
  addera: 'Colecalciferol (Vitamina D3)', noripurum: 'Ferripolimaltose',
  endofolin: 'Ácido Fólico', somalgin: 'Ácido Acetilsalicílico'
};

var GENERICOS = [
  'trazodona', 'dipirona', 'paracetamol', 'ibuprofeno', 'amoxicilina',
  'azitromicina', 'cefalexina', 'ciprofloxacino', 'levofloxacino', 'metronidazol',
  'sulfametoxazol', 'fluconazol', 'itraconazol', 'cetoconazol', 'aciclovir',
  'ivermectina', 'albendazol', 'losartana', 'enalapril', 'captopril',
  'ramipril', 'valsartana', 'olmesartana', 'telmisartana', 'hidroclorotiazida',
  'clortalidona', 'indapamida', 'furosemida', 'espironolactona', 'atenolol',
  'propranolol', 'metoprolol', 'carvedilol', 'bisoprolol', 'nebivolol',
  'anlodipino', 'sinvastatina', 'atorvastatina', 'rosuvastatina', 'ezetimiba',
  'metformina', 'glibenclamida', 'glimepirida', 'gliclazida', 'dapagliflozina',
  'empagliflozina', 'sitagliptina', 'vildagliptina', 'insulina', 'omeprazol',
  'pantoprazol', 'esomeprazol', 'lansoprazol', 'domperidona', 'bromoprida',
  'metoclopramida', 'ondansetrona', 'simeticona', 'loperamida', 'loratadina',
  'desloratadina', 'fexofenadina', 'cetirizina', 'levocetirizina', 'dexclorfeniramina',
  'hidroxizina', 'prometazina', 'prednisona', 'prednisolona', 'dexametasona',
  'betametasona', 'budesonida', 'clonazepam', 'diazepam', 'alprazolam',
  'bromazepam', 'lorazepam', 'zolpidem', 'sertralina', 'fluoxetina',
  'escitalopram', 'citalopram', 'paroxetina', 'amitriptilina', 'nortriptilina',
  'venlafaxina', 'desvenlafaxina', 'duloxetina', 'bupropiona', 'mirtazapina',
  'quetiapina', 'risperidona', 'olanzapina', 'aripiprazol', 'haloperidol',
  'litio', 'carbamazepina', 'oxcarbazepina', 'fenobarbital', 'valproato',
  'lamotrigina', 'topiramato', 'gabapentina', 'pregabalina', 'levotiroxina',
  'salbutamol', 'montelucaste', 'acetilcisteina', 'ambroxol', 'bromexina',
  'escopolamina', 'dimenidrinato', 'nimesulida', 'diclofenaco', 'meloxicam',
  'piroxicam', 'cetoprofeno', 'naproxeno', 'celecoxibe', 'etoricoxibe',
  'tramadol', 'codeina', 'ciclobenzaprina', 'alopurinol', 'colchicina',
  'sildenafila', 'tadalafila', 'finasterida', 'tansulosina', 'doxazosina',
  'varfarina', 'rivaroxabana', 'apixabana', 'clopidogrel', 'acido folico',
  'sulfato ferroso', 'colecalciferol', 'cianocobalamina'
];

function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}

function norm(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function classificarRemedio(texto) {
  var limpo = norm(texto);
  if (!limpo) return null;
  for (var o in ORIGINAIS) {
    if (limpo.indexOf(o) !== -1) return { principio: ORIGINAIS[o], tipo: 'Original' };
  }
  for (var s in SIMILARES) {
    if (limpo.indexOf(s) !== -1) return { principio: SIMILARES[s], tipo: 'Similar' };
  }
  for (var i = 0; i < GENERICOS.length; i++) {
    var g = GENERICOS[i];
    if (limpo.indexOf(g) !== -1) {
      return { principio: g.charAt(0).toUpperCase() + g.slice(1), tipo: 'Genérico' };
    }
  }
  var cap = texto.trim();
  return { principio: cap.charAt(0).toUpperCase() + cap.slice(1), tipo: 'Similar' };
}
function montarTela() {
  var root = document.getElementById('app');
  root.innerHTML = '';

  var toast = el('div', 'toast', 'Salvo!');
  toast.id = 'toast';
  root.appendChild(toast);

  var top = el('div', 'top');
  top.appendChild(el('span', '', 'Controle de Falta & Reposição • FarmaGerci'));
  var stDb = el('span', '', '● Conectando...');
  stDb.id = 'status-db';
  top.appendChild(stDb);
  root.appendChild(top);

  var hdr = el('header', 'hdr');
  var hdrIn = el('div', 'hdr-in');
  var logo = el('div', 'logo');
  logo.appendChild(el('div', 'logo-box', '+'));
  var ltxt = el('div');
  ltxt.appendChild(el('h1', '', 'FarmaGerci'));
  ltxt.appendChild(el('p', '', 'Gestão Inteligente de Falta de Medicamentos'));
  logo.appendChild(ltxt);
  hdrIn.appendChild(logo);

  var search = el('div', 'search');
  var busca = el('input');
  busca.id = 'busca';
  busca.autocomplete = 'off';
  busca.placeholder = 'Buscar medicamento, substância, genérico ou similar...';
  busca.oninput = renderizar;
  search.appendChild(busca);
  hdrIn.appendChild(search);

  var bNovo = el('button', 'btn btn-w', '+ Registrar Falta / Item');
  bNovo.onclick = abrirModalNovo;
  hdrIn.appendChild(bNovo);
  hdr.appendChild(hdrIn);
  root.appendChild(hdr);

  var main = el('main', 'wrap');
  var metrics = el('section', 'metrics');
  [
    { k: 'TODOS', t: 'Total Cadastrado', id: 'm-total', c: '#1e1b4b' },
    { k: 'FALTA', t: 'Em Falta (Zero)', id: 'm-falta', c: '#e11d48' },
    { k: 'CRITICO', t: 'Estoque Baixo', id: 'm-critico', c: '#d97706' },
    { k: 'NORMAL', t: 'Disponíveis', id: 'm-normal', c: '#059669' }
  ].forEach(function(d) {
    var mc = el('button', 'mcard' + (d.k === 'TODOS' ? ' active' : ''));
    mc.setAttribute('data-filtro', d.k);
    mc.appendChild(el('small', '', d.t));
    var h2 = el('h2', '', '0');
    h2.id = d.id;
    h2.style.color = d.c;
    mc.appendChild(h2);
    mc.onclick = function() { filtrar(d.k); };
    metrics.appendChild(mc);
  });
  main.appendChild(metrics);

  var bar = el('div', 'bar');
  var pills = el('div', 'pills');
  [
    { k: 'TODOS', t: 'Todos' },
    { k: 'FALTA', t: 'Em Falta' },
    { k: 'CRITICO', t: 'Nível Crítico' },
    { k: 'NORMAL', t: 'Disponíveis' }
  ].forEach(function(p) {
    var pb = el('button', 'pill' + (p.k === 'TODOS' ? ' active' : ''), p.t);
    pb.setAttribute('data-filtro', p.k);
    pb.onclick = function() { filtrar(p.k); };
    pills.appendChild(pb);
  });
  bar.appendChild(pills);

  var bCop = el('button', 'pill', 'Copiar Pedido WhatsApp');
  bCop.onclick = copiarPedido;
  bar.appendChild(bCop);
  main.appendChild(bar);

  var vitrine = el('section', 'grid');
  vitrine.id = 'vitrine';
  main.appendChild(vitrine);
  root.appendChild(main);

  var mBg = el('div', 'modal-bg');
  mBg.id = 'modal';
  var modal = el('div', 'modal');
  var mhead = el('div', 'mhead');
  var mTit = el('strong', '', 'Registrar Medicamento');
  mTit.id = 'modal-titulo';
  var mX = el('button', '', '×');
  mX.style.cssText = 'background:none;border:none;color:#fff;font-size:24px;cursor:pointer';
  mX.onclick = fecharModal;
  mhead.appendChild(mTit);
  mhead.appendChild(mX);
  modal.appendChild(mhead);

  var form = el('form', 'mbody');
  form.id = 'form';
  form.onsubmit = salvarFormulario;

  var hid = el('input');
  hid.type = 'hidden';
  hid.id = 'edit-id';
  form.appendChild(hid);

  var fg1 = el('div', 'fg');
  var lb1 = el('label');
  lb1.appendChild(el('span', '', 'Nome do Medicamento (dosagem opcional) *'));
  var bTipo = el('span', '', '');
  bTipo.id = 'badge-tipo';
  bTipo.style.color = '#6d28d9';
  lb1.appendChild(bTipo);
  fg1.appendChild(lb1);

  var iNome = el('input');
  iNome.id = 'nome';
  iNome.autocomplete = 'off';
  iNome.required = true;
  iNome.placeholder = 'Ex: Trazodona 50mg, Donaren ou Aradois';
  iNome.oninput = reconhecer;
  fg1.appendChild(iNome);
  form.appendChild(fg1);

  var row1 = el('div', 'frow');
  var fg2 = el('div', 'fg');
  fg2.appendChild(el('label', '', 'Substância / Princípio Ativo'));
  var iPrinc = el('input');
  iPrinc.id = 'principio';
  fg2.appendChild(iPrinc);

  var fg3 = el('div', 'fg');
  fg3.appendChild(el('label', '', 'Dosagem (Opcional)'));
  var iDose = el('input');
  iDose.id = 'dosagem';
  iDose.placeholder = 'Ex: 50mg';
  fg3.appendChild(iDose);
  row1.appendChild(fg2);
  row1.appendChild(fg3);
  form.appendChild(row1);

  var rowTipo = el('div', 'frow');
  var fgTipo = el('div', 'fg');
  fgTipo.appendChild(el('label', '', 'Tipo (Genérico / Similar / Original)'));
  var iTipo = el('input');
  iTipo.id = 'tipo_med';
  fgTipo.appendChild(iTipo);

  var fg4 = el('div', 'fg');
  fg4.appendChild(el('label', '', 'Unidade / Filial'));
  var iUni = el('input');
  iUni.id = 'unidade';
  iUni.value = 'FarmaGerci Matriz';
  fg4.appendChild(iUni);
  rowTipo.appendChild(fgTipo);
  rowTipo.appendChild(fg4);
  form.appendChild(rowTipo);

  var row2 = el('div', 'frow');
  var fg5 = el('div', 'fg');
  fg5.appendChild(el('label', '', 'Estoque Atual *'));
  var iAt = el('input');
  iAt.type = 'number';
  iAt.id = 'atual';
  iAt.value = '0';
  iAt.required = true;
  fg5.appendChild(iAt);

  var fg6 = el('div', 'fg');
  fg6.appendChild(el('label', '', 'Estoque Mínimo *'));
  var iMin = el('input');
  iMin.type = 'number';
  iMin.id = 'minimo';
  iMin.value = '10';
  iMin.required = true;
  fg6.appendChild(iMin);
  row2.appendChild(fg5);
  row2.appendChild(fg6);
  form.appendChild(row2);

  var mfoot = el('div', 'mfoot');
  var bCanc = el('button', 'pill', 'Cancelar');
  bCanc.type = 'button';
  bCanc.onclick = fecharModal;
  var bSalv = el('button', 'btn btn-p', 'Salvar na FarmaGerci');
  bSalv.type = 'submit';
  mfoot.appendChild(bCanc);
  mfoot.appendChild(bSalv);
  form.appendChild(mfoot);

  modal.appendChild(form);
  mBg.appendChild(modal);
  root.appendChild(mBg);
}
function reconhecer() {
  var txt = document.getElementById('nome').value;
  var partes = txt.split(' ');
  var semDose = txt;
  var achouDose = false;

  for (var i = 0; i < partes.length; i++) {
    var p = partes[i].toLowerCase();
    if (p.indexOf('mg') > 0 || p.indexOf('ml') > 0 || p.indexOf('mcg') > 0 || p.indexOf('ui') > 0 || (p.length > 1 && p.endsWith('g') && !isNaN(p[0]))) {
      document.getElementById('dosagem').value = partes[i];
      semDose = txt.replace(partes[i], '').trim();
      achouDose = true;
    }
  }
  if (!achouDose) document.getElementById('dosagem').value = '';

  var res = classificarRemedio(semDose);
  if (res) {
    document.getElementById('principio').value = res.principio;
    document.getElementById('tipo_med').value = res.tipo;
    document.getElementById('badge-tipo').textContent = '✓ ' + res.tipo;
  } else {
    document.getElementById('principio').value = '';
    document.getElementById('tipo_med').value = '';
    document.getElementById('badge-tipo').textContent = '';
  }
}

function avisar(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function statusDe(x) {
  if (Number(x.estoque_atual) === 0) return 'FALTA';
  if (Number(x.estoque_atual) <= Number(x.estoque_minimo)) return 'CRITICO';
  return 'NORMAL';
}

async function carregar() {
  try {
    var res = await fetch('/api/medicamentos');
    lista = await res.json();
    document.getElementById('status-db').textContent = '● Sistema Online';
    var f = 0, c = 0, n = 0;
    lista.forEach(function(x) {
      var s = statusDe(x);
      if (s === 'FALTA') f++; else if (s === 'CRITICO') c++; else n++;
    });
    document.getElementById('m-total').textContent = lista.length;
    document.getElementById('m-falta').textContent = f;
    document.getElementById('m-critico').textContent = c;
    document.getElementById('m-normal').textContent = n;
    renderizar();
  } catch (e) {
    document.getElementById('status-db').textContent = '● Erro de conexão';
  }
}

function filtrar(st) {
  filtroAtivo = st;
  document.querySelectorAll('[data-filtro]').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-filtro') === st);
  });
  renderizar();
}

function renderizar() {
  var q = norm(document.getElementById('busca').value);
  var filtrados = lista.filter(function(m) {
    var t = norm(m.nome).indexOf(q) !== -1 || norm(m.principio_ativo).indexOf(q) !== -1 || norm(m.unidade_saude).indexOf(q) !== -1;
    return t && (filtroAtivo === 'TODOS' || statusDe(m) === filtroAtivo);
  });

  var box = document.getElementById('vitrine');
  box.innerHTML = '';

  if (filtrados.length === 0) {
    var emp = el('div', 'empty');
    emp.appendChild(el('h3', '', 'Nenhum medicamento encontrado'));
    var bAdd = el('button', 'btn btn-p', '+ Registrar Item');
    bAdd.style.marginTop = '12px';
    bAdd.onclick = abrirModalNovo;
    emp.appendChild(bAdd);
    box.appendChild(emp);
    return;
  }

  filtrados.forEach(function(m) {
    var st = statusDe(m);
    var atual = Number(m.estoque_atual), min = Number(m.estoque_minimo) || 1;
    var pct = Math.min(100, Math.round((atual / (min * 2)) * 100));
    var bCls = st === 'FALTA' ? 'bf' : (st === 'CRITICO' ? 'bc' : 'bn');
    var bTxt = st === 'FALTA' ? 'Em Falta' : (st === 'CRITICO' ? 'Estoque Baixo' : 'Disponível');
    var cor = st === 'FALTA' ? '#e11d48' : (st === 'CRITICO' ? '#d97706' : '#7c3aed');

    var card = el('div', 'card');
    var ctop = el('div', 'ctop');
    ctop.appendChild(el('span', 'bdg ' + bCls, bTxt));
    var cact = el('div', 'cact');
    var bEd = el('button', '', 'Editar');
    bEd.onclick = function() { editar(m.id); };
    var bEx = el('button', '', 'Excluir');
    bEx.onclick = function() { remover(m.id); };
    cact.appendChild(bEd);
    cact.appendChild(bEx);
    ctop.appendChild(cact);
    card.appendChild(ctop);

    var cmain = el('div', 'cmain');
    var autoInfo = classificarRemedio(m.nome);
    var uNorm = norm(m.unidade_saude);
    var tipoDetectado = uNorm.indexOf('generico') !== -1 ? 'Genérico' : (uNorm.indexOf('similar') !== -1 ? 'Similar' : (uNorm.indexOf('original') !== -1 ? 'Original' : (autoInfo ? autoInfo.tipo : 'Original')));
    var sigla = tipoDetectado === 'Genérico' ? 'G' : (tipoDetectado === 'Similar' ? 'S' : 'Rx');

    cmain.appendChild(el('div', 'rx', sigla));
    var tb = el('div');
    tb.appendChild(el('div', 'ctitle', m.nome));
    if (m.dosagem) tb.appendChild(el('span', 'cdose', m.dosagem));
    cmain.appendChild(tb);
    card.appendChild(cmain);

    var ci = el('div', 'cinfo');
    var subst = m.principio_ativo || (autoInfo ? autoInfo.principio : m.nome);
    ci.appendChild(el('div', '', 'Substância: ' + subst));
    ci.appendChild(el('div', '', 'Tipo: ' + tipoDetectado + ' • ' + m.unidade_saude.split('•')[0].trim()));
    card.appendChild(ci);

    var sr = el('div', 'strow');
    sr.appendChild(el('span', '', 'Estoque: ' + atual + ' un.'));
    sr.appendChild(el('span', '', 'Mín: ' + min));
    card.appendChild(sr);

    var pbg = el('div', 'pbg');
    var pf = el('div', 'pfill');
    pf.style.width = pct + '%';
    pf.style.background = cor;
    pbg.appendChild(pf);
    card.appendChild(pbg);

    var qb = el('div', 'qbtns');
    var q1 = el('button', 'qbtn', '-1');
    q1.onclick = function() { mover(m.id, -1); };
    var q2 = el('button', 'qbtn', '+1');
    q2.onclick = function() { mover(m.id, 1); };
    var q3 = el('button', 'qbtn qplus', '+10 un.');
    q3.onclick = function() { mover(m.id, 10); };
    qb.appendChild(q1);
    qb.appendChild(q2);
    qb.appendChild(q3);
    card.appendChild(qb);

    box.appendChild(card);
  });
}

async function mover(id, qtd) {
  await fetch('/api/medicamentos/' + id + '/estoque', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantidade: qtd })
  });
  avisar('Estoque atualizado!');
  carregar();
}

async function remover(id) {
  if (!confirm('Remover item?')) return;
  await fetch('/api/medicamentos/' + id, { method: 'DELETE' });
  avisar('Removido.');
  carregar();
}

function abrirModalNovo() {
  document.getElementById('edit-id').value = '';
  document.getElementById('modal-titulo').textContent = 'Registrar Medicamento / Falta';
  document.getElementById('badge-tipo').textContent = '';
  document.getElementById('form').reset();
  document.getElementById('unidade').value = 'FarmaGerci Matriz';
  document.getElementById('atual').value = 0;
  document.getElementById('minimo').value = 10;
  document.getElementById('modal').classList.add('open');
}

function editar(id) {
  var m = lista.find(function(x) { return x.id === id; });
  if (!m) return;
  document.getElementById('edit-id').value = m.id;
  document.getElementById('modal-titulo').textContent = 'Editar Medicamento';
  document.getElementById('nome').value = m.nome;
  document.getElementById('principio').value = m.principio_ativo || '';
  document.getElementById('dosagem').value = m.dosagem || '';
  var partesUni = (m.unidade_saude || 'FarmaGerci Matriz').split('•');
  document.getElementById('unidade').value = partesUni[0].trim();
  document.getElementById('tipo_med').value = partesUni[1] ? partesUni[1].trim() : '';
  document.getElementById('atual').value = m.estoque_atual;
  document.getElementById('minimo').value = m.estoque_minimo;
  reconhecer();
  document.getElementById('modal').classList.add('open');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('open');
}

async function salvarFormulario(e) {
  e.preventDefault();
  var id = document.getElementById('edit-id').value;
  var nomeLimpo = document.getElementById('nome').value.trim();
  var doseLimpa = document.getElementById('dosagem').value.trim();
  if (doseLimpa && nomeLimpo.toLowerCase().endsWith(doseLimpa.toLowerCase())) {
    nomeLimpo = nomeLimpo.slice(0, -doseLimpa.length).trim();
  }
  nomeLimpo = nomeLimpo.charAt(0).toUpperCase() + nomeLimpo.slice(1);

  var auto = classificarRemedio(nomeLimpo);
  var subst = document.getElementById('principio').value.trim() || (auto ? auto.principio : nomeLimpo);
  var tipo = document.getElementById('tipo_med').value.trim() || (auto ? auto.tipo : 'Similar');
  var uni = document.getElementById('unidade').value.trim() || 'FarmaGerci Matriz';

  var dados = {
    nome: nomeLimpo,
    principio_ativo: subst,
    dosagem: doseLimpa,
    unidade_saude: uni + ' • ' + tipo,
    estoque_atual: Number(document.getElementById('atual').value),
    estoque_minimo: Number(document.getElementById('minimo').value)
  };
  if (id) await fetch('/api/medicamentos/' + id, { method: 'DELETE' });
  await fetch('/api/medicamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  fecharModal();
  avisar('Salvo na FarmaGerci!');
  carregar();
}

function copiarPedido() {
  var faltas = lista.filter(function(m) { return statusDe(m) !== 'NORMAL'; });
  if (!faltas.length) { avisar('Nenhum item em falta!'); return; }
  var txt = '*PEDIDO FARMAGERCI*\n' + faltas.map(function(m) {
    return '- ' + m.nome + (m.dosagem ? ' ' + m.dosagem : '') + ' (' + (m.principio_ativo || m.nome) + ') [' + m.unidade_saude + ']';
  }).join('\n');
  navigator.clipboard.writeText(txt);
  avisar('Copiado para o WhatsApp!');
}

montarTela();
carregar();
