var lista = new Array();
var filtroAtivo = 'TODOS';
var timerRede = null;

var FARMACOS = {
  'trazodona': 'Cloridrato de Trazodona', 'donaren': 'Cloridrato de Trazodona',
  'dipirona': 'Dipirona Monoidratada', 'novalgina': 'Dipirona Monoidratada',
  'paracetamol': 'Paracetamol', 'tylenol': 'Paracetamol',
  'ibuprofeno': 'Ibuprofeno', 'advil': 'Ibuprofeno', 'alivium': 'Ibuprofeno',
  'amoxicilina': 'Amoxicilina Tri-hidratada', 'azitromicina': 'Azitromicina Di-hidratada',
  'cefalexina': 'Cefalexina Monoidratada', 'losartana': 'Losartana Potássica',
  'enalapril': 'Maleato de Enalapril', 'captopril': 'Captopril',
  'hidroclorotiazida': 'Hidroclorotiazida', 'atenolol': 'Atenolol',
  'anlodipino': 'Besilato de Anlodipino', 'sinvastatina': 'Sinvastatina',
  'atorvastatina': 'Atorvastatina Cálcica', 'rosuvastatina': 'Rosuvastatina Cálcica',
  'metformina': 'Cloridrato de Metformina', 'glifage': 'Cloridrato de Metformina',
  'omeprazol': 'Omeprazol', 'pantoprazol': 'Pantoprazol Sódico',
  'loratadina': 'Loratadina', 'prednisona': 'Prednisona', 'dexametasona': 'Dexametasona',
  'clonazepam': 'Clonazepam', 'rivotril': 'Clonazepam', 'diazepam': 'Diazepam',
  'alprazolam': 'Alprazolam', 'sertralina': 'Cloridrato de Sertralina',
  'fluoxetina': 'Cloridrato de Fluoxetina', 'escitalopram': 'Oxalato de Escitalopram',
  'amitriptilina': 'Cloridrato de Amitriptilina', 'venlafaxina': 'Cloridrato de Venlafaxina',
  'quetiapina': 'Hemifumarato de Quetiapina', 'risperidona': 'Risperidona',
  'levotiroxina': 'Levotiroxina Sódica', 'puran': 'Levotiroxina Sódica',
  'salbutamol': 'Sulfato de Salbutamol', 'buscopan': 'Butilbrometo de Escopolamina',
  'dramin': 'Dimenidrinato', 'plasil': 'Cloridrato de Metoclopramida',
  'ondansetrona': 'Cloridrato de Ondansetrona', 'nimesulida': 'Nimesulida',
  'diclofenaco': 'Diclofenaco Sódico', 'torsilax': 'Cafeína + Carisoprodol + Diclofenaco + Paracetamol',
  'dorflex': 'Dipirona + Orfenadrina + Cafeína', 'neosaldina': 'Dipirona + Isometepteno + Cafeína'
};

function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined && txt !== null) e.textContent = txt;
  return e;
}

function montarTela() {
  var root = document.getElementById('app');
  root.innerHTML = '';

  var toast = el('div', 'toast', 'Salvo!');
  toast.id = 'toast';
  root.appendChild(toast);

  var top = el('div', 'top');
  var topL = el('span', '', 'Portal de Controle de Falta & Reposição • FarmaGerci');
  var topR = el('span', '', '● Conectando...');
  topR.id = 'status-db';
  top.appendChild(topL);
  top.appendChild(topR);
  root.appendChild(top);

  var hdr = el('header', 'hdr');
  var hdrIn = el('div', 'hdr-in');

  var logo = el('div', 'logo');
  logo.appendChild(el('div', 'logo-box', '+'));
  var logoTxt = el('div');
  logoTxt.appendChild(el('h1', '', 'FarmaGerci'));
  logoTxt.appendChild(el('p', '', 'Gestão Inteligente de Falta de Medicamentos'));
  logo.appendChild(logoTxt);
  hdrIn.appendChild(logo);

  var search = el('div', 'search');
  var inpBusca = el('input');
  inpBusca.type = 'text';
  inpBusca.id = 'busca';
  inpBusca.placeholder = 'Buscar medicamento, princípio ativo ou filial...';
  inpBusca.addEventListener('input', renderizar);
  search.appendChild(inpBusca);
  hdrIn.appendChild(search);

  var acts = el('div');
  acts.style.display = 'flex';
  acts.style.gap = '8px';

  var btnCopiar = el('button', 'btn btn-g', 'Copiar Pedido');
  btnCopiar.type = 'button';
  btnCopiar.addEventListener('click', copiarPedido);

  var btnNovo = el('button', 'btn btn-w', '+ Registrar Falta / Item');
  btnNovo.type = 'button';
  btnNovo.addEventListener('click', abrirModalNovo);

  acts.appendChild(btnCopiar);
  acts.appendChild(btnNovo);
  hdrIn.appendChild(acts);
  hdr.appendChild(hdrIn);
  root.appendChild(hdr);

  var main = el('main', 'wrap');

  var banner = el('div', 'alert');
  banner.id = 'banner';
  var bInfo = el('div');
  bInfo.appendChild(el('strong', '', 'Alerta de Ruptura na FarmaGerci'));
  var bTxt = el('div');
  bTxt.id = 'banner-txt';
  bTxt.style.fontSize = '12px';
  bInfo.appendChild(bTxt);
  banner.appendChild(bInfo);

  var bActs = el('div');
  bActs.style.display = 'flex';
  bActs.style.gap = '8px';
  var bWpp = el('button', 'btn btn-g', 'WhatsApp');
  bWpp.type = 'button';
  bWpp.addEventListener('click', copiarPedido);
  var bVer = el('button', 'btn btn-w', 'Ver Faltas');
  bVer.type = 'button';
  bVer.style.color = '#be123c';
  bVer.addEventListener('click', function() { filtrar('FALTA'); });
  bActs.appendChild(bWpp);
  bActs.appendChild(bVer);
  banner.appendChild(bActs);
  main.appendChild(banner);

  var metrics = el('section', 'metrics');
  var defs = [
    { k: 'TODOS', tit: 'Catálogo Total', id: 'm-total', cor: '#1e1b4b', sub: 'Todos os itens' },
    { k: 'FALTA', tit: 'Em Falta (Zero)', id: 'm-falta', cor: '#e11d48', sub: 'Ruptura no balcão' },
    { k: 'CRITICO', tit: 'Estoque Baixo', id: 'm-critico', cor: '#d97706', sub: 'Abaixo do mínimo' },
    { k: 'NORMAL', tit: 'Disponíveis', id: 'm-normal', cor: '#059669', sub: 'Estoque regular' }
  ];
  defs.forEach(function(d) {
    var mc = el('button', 'mcard' + (d.k === 'TODOS' ? ' active' : ''));
    mc.type = 'button';
    mc.setAttribute('data-filtro', d.k);
    var sm = el('small', '', d.tit);
    if (d.k !== 'TODOS') sm.style.color = d.cor;
    var h2 = el('h2', '', '0');
    h2.id = d.id;
    h2.style.color = d.cor;
    var sp = el('span', '', d.sub);
    sp.style.fontSize = '12px';
    sp.style.color = '#64748b';
    mc.appendChild(sm);
    mc.appendChild(h2);
    mc.appendChild(sp);
    mc.addEventListener('click', function() { filtrar(d.k); });
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
    pb.type = 'button';
    pb.setAttribute('data-filtro', p.k);
    pb.addEventListener('click', function() { filtrar(p.k); });
    pills.appendChild(pb);
  });
  bar.appendChild(pills);

  var btnCsv = el('button', 'pill', 'Exportar Planilha CSV');
  btnCsv.type = 'button';
  btnCsv.addEventListener('click', exportarCSV);
  bar.appendChild(btnCsv);
  main.appendChild(bar);

  var vitrine = el('section', 'grid');
  vitrine.id = 'vitrine';
  main.appendChild(vitrine);
  root.appendChild(main);

  // Modal
  var modalBg = el('div', 'modal-bg');
  modalBg.id = 'modal';
  var modal = el('div', 'modal');

  var mhead = el('div', 'mhead');
  var mTit = el('strong', '', 'Registrar Medicamento');
  mTit.id = 'modal-titulo';
  var mClose = el('button', '', '×');
  mClose.type = 'button';
  mClose.style.cssText = 'background:none;border:none;color:#fff;font-size:24px;cursor:pointer';
  mClose.addEventListener('click', fecharModal);
  mhead.appendChild(mTit);
  mhead.appendChild(mClose);
  modal.appendChild(mhead);

  var form = el('form', 'mbody');
  form.id = 'form';
  form.addEventListener('submit', salvarFormulario);

  var hid = el('input');
  hid.type = 'hidden';
  hid.id = 'edit-id';
  form.appendChild(hid);

  var fg1 = el('div', 'fg');
  var lb1 = el('label');
  lb1.appendChild(el('span', '', 'Nome + Dosagem *'));
  var iaSt = el('span', '', '');
  iaSt.id = 'ia-status';
  iaSt.style.color = '#6d28d9';
  lb1.appendChild(iaSt);
  var inpNome = el('input');
  inpNome.type = 'text';
  inpNome.id = 'nome';
  inpNome.required = true;
  inpNome.placeholder = 'Ex: Trazodona 50mg';
  inpNome.addEventListener('input', reconhecer);
  fg1.appendChild(lb1);
  fg1.appendChild(inpNome);
  form.appendChild(fg1);

  var frow1 = el('div', 'frow');
  var fg2 = el('div', 'fg');
  fg2.appendChild(el('label', '', 'Princípio Ativo (Auto)'));
  var inpPrinc = el('input');
  inpPrinc.type = 'text';
  inpPrinc.id = 'principio';
  inpPrinc.placeholder = 'Preenchido sozinho...';
  fg2.appendChild(inpPrinc);

  var fg3 = el('div', 'fg');
  fg3.appendChild(el('label', '', 'Dosagem (Auto)'));
  var inpDose = el('input');
  inpDose.type = 'text';
  inpDose.id = 'dosagem';
  inpDose.placeholder = 'Ex: 50mg';
  fg3.appendChild(inpDose);

  frow1.appendChild(fg2);
  frow1.appendChild(fg3);
  form.appendChild(frow1);

  var fg4 = el('div', 'fg');
  fg4.appendChild(el('label', '', 'Unidade / Filial'));
  var inpUni = el('input');
  inpUni.type = 'text';
  inpUni.id = 'unidade';
  inpUni.value = 'FarmaGerci Matriz';
  fg4.appendChild(inpUni);
  form.appendChild(fg4);

  var frow2 = el('div', 'frow');
  var fg5 = el('div', 'fg');
  fg5.appendChild(el('label', '', 'Estoque Atual *'));
  var inpAt = el('input');
  inpAt.type = 'number';
  inpAt.id = 'atual';
  inpAt.min = '0';
  inpAt.value = '0';
  inpAt.required = true;
  fg5.appendChild(inpAt);

  var fg6 = el('div', 'fg');
  fg6.appendChild(el('label', '', 'Estoque Mínimo *'));
  var inpMin = el('input');
  inpMin.type = 'number';
  inpMin.id = 'minimo';
  inpMin.min = '1';
  inpMin.value = '10';
  inpMin.required = true;
  fg6.appendChild(inpMin);

  frow2.appendChild(fg5);
  frow2.appendChild(fg6);
  form.appendChild(frow2);

  var mfoot = el('div', 'mfoot');
  var btnCanc = el('button', 'pill', 'Cancelar');
  btnCanc.type = 'button';
  btnCanc.addEventListener('click', fecharModal);
  var btnSalv = el('button', 'btn btn-p', 'Salvar na FarmaGerci');
  btnSalv.type = 'submit';
  mfoot.appendChild(btnCanc);
  mfoot.appendChild(btnSalv);
  form.appendChild(mfoot);

  modal.appendChild(form);
  modalBg.appendChild(modal);
  root.appendChild(modalBg);
}

function norm(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function reconhecer() {
  var txt = document.getElementById('nome').value;
  var badge = document.getElementById('ia-status');
