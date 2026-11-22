var lista = new Array();
var filtroAtivo = 'TODOS';

function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}

function norm(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function detectarForma(texto) {
  var l = norm(texto);
  if (l.indexOf('xarope') !== -1 || l.indexOf('xpe') !== -1) return 'Xarope';
  if (l.indexOf('gotas') !== -1 || l.indexOf('gts') !== -1) return 'Gotas';
  if (l.indexOf('suspensao') !== -1 || l.indexOf('susp') !== -1) return 'Suspensão Oral';
  if (l.indexOf('pomada') !== -1 || l.indexOf('creme') !== -1 || l.indexOf('gel') !== -1) return 'Pomada/Creme';
  if (l.indexOf('spray') !== -1 || l.indexOf('nasal') !== -1) return 'Spray';
  if (l.indexOf('injetavel') !== -1 || l.indexOf('ampola') !== -1) return 'Injetável';
  if (l.indexOf('capsula') !== -1 || l.indexOf('caps') !== -1) return 'Cápsula';
  if (l.indexOf('comprimido') !== -1 || l.indexOf('comp') !== -1) return 'Comprimido';
  return '';
}

function classificarRemedio(texto) {
  var limpo = norm(texto);
  if (!limpo) return null;
  var forma = detectarForma(texto);

  for (var idx = 0; idx < lista.length; idx++) {
    var itemSalvo = lista[idx];
    if (norm(itemSalvo.nome) === limpo && itemSalvo.principio_ativo && norm(itemSalvo.principio_ativo) !== limpo) {
      var uS = norm(itemSalvo.unidade_saude);
      var tS = uS.indexOf('generico') !== -1 ? 'Genérico' : (uS.indexOf('original') !== -1 ? 'Original' : 'Similar');
      return { principio: itemSalvo.principio_ativo, tipo: tS, forma: forma };
    }
  }

  var orig = window.ORIGINAIS || {};
  var sim = window.SIMILARES || {};
  var gen = window.GENERICOS || {};

  for (var o in orig) {
    if (limpo.indexOf(o) !== -1) return { principio: orig[o], tipo: 'Original', forma: forma };
  }
  for (var s in sim) {
    if (limpo.indexOf(s) !== -1) return { principio: sim[s], tipo: 'Similar', forma: forma };
  }
  for (var g in gen) {
    if (limpo.indexOf(g) !== -1) return { principio: gen[g], tipo: 'Genérico', forma: forma };
  }
  var cap = texto.trim();
  return { principio: cap.charAt(0).toUpperCase() + cap.slice(1), tipo: 'Similar', forma: forma };
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
  busca.placeholder = 'Buscar medicamento, substância, xarope, genérico...';
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
    { k: 'FALTA', t: 'Lista: Em Falta' },
    { k: 'GENERICO', t: 'Genéricos (G)' },
    { k: 'SIMILAR', t: 'Similares (S)' },
    { k: 'ORIGINAL', t: 'Originais (Rx)' },
    { k: 'XAROPE', t: 'Xaropes / Líquidos' }
  ].forEach(function(p) {
    var pb = el('button', 'pill' + (p.k === 'TODOS' ? ' active' : ''), p.t);
    pb.setAttribute('data-filtro', p.k);
    pb.onclick = function() { filtrar(p.k); };
    pills.appendChild(pb);
  });
  bar.appendChild(pills);

  var bCop = el('button', 'pill', 'Copiar Lista WhatsApp');
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
  lb1.appendChild(el('span', '', 'Medicamento (ex: Trazodona 50mg, Trimebutina) *'));
  var bTipo = el('span', '', '');
  bTipo.id = 'badge-tipo';
  bTipo.style.color = '#6d28d9';
  lb1.appendChild(bTipo);
  fg1.appendChild(lb1);

  var iNome = el('input');
  iNome.id = 'nome';
  iNome.autocomplete = 'off';
  iNome.required = true;
  iNome.placeholder = 'Nome, forma (xarope, gotas) e dosagem opcional...';
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
  fg3.appendChild(el('label', '', 'Dosagem / Forma (Opcional)'));
  var iDose = el('input');
  iDose.id = 'dosagem';
  fg3.appendChild(iDose);
  row1.appendChild(fg2);
  row1.appendChild(fg3);
  form.appendChild(row1);

  var rowTipo = el('div', 'frow');
  var fgTipo = el('div', 'fg');
  fgTipo.appendChild(el('label', '', 'Lista / Categoria'));
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
  var doseExtraida = '';

  for (var i = 0; i < partes.length; i++) {
    var p = partes[i].toLowerCase();
    if (p.indexOf('mg') > 0 || p.indexOf('ml') > 0 || p.indexOf('mcg') > 0 || p.indexOf('ui') > 0 || (p.length > 1 && p.endsWith('g') && !isNaN(p))) {
      doseExtraida = partes[i];
      semDose = txt.replace(partes[i], '').trim();
    }
  }

  var res = classificarRemedio(semDose);
  if (res) {
    document.getElementById('principio').value = res.principio;
    document.getElementById('tipo_med').value = res.tipo;
    document.getElementById('dosagem').value = [doseExtraida, res.forma].filter(Boolean).join(' • ');
    document.getElementById('badge-tipo').textContent = '✓ ' + res.tipo + (res.forma ? ' (' + res.forma + ')' : '');
  } else {
    document.getElementById('principio').value = '';
    document.getElementById('tipo_med').value = '';
    document.getElementById('dosagem').value = doseExtraida;
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

function tipoDe(m) {
  var auto = classificarRemedio(m.nome);
  if (auto && (auto.tipo === 'Original' || auto.tipo === 'Genérico')) {
    return auto.tipo;
  }
  var uNorm = norm(m.unidade_saude);
  if (uNorm.indexOf('generico') !== -1) return 'Genérico';
  if (uNorm.indexOf('original') !== -1) return 'Original';
  return auto ? auto.tipo : 'Similar';
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

function obterFiltrados() {
  var q = norm(document.getElementById('busca').value);
  return lista.filter(function(m) {
    var tipo = norm(tipoDe(m));
    var forma = norm((m.dosagem || '') + ' ' + (m.nome || ''));
    var bateBusca = norm(m.nome).indexOf(q) !== -1 || norm(m.principio_ativo).indexOf(q) !== -1 || tipo.indexOf(q) !== -1 || forma.indexOf(q) !== -1;
    if (!bateBusca) return false;
    if (filtroAtivo === 'TODOS') return true;
    if (filtroAtivo === 'FALTA' || filtroAtivo === 'CRITICO' || filtroAtivo === 'NORMAL') return statusDe(m) === filtroAtivo;
    if (filtroAtivo === 'GENERICO') return tipo === 'generico';
    if (filtroAtivo === 'SIMILAR') return tipo === 'similar';
    if (filtroAtivo === 'ORIGINAL') return tipo === 'original';
    if (filtroAtivo === 'XAROPE') return forma.indexOf('xarope') !== -1 || forma.indexOf('gotas') !== -1 || forma.indexOf('suspensao') !== -1 || forma.indexOf('ml') !== -1;
    return true;
  });
}

function renderizar() {
  var filtrados = obterFiltrados();
  var box = document.getElementById('vitrine');
  box.innerHTML = '';

  if (filtrados.length === 0) {
    var emp = el('div', 'empty');
    emp.appendChild(el('h3', '', 'Nenhum medicamento nesta lista'));
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
    var tipoDetectado = tipoDe(m);
    var sigla = tipoDetectado === 'Genérico' ? 'G' : (tipoDetectado === 'Similar' ? 'S' : 'Rx');

    cmain.appendChild(el('div', 'rx', sigla));
    var tb = el('div');
    tb.appendChild(el('div', 'ctitle', m.nome));
    if (m.dosagem) tb.appendChild(el('span', 'cdose', m.dosagem));
    cmain.appendChild(tb);
    card.appendChild(cmain);

    var ci = el('div', 'cinfo');
    var subst = (m.principio_ativo && norm(m.principio_ativo) !== norm(m.nome))
      ? m.principio_ativo
      : (autoInfo ? autoInfo.principio : m.nome);
    ci.appendChild(el('div', '', 'Substância: ' + subst));
    ci.appendChild(el('div', '', 'Lista: ' + tipoDetectado + ' • ' + (m.unidade_saude || 'FarmaGerci Matriz').split('•').trim()));
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
  document.getElementById('unidade').value = partesUni.trim();
  document.getElementById('tipo_med').value = partesUni ? partesUni.trim() : '';
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
  var auto = classificarRemedio(nomeLimpo);
  var subst = document.getElementById('principio').value.trim() || (auto ? auto.principio : nomeLimpo);
  var tipo = document.getElementById('tipo_med').value.trim() || (auto ? auto.tipo : 'Similar');
  var uni = document.getElementById('unidade').value.trim() || 'FarmaGerci Matriz';

  nomeLimpo = nomeLimpo.charAt(0).toUpperCase() + nomeLimpo.slice(1);

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
  var itens = obterFiltrados();
    if (!itens.length) { avisar('Nenhum item nesta lista para copiar!'); return; }
  var txt = '*LISTA FARMAGERCI (' + filtroAtivo + ')*\n\n' + itens.map(function(m) {
    return '- ' + m.nome + (m.dosagem ? ' [' + m.dosagem + ']' : '') + ' — ' + (m.principio_ativo || m.nome) + ' (' + tipoDe(m) + ')';
  }).join('\n');
  navigator.clipboard.writeText(txt);
  avisar('Lista copiada para o WhatsApp!');
}

montarTela();
carregar();
