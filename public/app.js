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

function detectarForma(texto) {
  var l = norm(texto);
  if (l.indexOf('insulina') !== -1 || l.indexOf('caneta') !== -1 || l.indexOf('refil') !== -1) return 'Insulina / Injetável';
  if (l.indexOf('geleia') !== -1 || l.indexOf('gel oral') !== -1) return 'Geleia Oral';
  if (l.indexOf('pomada') !== -1 || l.indexOf('creme') !== -1 || l.indexOf('gel') !== -1 || l.indexOf('unguento') !== -1) return 'Pomada/Creme';
  if (l.indexOf('xarope') !== -1 || l.indexOf('xpe') !== -1) return 'Xarope';
  if (l.indexOf('gotas') !== -1 || l.indexOf('gts') !== -1) return 'Gotas';
  if (l.indexOf('suspensao') !== -1 || l.indexOf('susp') !== -1) return 'Suspensão Oral';
  if (l.indexOf('colirio') !== -1 || l.indexOf('oftalmico') !== -1) return 'Colírio';
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
  busca.placeholder = 'Buscar medicamento, substância, insulina, genérico...';
  busca.oninput = renderizar;
  search.appendChild(busca);
  hdrIn.appendChild(search);

  var bNovo = el('button', 'btn btn-w', '+ Registrar Falta');
  bNovo.onclick = abrirModalNovo;
  hdrIn.appendChild(bNovo);
  hdr.appendChild(hdrIn);
  root.appendChild(hdr);

  var main = el('main', 'wrap');

  var hero = el('section', 'hero');
  var hLeft = el('div');
  hLeft.appendChild(el('span', 'hero-tag', 'SISTEMA NEURAL FARMAGERCI • ANVISA SYNC'));
  hLeft.appendChild(el('h2', '', 'Central Inteligente de Falta A–Z'));
  hLeft.appendChild(el('p', '', 'Identificação automática de Genéricos, Similares, Originais, Insulinas e Associações direto da base oficial.'));
  hero.appendChild(hLeft);
  var hBtn = el('button', 'btn btn-w', '+ Novo Medicamento');
  hBtn.onclick = abrirModalNovo;
  hero.appendChild(hBtn);
  main.appendChild(hero);

  var metrics = el('section', 'metrics');
  [
    { k: 'TODOS', t: 'Total Cadastrado', id: 'm-total', c: '#e9d5ff' },
    { k: 'FALTA', t: 'Em Falta (Zero)', id: 'm-falta', c: '#fda4af' },
    { k: 'CRITICO', t: 'Estoque Baixo', id: 'm-critico', c: '#fde047' },
    { k: 'NORMAL', t: 'Disponíveis', id: 'm-normal', c: '#6ee7b7' }
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
  mX.style.cssText = 'background:none;border:none;color:#fff;font-size:26px;cursor:pointer';
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
  lb1.appendChild(el('span', '', 'Medicamento (ex: Insulina NPH, Ciclo 21, Tylenol, Trazodona) *'));
  var bTipo = el('span', '', '');
  bTipo.id = 'badge-tipo';
  bTipo.style.color = '#facc15';
  lb1.appendChild(bTipo);
  fg1.appendChild(lb1);

  var iNome = el('input');
  iNome.id = 'nome';
  iNome.autocomplete = 'off';
  iNome.required = true;
  iNome.placeholder = 'Digite qualquer medicamento de A a Z...';
  iNome.oninput = function() { reconhecer(false); };
  fg1.appendChild(iNome);

  var dl = el('datalist');
  dl.id = 'sugestoes-anvisa';
  iNome.setAttribute('list', 'sugestoes-anvisa');
  fg1.appendChild(dl);
  form.appendChild(fg1);

  var row1 = el('div', 'frow');
  var fg2 = el('div', 'fg');
  fg2.appendChild(el('label', '', 'Substância / Princípio Ativo'));
  var iPrinc = el('input');
  iPrinc.id = 'principio';
  fg2.appendChild(iPrinc);

  var fg3 = el('div', 'fg');
  fg3.appendChild(el('label', '', 'Miligrama / Associação (Clique na seta ▼)'));

  var selDose = el('select');
  selDose.id = 'dosagem_sel';
  selDose.style.cursor = 'pointer';
  selDose.onchange = function() {
    var inpD = document.getElementById('dosagem');
    var optSel = this.options[this.selectedIndex];
    if (this.value === 'OUTRA') {
      inpD.style.display = 'block';
      inpD.value = '';
      inpD.focus();
    } else {
      inpD.style.display = 'none';
      inpD.value = this.value;
      if (optSel && optSel.getAttribute('data-sub')) {
        document.getElementById('principio').value = optSel.getAttribute('data-sub');
      }
    }
  };
  var opt0 = el('option', '', '▼ Selecione a mg ou apresentação...');
  opt0.value = '';
  selDose.appendChild(opt0);

  var iDose = el('input');
  iDose.id = 'dosagem';
  iDose.placeholder = 'Digite a mg, UI, xarope ou pomada...';
  iDose.style.display = 'none';
  iDose.style.marginTop = '8px';

  fg3.appendChild(selDose);
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

function preencherSetinha(semDose, substanciaBase, doseExtraida, textoCompleto) {
  var sel = document.getElementById('dosagem_sel');
  var inpD = document.getElementById('dosagem');
  if (!sel || !inpD) return;

  var opcoes = [];
  if (typeof window.buscarOpcoesMedicamento === 'function') {
    opcoes = window.buscarOpcoesMedicamento(semDose, substanciaBase);
  }

  var valorAtual = inpD.value;
  sel.innerHTML = '';

  if (opcoes.length > 0) {
    var optPadrao = el('option', '', '▼ Clique e escolha a mg / associação...');
    optPadrao.value = '';
    sel.appendChild(optPadrao);

    opcoes.forEach(function(item) {
      var o = el('option', '', item.label);
      o.value = item.label;
      if (item.sub) o.setAttribute('data-sub', item.sub);

      if ((doseExtraida && item.label.toLowerCase().indexOf(doseExtraida.toLowerCase()) !== -1) ||
          (textoCompleto.toLowerCase().indexOf(' dc') !== -1 && item.label.indexOf('DC') !== -1) ||
          (textoCompleto.toLowerCase().indexOf('sinus') !== -1 && item.label.indexOf('Sinus') !== -1) ||
          (textoCompleto.toLowerCase().indexOf('composto') !== -1 && item.label.indexOf('Composto') !== -1) ||
          (textoCompleto.toLowerCase().indexOf('nph') !== -1 && item.label.indexOf('NPH') !== -1) ||
          (textoCompleto.toLowerCase().indexOf('regular') !== -1 && item.label.indexOf('Regular') !== -1) ||
          valorAtual === item.label) {
        o.selected = true;
        inpD.value = item.label;
        if (item.sub) document.getElementById('principio').value = item.sub;
      }
      sel.appendChild(o);
    });

    var optOutra = el('option', '', '✎ Digitar outra apresentação...');
    optOutra.value = 'OUTRA';
    sel.appendChild(optOutra);
    inpD.style.display = 'none';
  } else {
    var optLivre = el('option', '', '✎ Digitar apresentação abaixo...');
    optLivre.value = 'OUTRA';
    optLivre.selected = true;
    sel.appendChild(optLivre);
    inpD.style.display = 'block';
    if (doseExtraida) inpD.value = doseExtraida;
  }
}

function reconhecer(manterDoseAtual) {
  var txt = document.getElementById('nome').value;
  var inpD = document.getElementById('dosagem');
  if (!manterDoseAtual && inpD) {
    inpD.value = '';
  }

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
  var achouLocal = res && norm(res.principio) !== norm(semDose);

  if (res) {
    document.getElementById('principio').value = res.principio;
    document.getElementById('tipo_med').value = res.tipo;
    document.getElementById('badge-tipo').textContent = '✓ ' + res.tipo + (res.forma ? ' (' + res.forma + ')' : '');
  } else {
    document.getElementById('principio').value = '';
    document.getElementById('tipo_med').value = '';
    document.getElementById('badge-tipo').textContent = '';
  }

  preencherSetinha(semDose, res ? res.principio : '', doseExtraida, txt);

  if (semDose.length >= 2) {
    clearTimeout(timerOnline);
    timerOnline = setTimeout(async function() {
      try {
        var subAtual = achouLocal ? res.principio : '';
        if (!achouLocal) {
          document.getElementById('badge-tipo').textContent = '⏳ Buscando substância e mg...';
        }
        var r = await fetch('/api/consultar-farmaco?q=' + encodeURIComponent(semDose) + '&sub=' + encodeURIComponent(subAtual));
        var d = await r.json();

        if (d && d.principio && !achouLocal) {
          document.getElementById('principio').value = d.principio;
          document.getElementById('badge-tipo').textContent = '✓ ' + (res ? res.tipo : 'Similar');
        } else if (!achouLocal) {
          document.getElementById('badge-tipo').textContent = '✓ Similar';
        }

        var sel = document.getElementById('dosagem_sel');
        var temOpcoesLocais = typeof window.buscarOpcoesMedicamento === 'function' && window.buscarOpcoesMedicamento(semDose, subAtual).length > 0;
        if (!temOpcoesLocais && d && d.dosagens && d.dosagens.length > 0) {
          sel.innerHTML = '<option value="">▼ Clique e escolha a mg (' + d.dosagens.length + ')...</option>';
          d.dosagens.forEach(function(dose) {
            var o = el('option', '', dose);
            o.value = dose;
            if (doseExtraida && dose.toLowerCase().indexOf(doseExtraida.toLowerCase()) !== -1) {
              o.selected = true;
              document.getElementById('dosagem').value = dose;
            }
            sel.appendChild(o);
          });
          var optO = el('option', '', '✎ Digitar outra apresentação...');
          optO.value = 'OUTRA';
          sel.appendChild(optO);
          document.getElementById('dosagem').style.display = 'none';
        }
      } catch (e) {}
    }, 350);
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
    if (!res.ok) throw new Error('HTTP ' + res.status);
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
    document.getElementById('status-db').textContent = '● Erro: ' + e.message;
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
    var cor = st === 'FALTA' ? '#fda4af' : (st === 'CRITICO' ? '#fde047' : '#6ee7b7');

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

    var autoInfo = classificarRemedio(m.nome);
    var tipoDetectado = tipoDe(m);
    var subst = (m.principio_ativo && norm(m.principio_ativo) !== norm(m.nome))
      ? m.principio_ativo
      : (autoInfo ? autoInfo.principio : m.nome);

    var stage = el('div', 'box-stage');
    var box3d = el('div', 'box-3d');
    var bBrand = el('div', 'box-brand');
    bBrand.appendChild(el('span', '', 'FARMAGERCI'));
    bBrand.appendChild(el('span', '', m.dosagem || ''));
    box3d.appendChild(bBrand);
    box3d.appendChild(el('div', 'box-name', m.nome));
    box3d.appendChild(el('div', 'box-sub', subst));

    var stripeCls = tipoDetectado === 'Genérico' ? 'box-stripe-g' : (tipoDetectado === 'Original' ? 'box-stripe-rx' : 'box-stripe-s');
    var stripeTxt = tipoDetectado === 'Genérico' ? 'G • MEDICAMENTO GENÉRICO' : (tipoDetectado === 'Original' ? 'REFERÊNCIA / ORIGINAL' : 'SIMILAR • FARMAGERCI');
    var stripe = el('div', stripeCls);
    stripe.appendChild(el('span', '', stripeTxt));
    box3d.appendChild(stripe);

    stage.appendChild(box3d);
    card.appendChild(stage);

    card.appendChild(el('div', 'ctitle', m.nome));
    if (m.dosagem) card.appendChild(el('span', 'cdose', m.dosagem));

    var ci = el('div', 'cinfo');
    var nomeUni = (m.unidade_saude || 'FarmaGerci Matriz').split('•').shift().trim();
    ci.appendChild(el('div', '', 'Substância: ' + subst));
    ci.appendChild(el('div', '', 'Lista: ' + tipoDetectado + ' • ' + nomeUni));
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
  document.getElementById('dosagem').value = '';
  document.getElementById('dosagem').style.display = 'none';
  document.getElementById('dosagem_sel').innerHTML = '<option value="">▼ Selecione a mg ou apresentação...</option>';
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
  document.getElementById('unidade').value = (partesUni.shift() || 'FarmaGerci Matriz').trim();
  document.getElementById('tipo_med').value = (partesUni.shift() || '').trim();
  document.getElementById('atual').value = m.estoque_atual;
  document.getElementById('minimo').value = m.estoque_minimo;
  reconhecer(true);
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
