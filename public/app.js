var lista = new Array();
var filtroAtivo = 'TODOS';
var timerOnline = null;

function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
}

function norm(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function ehGenericoPorNome(limpo) {
  var sais = new Array('cloridrato de ', 'maleato de ', 'besilato de ', 'tartarato de ', 'hemitartarato de ', 'oxalato de ', 'bromidrato de ', 'succinato de ', 'sulfato de ', 'fosfato de ', 'citrato de ', 'mesilato de ', 'dipropionato de ', 'valerato de ', 'acetato de ', 'fumarato de ', 'nitrato de ', 'dicloridrato de ', 'bissulfato de ', 'monoidratad', 'tri-hidratad', 'di-hidratad', 'sodica', 'sodico', 'potassica', 'potassico');
  for (var i = 0; i < sais.length; i++) if (limpo.indexOf(sais[i]) !== -1) return true;
  var p = (limpo.split(' ').shift() || '');
  var sufixos = new Array('prazol', 'sartana', 'statina', 'olol', 'pril', 'dipino', 'micina', 'cilina', 'oxacino', 'conazol', 'clovir', 'zepam', 'zolam', 'zepina', 'oxetina', 'tralina', 'lafaxina', 'gliptina', 'flozina', 'glutida', 'triptana', 'tidina', 'filina', 'cisteina', 'cortisona', 'solona', 'metasona', 'budesonida', 'fluticasona', 'mometasona', 'tiazida', 'semida', 'lactona', 'xabana', 'grel', 'parina', 'profeno', 'coxibe', 'xicam', 'fenaco', 'caina', 'paracetamol', 'dipirona', 'ibuprofeno', 'nimesulida', 'amoxicilina', 'azitromicina', 'cefalexina', 'losartana', 'enalapril', 'atenolol', 'sinvastatina', 'atorvastatina', 'rosuvastatina', 'metformina', 'omeprazol', 'pantoprazol', 'loratadina', 'prednisona', 'clonazepam', 'sertralina', 'fluoxetina', 'escitalopram', 'quetiapina', 'risperidona', 'pregabalina', 'levotiroxina');
  for (var j = 0; j < sufixos.length; j++) if (p.length >= 6 && p.endsWith(sufixos[j])) return true;
  return false;
}

function classificarRemedio(texto) {
  var limpo = norm(texto);
  if (!limpo) return null;
  for (var i = 0; i < lista.length; i++) {
    if (norm(lista[i].nome) === limpo && lista[i].principio_ativo) {
      var uS = norm(lista[i].unidade_saude);
      var tS = uS.indexOf('generico') !== -1 ? 'Genérico' : (uS.indexOf('original') !== -1 ? 'Original' : 'Similar');
      return { principio: lista[i].principio_ativo, tipo: tS, conhecido: true };
    }
  }
  var orig = window.ORIGINAIS || {}, sim = window.SIMILARES || {}, gen = window.GENERICOS || {};
  for (var o in orig) if (limpo === o || limpo.indexOf(o + ' ') === 0) return { principio: orig[o], tipo: 'Original', conhecido: true };
  for (var g in gen) if (limpo === g || limpo.indexOf(g + ' ') === 0 || limpo.indexOf(' ' + g) !== -1) return { principio: gen[g], tipo: 'Genérico', conhecido: true };
  for (var s in sim) if (limpo === s || limpo.indexOf(s + ' ') === 0) return { principio: sim[s], tipo: 'Similar', conhecido: true };
  var cap = texto.trim(), capF = cap.charAt(0).toUpperCase() + cap.slice(1);
  if (ehGenericoPorNome(limpo)) return { principio: capF, tipo: 'Genérico', conhecido: true };
  return { principio: capF, tipo: 'Similar', conhecido: false };
}

function soltarEmojisFarmacia(texto) {
  var l = norm(texto || ''), em = new Array('💊', '💊', '🩺');
  if (l.indexOf('insulina') !== -1 || l.indexOf('caneta') !== -1 || l.indexOf('injetavel') !== -1) em = new Array('💉', '💉', '🩺');
  else if (l.indexOf('xarope') !== -1 || l.indexOf('gotas') !== -1 || l.indexOf('ml') !== -1 || l.indexOf('pomada') !== -1 || l.indexOf('creme') !== -1) em = new Array('🧴', '💧', '🧪');
  else if (l === 'boas-vindas') em = new Array('💊', '💉', '🧴', '🩺');
  for (var i = 0; i < 12; i++) {
    (function(idx) {
      setTimeout(function() {
        var sp = el('span', 'emoji-float', em[idx % em.length]);
        sp.style.left = (6 + Math.random() * 88) + 'vw';
        document.body.appendChild(sp);
        setTimeout(function() { sp.remove(); }, 2500);
      }, idx * 95);
    })(i);
  }
}

function selecionarCategoria(cat) {
  var sel = document.getElementById('tipo_med');
  if (sel) sel.value = cat;
  var bdg = document.getElementById('badge-tipo');
  if (bdg) bdg.textContent = '✓ ' + cat;
}

function montarTela() {
  var root = document.getElementById('app');
  root.innerHTML = '';
  var toast = el('div', 'toast', 'Salvo!'); toast.id = 'toast'; root.appendChild(toast);

  var top = el('div', 'top');
  top.appendChild(el('span', '', 'Controle de Falta & Reposição • FarmaGerci'));
  var stDb = el('span', '', '● Conectando...'); stDb.id = 'status-db'; top.appendChild(stDb);
  root.appendChild(top);

  var hdr = el('header', 'hdr'), hdrIn = el('div', 'hdr-in'), logo = el('div', 'logo');
  logo.appendChild(el('div', 'logo-box', '+'));
  var ltxt = el('div'); ltxt.appendChild(el('h1', '', 'FarmaGerci')); ltxt.appendChild(el('p', '', 'Gestão Inteligente de Falta de Medicamentos'));
  logo.appendChild(ltxt); hdrIn.appendChild(logo);

  var search = el('div', 'search'), busca = el('input');
  busca.id = 'busca'; busca.autocomplete = 'off'; busca.placeholder = 'Buscar medicamento, substância, insulina, genérico...'; busca.oninput = renderizar;
  search.appendChild(busca); hdrIn.appendChild(search);

  var bNovo = el('button', 'btn btn-w', '+ Registrar Falta'); bNovo.onclick = abrirModalNovo; hdrIn.appendChild(bNovo);
  hdr.appendChild(hdrIn); root.appendChild(hdr);

  var main = el('main', 'wrap'), hero = el('section', 'hero'), hLeft = el('div');
  hLeft.appendChild(el('span', 'hero-tag', 'SISTEMA FARMACÊUTICO FARMAGERCI • BASE OFICIAL BRASIL'));
  hLeft.appendChild(el('h2', '', 'Central de Falta & Reposição'));
  hLeft.appendChild(el('p', '', 'Reconhecimento completo de Genéricos, Similares, Originais, Insulinas e Associações com seleção rápida de miligramas.'));
  hero.appendChild(hLeft);
  var hBtn = el('button', 'btn btn-w', '+ Novo Medicamento'); hBtn.onclick = abrirModalNovo; hero.appendChild(hBtn);
  main.appendChild(hero);

  var metrics = el('section', 'metrics');
  new Array({ k: 'TODOS', t: 'Total Cadastrado', id: 'm-total', c: '#4c1d95' }, { k: 'FALTA', t: 'Em Falta (Zero)', id: 'm-falta', c: '#dc2626' }, { k: 'CRITICO', t: 'Estoque Baixo', id: 'm-critico', c: '#d97706' }, { k: 'NORMAL', t: 'Disponíveis', id: 'm-normal', c: '#059669' }).forEach(function(d) {
    var mc = el('button', 'mcard' + (d.k === 'TODOS' ? ' active' : '')); mc.setAttribute('data-filtro', d.k);
    mc.appendChild(el('small', '', d.t));
    var h2 = el('h2', '', '0'); h2.id = d.id; h2.style.color = d.c; mc.appendChild(h2);
    mc.onclick = function() { filtrar(d.k); }; metrics.appendChild(mc);
  });
  main.appendChild(metrics);

  var bar = el('div', 'bar'), pills = el('div', 'pills');
  new Array({ k: 'TODOS', t: 'Todos' }, { k: 'FALTA', t: 'Lista: Em Falta' }, { k: 'GENERICO', t: 'Genéricos (G)' }, { k: 'SIMILAR', t: 'Similares (S)' }, { k: 'ORIGINAL', t: 'Originais (Rx)' }, { k: 'XAROPE', t: 'Xaropes / Líquidos' }).forEach(function(p) {
    var pb = el('button', 'pill' + (p.k === 'TODOS' ? ' active' : ''), p.t); pb.setAttribute('data-filtro', p.k);
    pb.onclick = function() { filtrar(p.k); }; pills.appendChild(pb);
  });
  bar.appendChild(pills);
  var bCop = el('button', 'pill', '📋 Copiar Lista WhatsApp'); bCop.onclick = copiarPedido; bar.appendChild(bCop);
  main.appendChild(bar);

  var vitrine = el('section', 'grid'); vitrine.id = 'vitrine'; main.appendChild(vitrine);
  root.appendChild(main);

  var mBg = el('div', 'modal-bg'); mBg.id = 'modal';
  var modal = el('div', 'modal'), mhead = el('div', 'mhead'), mTit = el('strong', '', 'Registrar Medicamento'); mTit.id = 'modal-titulo';
  var mX = el('button', '', '×'); mX.style.cssText = 'background:none;border:none;color:#fff;font-size:26px;cursor:pointer'; mX.onclick = fecharModal;
  mhead.appendChild(mTit); mhead.appendChild(mX); modal.appendChild(mhead);

  var form = el('form', 'mbody'); form.id = 'form'; form.onsubmit = salvarFormulario;
  var hid = el('input'); hid.type = 'hidden'; hid.id = 'edit-id'; form.appendChild(hid);

  var fg1 = el('div', 'fg'), lb1 = el('label');
  lb1.appendChild(el('span', '', 'Medicamento (ex: Dorflex, Losartana, Nistatina, Insulina NPH) *'));
  var bTipo = el('span', '', ''); bTipo.id = 'badge-tipo'; bTipo.style.color = '#7c3aed'; lb1.appendChild(bTipo); fg1.appendChild(lb1);
  var iNome = el('input'); iNome.id = 'nome'; iNome.autocomplete = 'off'; iNome.required = true; iNome.placeholder = 'Digite qualquer medicamento da base oficial...';
  iNome.oninput = function() { reconhecer(false); };
  fg1.appendChild(iNome); form.appendChild(fg1);

  var row1 = el('div', 'frow'), fg2 = el('div', 'fg');
  fg2.appendChild(el('label', '', 'Substância / Princípio Ativo'));
  var iPrinc = el('input'); iPrinc.id = 'principio'; fg2.appendChild(iPrinc);

  var fg3 = el('div', 'fg');
  fg3.appendChild(el('label', '', 'Miligrama / Embalagem (Clique na seta ▼)'));
  var selDose = el('select'); selDose.id = 'dosagem_sel'; selDose.style.cursor = 'pointer';
  selDose.onchange = function() {
    var inpD = document.getElementById('dosagem'), optSel = this.options[this.selectedIndex];
    if (this.value === 'OUTRA') { inpD.style.display = 'block'; inpD.value = ''; inpD.focus(); }
    else { inpD.style.display = 'none'; inpD.value = this.value; if (optSel && optSel.getAttribute('data-sub')) document.getElementById('principio').value = optSel.getAttribute('data-sub'); }
  };
  var opt0 = el('option', '', '▼ Selecione a mg ou embalagem...'); opt0.value = ''; selDose.appendChild(opt0);
  var iDose = el('input'); iDose.id = 'dosagem'; iDose.placeholder = 'Digite a mg, UI, cartela ou caixa...'; iDose.style.cssText = 'display:none;margin-top:8px';
  fg3.appendChild(selDose); fg3.appendChild(iDose); row1.appendChild(fg2); row1.appendChild(fg3); form.appendChild(row1);

  var rowTipo = el('div', 'frow'), fgTipo = el('div', 'fg');
  fgTipo.appendChild(el('label', '', 'Lista / Categoria (Clique na seta ▼)'));
  var selTipo = el('select'); selTipo.id = 'tipo_med'; selTipo.style.cursor = 'pointer';
  selTipo.onchange = function() { selecionarCategoria(this.value); };
  new Array({ v: 'Original', t: 'Original (Referência)' }, { v: 'Genérico', t: 'Genérico (G)' }, { v: 'Similar', t: 'Similar (S)' }).forEach(function(op) {
    var o = el('option', '', op.t); o.value = op.v; selTipo.appendChild(o);
  });
  fgTipo.appendChild(selTipo);

  var fg4 = el('div', 'fg'); fg4.appendChild(el('label', '', 'Unidade / Filial'));
  var iUni = el('input'); iUni.id = 'unidade'; iUni.value = 'FarmaGerci Matriz'; fg4.appendChild(iUni);
  rowTipo.appendChild(fgTipo); rowTipo.appendChild(fg4); form.appendChild(rowTipo);

  var row2 = el('div', 'frow'), fg5 = el('div', 'fg');
  fg5.appendChild(el('label', '', 'Estoque Atual *'));
  var iAt = el('input'); iAt.type = 'number'; iAt.id = 'atual'; iAt.value = '0'; iAt.required = true; fg5.appendChild(iAt);
  var fg6 = el('div', 'fg'); fg6.appendChild(el('label', '', 'Estoque Mínimo *'));
  var iMin = el('input'); iMin.type = 'number'; iMin.id = 'minimo'; iMin.value = '10'; iMin.required = true; fg6.appendChild(iMin);
  row2.appendChild(fg5); row2.appendChild(fg6); form.appendChild(row2);

  var mfoot = el('div', 'mfoot');
  var bCanc = el('button', 'pill', 'Cancelar'); bCanc.type = 'button'; bCanc.onclick = fecharModal;
  var bSalv = el('button', 'btn btn-p', 'Salvar na FarmaGerci'); bSalv.type = 'submit';
  mfoot.appendChild(bCanc); mfoot.appendChild(bSalv); form.appendChild(mfoot);
  modal.appendChild(form); mBg.appendChild(modal); root.appendChild(mBg);
}

function preencherSetinha(semDose, substanciaBase, doseExtraida) {
  var sel = document.getElementById('dosagem_sel'), inpD = document.getElementById('dosagem');
  if (!sel || !inpD) return;
  var opcoes = typeof window.buscarOpcoesMedicamento === 'function' ? window.buscarOpcoesMedicamento(semDose, substanciaBase) : new Array();
  var valorAtual = inpD.value;
  sel.innerHTML = '';
  if (opcoes.length > 0) {
    var optP = el('option', '', '▼ Clique e escolha a mg / embalagem...'); optP.value = ''; sel.appendChild(optP);
    opcoes.forEach(function(item) {
      var o = el('option', '', item.label); o.value = item.label;
      if (item.sub) o.setAttribute('data-sub', item.sub);
      if ((doseExtraida && item.label.toLowerCase().indexOf(doseExtraida.toLowerCase()) !== -1) || valorAtual === item.label) { o.selected = true; inpD.value = item.label; }
      sel.appendChild(o);
    });
    var optO = el('option', '', '✎ Digitar outra apresentação...'); optO.value = 'OUTRA'; sel.appendChild(optO);
    inpD.style.display = 'none';
  } else {
    var optL = el('option', '', '✎ Digitar apresentação abaixo...'); optL.value = 'OUTRA'; optL.selected = true; sel.appendChild(optL);
    inpD.style.display = 'block';
    if (doseExtraida) inpD.value = doseExtraida;
  }
}

function reconhecer(manterDoseAtual) {
  var txt = document.getElementById('nome').value, inpD = document.getElementById('dosagem');
  if (!manterDoseAtual && inpD) inpD.value = '';
  var partes = txt.split(' '), semDose = txt, doseExtraida = '';
  for (var i = 0; i < partes.length; i++) {
    var p = partes[i].toLowerCase();
    if (p.indexOf('mg') > 0 || p.indexOf('ml') > 0 || p.indexOf('mcg') > 0 || p.indexOf('ui') > 0 || (p.length > 1 && p.endsWith('g') && !isNaN(p))) {
      doseExtraida = partes[i]; semDose = txt.replace(partes[i], '').trim();
    }
  }
  var res = classificarRemedio(semDose), achouLocal = res && res.conhecido;
  if (res) { document.getElementById('principio').value = res.principio; selecionarCategoria(res.tipo); }
  else { document.getElementById('principio').value = ''; selecionarCategoria('Similar'); document.getElementById('badge-tipo').textContent = ''; }
  preencherSetinha(semDose, res ? res.principio : '', doseExtraida);

  if (semDose.length >= 2) {
    clearTimeout(timerOnline);
    timerOnline = setTimeout(async function() {
      try {
        if (!achouLocal) document.getElementById('badge-tipo').textContent = '⏳ Buscando na base ANVISA...';
        var r = await fetch('/api/consultar-farmaco?q=' + encodeURIComponent(semDose));
        var d = await r.json();
        if (d && d.principio && (!achouLocal || d.principio.length > document.getElementById('principio').value.length)) document.getElementById('principio').value = d.principio;
        if (d && d.tipo && !achouLocal) { selecionarCategoria(d.tipo); document.getElementById('badge-tipo').textContent = '✓ ' + d.tipo + ' (ANVISA)'; }
        else if (!achouLocal) document.getElementById('badge-tipo').textContent = '✓ ' + document.getElementById('tipo_med').value;

        var sel = document.getElementById('dosagem_sel');
        if (d && d.dosagens && d.dosagens.length > 0) {
          if (sel.options.length <= 2) sel.innerHTML = '<option value="">▼ Clique e escolha a mg / embalagem (' + d.dosagens.length + ')...</option>';
          else sel.remove(sel.options.length - 1);
          d.dosagens.forEach(function(dose) {
            var existe = false;
            for (var k = 0; k < sel.options.length; k++) if (norm(sel.options[k].value) === norm(dose)) existe = true;
            if (!existe) { var o = el('option', '', dose); o.value = dose; sel.appendChild(o); }
          });
          var optO = el('option', '', '✎ Digitar outra apresentação...'); optO.value = 'OUTRA'; sel.appendChild(optO);
          document.getElementById('dosagem').style.display = 'none';
        }
      } catch (e) {}
    }, 280);
  }
}

function avisar(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(function() { t.classList.remove('show'); }, 2500); }
function statusDe(x) { return Number(x.estoque_atual) === 0 ? 'FALTA' : (Number(x.estoque_atual) <= Number(x.estoque_minimo) ? 'CRITICO' : 'NORMAL'); }
function tipoDe(m) {
  var u = norm(m.unidade_saude);
  if (u.indexOf('generico') !== -1) return 'Genérico';
  if (u.indexOf('original') !== -1) return 'Original';
  if (u.indexOf('similar') !== -1) return 'Similar';
  var auto = classificarRemedio(m.nome);
  return auto ? auto.tipo : 'Similar';
}

async function carregar() {
  try {
    var res = await fetch('/api/medicamentos');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    lista = await res.json();
    document.getElementById('status-db').textContent = '● Sistema Online';
    var f = 0, c = 0, n = 0;
    lista.forEach(function(x) { var s = statusDe(x); if (s === 'FALTA') f++; else if (s === 'CRITICO') c++; else n++; });
    document.getElementById('m-total').textContent = lista.length;
    document.getElementById('m-falta').textContent = f;
    document.getElementById('m-critico').textContent = c;
    document.getElementById('m-normal').textContent = n;
    renderizar();
  } catch (e) { document.getElementById('status-db').textContent = '● Erro: ' + e.message; }
}

function filtrar(st) {
  filtroAtivo = st;
  document.querySelectorAll('[data-filtro]').forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-filtro') === st); });
  renderizar();
}

function obterFiltrados() {
  var q = norm(document.getElementById('busca').value);
  return lista.filter(function(m) {
    var tipo = norm(tipoDe(m)), forma = norm((m.dosagem || '') + ' ' + (m.nome || ''));
    if (norm(m.nome).indexOf(q) === -1 && norm(m.principio_ativo).indexOf(q) === -1 && tipo.indexOf(q) === -1 && forma.indexOf(q) === -1) return false;
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
  var filtrados = obterFiltrados(), box = document.getElementById('vitrine');
  box.innerHTML = '';
  if (filtrados.length === 0) {
    var emp = el('div', 'empty'); emp.appendChild(el('h3', '', 'Nenhum medicamento nesta lista'));
    var bAdd = el('button', 'btn btn-p', '+ Registrar Item'); bAdd.style.marginTop = '12px'; bAdd.onclick = abrirModalNovo;
    emp.appendChild(bAdd); box.appendChild(emp); return;
  }
  filtrados.forEach(function(m) {
    var st = statusDe(m), atual = Number(m.estoque_atual), min = Number(m.estoque_minimo) || 1;
    var pct = Math.min(100, Math.round((atual / (min * 2)) * 100));
    var bCls = st === 'FALTA' ? 'bf' : (st === 'CRITICO' ? 'bc' : 'bn');
    var bTxt = st === 'FALTA' ? 'Em Falta' : (st === 'CRITICO' ? 'Estoque Baixo' : 'Disponível');
    var cor = st === 'FALTA' ? '#dc2626' : (st === 'CRITICO' ? '#d97706' : '#7c3aed');

    var card = el('div', 'card'), ctop = el('div', 'ctop');
    ctop.appendChild(el('span', 'bdg ' + bCls, bTxt));
    var cact = el('div', 'cact');
    var bEd = el('button', '', 'Editar'); bEd.onclick = function() { editar(m.id); };
    var bEx = el('button', '', 'Excluir'); bEx.onclick = function() { remover(m.id); };
    cact.appendChild(bEd); cact.appendChild(bEx); ctop.appendChild(cact); card.appendChild(ctop);

    var autoInfo = classificarRemedio(m.nome), tipoDetectado = tipoDe(m);
    var subst = (m.principio_ativo && norm(m.principio_ativo) !== norm(m.nome)) ? m.principio_ativo : (autoInfo ? autoInfo.principio : m.nome);

    var stage = el('div', 'box-stage'), box3d = el('div', 'box-3d'), bBrand = el('div', 'box-brand');
    bBrand.appendChild(el('span', '', 'FARMAGERCI')); bBrand.appendChild(el('span', '', m.dosagem || ''));
    box3d.appendChild(bBrand); box3d.appendChild(el('div', 'box-name', m.nome)); box3d.appendChild(el('div', 'box-sub', subst));

    var stripeCls = tipoDetectado === 'Genérico' ? 'box-stripe-g' : (tipoDetectado === 'Original' ? 'box-stripe-rx' : 'box-stripe-s');
    var stripeTxt = tipoDetectado === 'Genérico' ? 'G • MEDICAMENTO GENÉRICO' : (tipoDetectado === 'Original' ? 'REFERÊNCIA / ORIGINAL' : 'SIMILAR • FARMAGERCI');
    var stripe = el('div', stripeCls); stripe.appendChild(el('span', '', stripeTxt)); box3d.appendChild(stripe);
    stage.appendChild(box3d); card.appendChild(stage);

    card.appendChild(el('div', 'ctitle', m.nome));
    if (m.dosagem) card.appendChild(el('span', 'cdose', m.dosagem));

    var ci = el('div', 'cinfo'), nomeUni = (m.unidade_saude || 'FarmaGerci Matriz').split('•').shift().trim();
    ci.appendChild(el('div', '', 'Substância: ' + subst));
    ci.appendChild(el('div', '', 'Lista: ' + tipoDetectado + ' • ' + nomeUni));
    card.appendChild(ci);

    var sr = el('div', 'strow'); sr.appendChild(el('span', '', 'Estoque: ' + atual + ' un.')); sr.appendChild(el('span', '', 'Mín: ' + min)); card.appendChild(sr);
    var pbg = el('div', 'pbg'), pf = el('div', 'pfill'); pf.style.width = pct + '%'; pf.style.background = cor; pbg.appendChild(pf); card.appendChild(pbg);

    var qb = el('div', 'qbtns');
    var q1 = el('button', 'qbtn', '-1'); q1.onclick = function() { mover(m.id, -1); };
    var q2 = el('button', 'qbtn', '+1'); q2.onclick = function() { mover(m.id, 1); };
    var q3 = el('button', 'qbtn qplus', '+10 un.'); q3.onclick = function() { mover(m.id, 10); };
    qb.appendChild(q1); qb.appendChild(q2); qb.appendChild(q3); card.appendChild(qb);
    box.appendChild(card);
  });
}

async function mover(id, qtd) {
await fetch('/api/medicamentos/' + id + '/estoque', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantidade: qtd }) });
avisar('Estoque atualizado!'); carregar();
}
async function remover(id) {
if (!confirm('Remover item?')) return;
await fetch('/api/medicamentos/' + id, { method: 'DELETE' });
avisar('Removido.'); carregar();
}
function abrirModalNovo() {
document.getElementById('edit-id').value = '';
document.getElementById('modal-titulo').textContent = 'Registrar Medicamento / Falta';
document.getElementById('badge-tipo').textContent = '';
document.getElementById('form').reset();
document.getElementById('dosagem').value = ''; document.getElementById('dosagem').style.display = 'none';
document.getElementById('dosagem_sel').innerHTML = '▼ Selecione a mg ou embalagem...';
selecionarCategoria('Similar');
document.getElementById('unidade').value = 'FarmaGerci Matriz';
document.getElementById('atual').value = 0; document.getElementById('minimo').value = 10;
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
var pUni = (m.unidade_saude || 'FarmaGerci Matriz').split('•');
document.getElementById('unidade').value = (pUni.shift() || 'FarmaGerci Matriz').trim();
var catSalva = (pUni.shift() || '').trim() || tipoDe(m);
document.getElementById('atual').value = m.estoque_atual; document.getElementById('minimo').value = m.estoque_minimo;
reconhecer(true); selecionarCategoria(catSalva);
document.getElementById('modal').classList.add('open');
}
function fecharModal() { document.getElementById('modal').classList.remove('open'); }
async function salvarFormulario(e) {
e.preventDefault();
var id = document.getElementById('edit-id').value, nomeL = document.getElementById('nome').value.trim(), doseL = document.getElementById('dosagem').value.trim();
var auto = classificarRemedio(nomeL), subst = document.getElementById('principio').value.trim() || (auto ? auto.principio : nomeL);
var tipo = document.getElementById('tipo_med').value.trim() || (auto ? auto.tipo : 'Similar'), uni = document.getElementById('unidade').value.trim() || 'FarmaGerci Matriz';
nomeL = nomeL.charAt(0).toUpperCase() + nomeL.slice(1);
var dados = { nome: nomeL, principio_ativo: subst, dosagem: doseL, unidade_saude: uni + ' • ' + tipo, estoque_atual: Number(document.getElementById('atual').value), estoque_minimo: Number(document.getElementById('minimo').value) };
if (id) await fetch('/api/medicamentos/' + id, { method: 'DELETE' });
await fetch('/api/medicamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
fecharModal(); avisar('Salvo na FarmaGerci!'); soltarEmojisFarmacia(nomeL + ' ' + doseL + ' ' + subst); carregar();
}
function copiarPedido() {
var itens = obterFiltrados();
if (!itens.length) { avisar('Nenhum item nesta lista para copiar!'); return; }
var grupos = { 'Genérico': new Array(), 'Original': new Array(), 'Similar': new Array() };
itens.forEach(function(m) { var cat = tipoDe(m); if (!grupos[cat]) grupos[cat] = new Array(); grupos[cat].push(m); });
var linhas = new Array('🏥 PEDIDO DE REPOSIÇÃO — FARMAGERCI', '📅 Data: ' + new Date().toLocaleDateString('pt-BR') + ' | Filtro: ' + filtroAtivo + '', '📦 Total de itens: ' + itens.length + '', '━━━━━━━━━━━━━━━━━━━━');
new Array('Genérico', 'Original', 'Similar').forEach(function(cat) {
var arr = grupos[cat];
if (arr && arr.length > 0) {
var ic = cat === 'Genérico' ? '🟡' : (cat === 'Original' ? '🔴' : '🟣');
linhas.push(''); linhas.push(ic + ' ' + cat.toUpperCase() + 'S (' + arr.length + ')');
arr.forEach(function(m, idx) {
var auto = classificarRemedio(m.nome);
var subst = (m.principio_ativo && norm(m.principio_ativo) !== norm(m.nome)) ? m.principio_ativo : (auto ? auto.principio : '');
var faltaQtd = Math.max(1, Number(m.estoque_minimo) - Number(m.estoque_atual));
var lItem = (idx + 1) + '. ' + m.nome + '' + (m.dosagem ? ' (' + m.dosagem + ')' : '');
if (subst && norm(subst) !== norm(m.nome)) lItem += '\n    ↳ Substância: ' + subst;
lItem += '\n    ↳ Estoque: ' + m.estoque_atual + ' un. | Pedir: ' + faltaQtd + ' un.';
linhas.push(lItem);
});
}
});
linhas.push(''); linhas.push('━━━━━━━━━━━━━━━━━━━━'); linhas.push('✅ Gerado automaticamente por FarmaGerci');
navigator.clipboard.writeText(linhas.join('\n'));
avisar('Lista organizada copiada para o WhatsApp!');
}
montarTela();
carregar();
soltarEmojisFarmacia('boas-vindas');
