function reconhecer() {
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
  lb1.appendChild(el('span', '', 'Medicamento (ex: Trazodona 50mg, Acebrofilina xarope) *'));
  var bTipo = el('span', '', '');
  bTipo.id = 'badge-tipo';
  bTipo.style.color = '#6d28d9';
  lb1.appendChild(bTipo);
  fg1.appendChild(lb1);

  var iNome = el('input');
  iNome.id = 'nome';
  iNome.autocomplete = 'off';
  iNome.required = true;
  iNome.placeholder = 'Digite o nome, forma (xarope, gotas) e dosagem opcional...';
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
  iDose.placeholder = 'Ex: 50mg ou Xarope';
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
