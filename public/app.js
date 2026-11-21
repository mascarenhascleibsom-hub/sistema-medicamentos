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
    var infoForma = [doseExtraida, res.forma].filter(Boolean).join(' • ');
    document.getElementById('dosagem').value = infoForma;
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
  var uNorm = norm(m.unidade_saude);
  if (uNorm.indexOf('generico') !== -1) return 'Genérico';
  if (uNorm.indexOf('similar') !== -1) return 'Similar';
  if (uNorm.indexOf('original') !== -1) return 'Original';
  var auto = classificarRemedio(m.nome);
  return auto ? auto.tipo : 'Original';
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
    var subst = m.principio_ativo || (autoInfo ? autoInfo.principio : m.nome);
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
