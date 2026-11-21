var BASE_ORIGINAIS = {
  'donaren': 'Cloridrato de Trazodona', 'novalgina': 'Dipirona Monoidratada',
  'tylenol': 'Paracetamol', 'advil': 'Ibuprofeno', 'amoxil': 'Amoxicilina Tri-hidratada',
  'clavulin': 'Amoxicilina + Clavulanato', 'astro': 'Azitromicina Di-hidratada',
  'keflex': 'Cefalexina', 'cipro': 'Cloridrato de Ciprofloxacino',
  'flagyl': 'Metronidazol', 'cozaar': 'Losartana Potássica',
  'renitec': 'Maleato de Enalapril', 'capoten': 'Captopril',
  'lasix': 'Furosemida', 'selozok': 'Succinato de Metoprolol',
  'concor': 'Hemifumarato de Bisoprolol', 'norvasc': 'Besilato de Anlodipino',
  'zocor': 'Sinvastatina', 'lipitor': 'Atorvastatina Cálcica',
  'crestor': 'Rosuvastatina Cálcica', 'glifage': 'Cloridrato de Metformina',
  'daonil': 'Glibenclamida', 'amaryl': 'Glimepirida', 'galvus': 'Vildagliptina',
  'januvia': 'Fosfato de Sitagliptina', 'forxiga': 'Dapagliflozina',
  'jardiance': 'Empagliflozina', 'ozempic': 'Semaglutida',
  'losec': 'Omeprazol', 'pantozol': 'Pantoprazol Sódico',
  'nexium': 'Esomeprazol Magnésio', 'claritin': 'Loratadina',
  'desalex': 'Desloratadina', 'allegra': 'Cloridrato de Fexofenadina',
  'polaramine': 'Maleato de Dexclorfeniramina', 'meticorten': 'Prednisona',
  'prelone': 'Prednisolona', 'decadron': 'Dexametasona',
  'rivotril': 'Clonazepam', 'valium': 'Diazepam', 'frontal': 'Alprazolam',
  'lexotan': 'Bromazepam', 'lorax': 'Lorazepam', 'stilnox': 'Zolpidem',
  'zoloft': 'Cloridrato de Sertralina', 'prozac': 'Cloridrato de Fluoxetina',
  'lexapro': 'Oxalato de Escitalopram', 'cipramil': 'Bromidrato de Citalopram',
  'pondera': 'Cloridrato de Paroxetina', 'tryptanol': 'Cloridrato de Amitriptilina',
  'efexor': 'Cloridrato de Venlafaxina', 'pristiq': 'Desvenlafaxina',
  'cymbalta': 'Cloridrato de Duloxetina', 'wellbutrin': 'Cloridrato de Bupropiona',
  'seroquel': 'Hemifumarato de Quetiapina', 'risperdal': 'Risperidona',
  'zyprexa': 'Olanzapina', 'haldol': 'Haloperidol', 'tegretol': 'Carbamazepina',
  'gardenal': 'Fenobarbital', 'depakene': 'Valproato de Sódio',
  'puran': 'Levotiroxina Sódica', 'euthyrox': 'Levotiroxina Sódica',
  'aerolin': 'Sulfato de Salbutamol', 'buscopan': 'Escopolamina',
  'dramin': 'Dimenidrinato', 'plasil': 'Metoclopramida',
  'vonau': 'Ondansetrona', 'cataflam': 'Diclofenaco Potássico',
  'voltaren': 'Diclofenaco Sódico', 'celebra': 'Celecoxibe',
  'arcoxia': 'Etoricoxibe', 'luftal': 'Simeticona', 'imosec': 'Loperamida',
  'viagra': 'Citrato de Sildenafila', 'cialis': 'Tadalafila',
  'xarelto': 'Rivaroxabana', 'eliquis': 'Apixabana', 'plavix': 'Clopidogrel'
};

var BASE_SIMILARES = {
  'aradois': 'Losartana Potássica', 'anador': 'Dipirona Monoidratada',
  'alivium': 'Ibuprofeno', 'busprofem': 'Ibuprofeno', 'nisulid': 'Nimesulida',
  'scaflam': 'Nimesulida', 'neosaldina': 'Dipirona + Isometepteno + Cafeína',
  'dorflex': 'Dipirona + Orfenadrina + Cafeína', 'torsilax': 'Cafeína + Carisoprodol + Diclofenaco + Paracetamol',
  'tandrilax': 'Cafeína + Carisoprodol + Diclofenaco + Paracetamol',
  'miosan': 'Ciclobenzaprina', 'cimegripe': 'Paracetamol + Clorfeniramina + Fenilefrina',
  'benegrip': 'Dipirona + Clorfeniramina + Cafeína', 'resfenol': 'Paracetamol + Clorfeniramina + Fenilefrina',
  'histamin': 'Maleato de Dexclorfeniramina', 'hixizine': 'Cloridrato de Hidroxizina',
  'daforin': 'Cloridrato de Fluoxetina', 'exodus': 'Oxalato de Escitalopram',
  'zetron': 'Cloridrato de Bupropiona', 'bup': 'Cloridrato de Bupropiona',
  'velija': 'Cloridrato de Duloxetina', 'patz': 'Hemitartarato de Zolpidem',
  'levoid': 'Levotiroxina Sódica', 'busonid': 'Budesonida',
  'fluimucil': 'Acetilcisteína', 'bisolvon': 'Cloridrato de Bromexina',
  'nebacetin': 'Sulfato de Neomicina + Bacitracina', 'bepantol': 'Dexpantenol',
  'enterogermina': 'Bacillus clausii', 'repoflor': 'Saccharomyces boulardii',
  'addera': 'Colecalciferol (Vitamina D3)', 'noripurum': 'Ferripolimaltose',
  'endofolin': 'Ácido Fólico', 'somalgin': 'Ácido Acetilsalicílico'
};

var LISTA_GENERICOS = [
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

function identificarFarmaco(textoDigitado) {
  var limpo = (textoDigitado || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (!limpo) return null;

  for (var orig in BASE_ORIGINAIS) {
    if (limpo === orig || limpo.indexOf(orig + ' ') === 0 || limpo.indexOf(orig) !== -1) {
      return { principio: BASE_ORIGINAIS[orig], tipo: 'Original / Referência' };
    }
  }

  for (var sim in BASE_SIMILARES) {
    if (limpo === sim || limpo.indexOf(sim + ' ') === 0 || limpo.indexOf(sim) !== -1) {
      return { principio: BASE_SIMILARES[sim], tipo: 'Similar' };
    }
  }

  for (var i = 0; i < LISTA_GENERICOS.length; i++) {
    var gen = LISTA_GENERICOS[i];
    if (limpo === gen || limpo.indexOf(gen + ' ') === 0 || limpo.indexOf(gen) !== -1) {
      var cap = gen.charAt(0).toUpperCase() + gen.slice(1);
      return { principio: cap, tipo: 'Genérico' };
    }
  }

  // Fallback inteligente para qualquer outro medicamento digitado
  var outro = textoDigitado.trim();
  outro = outro.charAt(0).toUpperCase() + outro.slice(1);
  return { principio: outro, tipo: 'Similar / Comercial' };
}
