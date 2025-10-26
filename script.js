

    document.getElementById('btnRules')?.addEventListener('click', calculerRegles);
  const uniq = arr => [...new Set(arr)];
  // 🔁 au lieu de byNum:
const bySym = (a, b) => {
  const na = Number(a), nb = Number(b);
  const aIsNum = !Number.isNaN(na), bIsNum = !Number.isNaN(nb);
  if (aIsNum && bIsNum) return na - nb;           // 1,2,3...
  return String(a).localeCompare(String(b), 'fr'); // A,B,C...
};

// 🔁 remplace parseDataset par :
function parseDataset(text){
  const lines = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const transactions = [];
  for(const line of lines){
    const m = line.match(/^\s*([^:]+)\s*:\s*(.+)$/);
    if(!m) continue;
    const tid = m[1].trim();
    // accepte A B C, ou 1 2 3, ou mixte — séparés par espaces/virgules
    const items = m[2]
      .trim()
      .split(/[,\s]+/)
      .map(tok => tok.replace(/[^\w-]/g,'').toUpperCase()) // “a”→“A”, enlève ponctuation
      .filter(Boolean);
    // unique + tri naturel (nombres ou lettres)
    const uniq = arr => [...new Set(arr)];
    transactions.push({tid, items: uniq(items).sort(bySym)});
  }
  const all = [...new Set(transactions.flatMap(t=>t.items))].sort(bySym);
  return {transactions, items: all};
}
  function combinations(items){
    const res = [[]];
    for(const x of items){
      const copy = res.map(s => s.concat(x));
      res.push(...copy);
    }
    return res.sort((a,b)=> a.length-b.length || a.join(',').localeCompare(b.join(',')));
  }

  function key(arr){ return arr.join('-'); }
  function label(arr){ return arr.length?`{${arr.join(' ')}}`:'∅'; }

  let adjacency = new Map();

  function edgesFromSets(sets) {
    const edges = [];
    adjacency = new Map();
    for (const s of sets) {
      adjacency.set(key(s), { parents: new Set(), children: new Set(), set:s });
    }
    for (const s of sets) {
      for (const t of sets) {
        if (t.length === s.length + 1) {
          const isSubset = s.every(e => t.includes(e));
          if (isSubset) {
            edges.push([key(s), key(t)]);
            adjacency.get(key(s)).children.add(key(t));
            adjacency.get(key(t)).parents.add(key(s));
          }
        }
      }
    }
    return edges;
  }

  function layoutSets(sets, width=1400, height=900, top=60, bottom=40){
    const byLevel = new Map();
    let maxLevel = 0;
    for(const s of sets){
      const k = s.length;
      maxLevel = Math.max(maxLevel, k);
      if(!byLevel.has(k)) byLevel.set(k, []);
      byLevel.get(k).push(s);
    }
    const innerH = height - top - bottom;
    const stepY = (innerH / (maxLevel||1)) * 1.3;
    const pos = new Map();
    for(let k=0;k<=maxLevel;k++){
      const row = byLevel.get(k) || [];
      const n = row.length || 1;
      const stepX = width / (n+1);
      row.forEach((set, i)=>{
        const x = stepX*(i+1);
        const y = top + (maxLevel? k*stepY : innerH/2);
        pos.set(key(set), {x,y, level:k, set});
      });
    }
    return {pos, maxLevel};
  }

  const svg = document.getElementById('svg');
  function clearSVG(){ while(svg.firstChild) svg.removeChild(svg.firstChild); }

  function renderLattice(sets){
    clearSVG();
    const width = 1400, height = 900;
    const {pos, maxLevel} = layoutSets(sets, width, height);
    const edges = edgesFromSets(sets);

    // edges
    for(const [fromK,toK] of edges){
      const a = pos.get(fromK), b = pos.get(toK);
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', a.x);
      line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x);
      line.setAttribute('y2', b.y);
      line.setAttribute('data-from', fromK);
      line.setAttribute('data-to', toK);
      line.setAttribute('class','edge');
      line.setAttribute('data-from', fromK);
      line.setAttribute('data-to', toK);
      svg.appendChild(line);
    }

    // nodes
    for(const s of sets){
      const p = pos.get(key(s));
      const g = document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class', `node lvl-${p.level}`);
      g.setAttribute('data-key', key(p.set));
      g.setAttribute('transform', `translate(${p.x},${p.y})`);
      const r = Math.max(12, 18 - p.level*1.2);
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('r', r);
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.textContent = label(p.set);
      t.setAttribute('style','fill:#eaf2ff;font-size:15px;font-weight:600;font-family:ui-monospace,monospace;dominant-baseline:middle;text-anchor:middle;pointer-events:none;');
      g.appendChild(c); g.appendChild(t);

      // hover
      g.addEventListener('mouseenter', ()=>{
        for(const ln of svg.querySelectorAll('line.edge')){
          ln.classList.remove('hover');
          const [x1,y1,x2,y2] = ['x1','y1','x2','y2'].map(a=>+ln.getAttribute(a));
          if((Math.abs(x1-p.x)<0.5 && Math.abs(y1-p.y)<0.5) || (Math.abs(x2-p.x)<0.5 && Math.abs(y2-p.y)<0.5))
            ln.classList.add('hover');
        }
        c.setAttribute('r', r*1.3);
      });
      g.addEventListener('mouseleave', ()=>{
        for(const ln of svg.querySelectorAll('line.edge')) ln.classList.remove('hover');
        c.setAttribute('r', r);
      });

      // click selection intelligente
      g.addEventListener('click', e=>{
        e.stopPropagation();
        clearSelection();
        highlightByCommonElements(p.set);
      });

      svg.appendChild(g);
    }

    fitViewBox(svg);
  }

  function fitViewBox(svg) {
    const bbox = svg.getBBox();
    svg.setAttribute("viewBox", [
      bbox.x - 100, bbox.y - 100, bbox.width + 200, bbox.height + 200
    ].join(" "));
    viewBox = {x:bbox.x-100,y:bbox.y-100,w:bbox.width+200,h:bbox.height+200};
  }

  // zoom & pan
  let isPanning=false,start={x:0,y:0},viewBox={x:0,y:0,w:1400,h:900};
  svg.addEventListener('mousedown', e=>{isPanning=true;start={x:e.clientX,y:e.clientY};});
  svg.addEventListener('mouseup', ()=>isPanning=false);
  svg.addEventListener('mouseleave', ()=>isPanning=false);
  svg.addEventListener('mousemove', e=>{
    if(!isPanning)return;
    const dx=(e.clientX-start.x)*(viewBox.w/svg.clientWidth);
    const dy=(e.clientY-start.y)*(viewBox.h/svg.clientHeight);
    viewBox.x-=dx; viewBox.y-=dy;
    svg.setAttribute('viewBox',`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    start={x:e.clientX,y:e.clientY};
  });
  svg.addEventListener('wheel', e=>{
    e.preventDefault();
    const scale=e.deltaY>0?1.1:0.9;
    viewBox.w*=scale; viewBox.h*=scale;
    svg.setAttribute('viewBox',`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
  });
  svg.addEventListener('click', clearSelection);

  function clearSelection(){
    for(const n of svg.querySelectorAll('.node')) n.classList.remove('selected');
    for(const e of svg.querySelectorAll('.edge')) e.classList.remove('selected');
  }

  // 🔶 nouvelle logique de sélection intelligente
function highlightByCommonElements(selectedSet){
  const currentKey = key(selectedSet);
  const selectedKeys = new Set([currentKey]);
  const parentKeys = new Set();
  const childKeys = new Set();

  const currentInfo = adjacency.get(currentKey);
  if (!currentInfo) return;

  // --- 1️⃣ Ajouter récursivement tous les parents (jusqu'à la racine) ---
  function addParentsRecursively(k){
    const info = adjacency.get(k);
    if(!info) return;
    for(const parent of info.parents){
      if(!selectedKeys.has(parent)){
        selectedKeys.add(parent);
        parentKeys.add(parent);
        addParentsRecursively(parent); // monte récursivement
      }
    }
  }
  addParentsRecursively(currentKey);

  // --- 2️⃣ Ajouter récursivement tous les enfants (descendants) ---
  function addChildrenRecursively(k){
    const info = adjacency.get(k);
    if(!info) return;
    for(const child of info.children){
      if(!selectedKeys.has(child)){
        selectedKeys.add(child);
        childKeys.add(child);
        addChildrenRecursively(child); // descend récursivement
      }
    }
  }
  addChildrenRecursively(currentKey);

  // --- 3️⃣ Réinitialiser styles ---
  for(const n of svg.querySelectorAll('.node')) n.classList.remove('selected','parent','child');
  for(const e of svg.querySelectorAll('.edge')) e.classList.remove('selected','parent-edge','child-edge');

  // --- 4️⃣ Surligner les nœuds ---
  for(const k of selectedKeys){
    const g = svg.querySelector(`.node[data-key="${k}"]`);
    if(!g) continue;
    if(k === currentKey){
      g.classList.add('selected'); // nœud principal
    } else if(parentKeys.has(k)){
      g.classList.add('parent');
    } else if(childKeys.has(k)){
      g.classList.add('child');
    }
  }

  // --- 5️⃣ Surligner les arêtes ---
  for(const e of svg.querySelectorAll('.edge')){
    const f = e.getAttribute('data-from'), t = e.getAttribute('data-to');
    if(selectedKeys.has(f) && selectedKeys.has(t)){
      if(parentKeys.has(f) && selectedKeys.has(t))
        e.classList.add('parent-edge');
      else if(childKeys.has(t) && selectedKeys.has(f))
        e.classList.add('child-edge');
      else
        e.classList.add('selected');
    }
  }
}

  // renvoie tous les sous-ensembles de taille 1 et 2
  function getSubsets(set){
    const res=[];
    for(let i=0;i<set.length;i++) res.push([set[i]]);
    for(let i=0;i<set.length;i++)
      for(let j=i+1;j<set.length;j++)
        res.push([set[i],set[j]]);
    return res;
  }

  const datasetEl=document.getElementById('dataset');
  document.getElementById('btnSample')?.addEventListener('click', ()=>{
    datasetEl.value=`100: 1 3 4
200: 2 3 5
300: 1 2 3 5
400: 2 5`;
    build();
  });
  document.getElementById('btnBuild')?.addEventListener('click', build);

  function build(){
    const {items}=parseDataset(datasetEl.value);
    if(items.length===0){alert('Dataset invalide');return;}
    const sets=combinations(items);
    renderLattice(sets);
    renderItems(items);
  }
function renderItems(items){
  const wrap = document.getElementById('items');
  wrap.innerHTML = '';

  // 🟦 Affichage des items détectés
  const title = document.createElement('h4');
  title.textContent = 'Items détectés :';
  title.style.marginBottom = '8px';
  wrap.appendChild(title);

  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexWrap = 'wrap';
  list.style.gap = '8px';
  for (const it of items) {
    const el = document.createElement('div');
    el.className = 'tag';
    el.textContent = `{${it}}`;
    el.style.padding = '4px 8px';
    el.style.background = '#1a2b4c';
    el.style.borderRadius = '6px';
    el.style.color = '#eaf2ff';
    el.style.fontWeight = '600';
    list.appendChild(el);
  }
  wrap.appendChild(list);

  // 🧠 Calcul du nombre total d’itemsets
  const d = items.length;
  const total = Math.pow(2, d) - 1;

  const formula = document.createElement('div');
  formula.style.marginTop = '12px';
  formula.style.fontSize = '14px';
  formula.style.color = '#9fb8ff';
  formula.innerHTML = `
    <hr style="border:0;border-top:1px solid #223;">
    <div><b>d</b> = ${d} items distincts</div>
    <div style="margin-top:4px;">
      <b>Nombre total d’itemsets</b> = <br> 
      Σ<sub>k=1</sub><sup>${d}</sup> C(${d},k) = 2<sup>${d}</sup> − 1 = 
      <span style="color:#ffb347;font-weight:600;">${total}  <br> </span>
      <span style="color:#ffb347;font-weight:600;">Sans compter l'ensemble vide car On a -1 </span>
    </div>
  `;
  wrap.appendChild(formula);
}


let dernierItemsetFrequent = null;
document.getElementById('btnSupport')?.addEventListener('click', calculerSupport);
// 🔹 remplace l'ancienne variable dernierItemsetFrequent
let dernierNiveauFrequent = []; // [{itemset: [...], sup: n}, ...]
let kMax = 0;                   // taille des itemsets de Lk final

// 🧩 Normalisation des ensembles (corrige les ordres {B D C} vs {B C D})
function normalizeSet(arr) {
  return [...arr].sort((a, b) => a.localeCompare(b, 'fr'));
}

function key(arr) {
  return normalizeSet(arr).join('-');
}

// 💚 Coloration directe des derniers itemsets fréquents (sans descente récursive)
function colorFinalFrequentNodes(list) {
  for (const o of list) {
    const nodeKey = key(normalizeSet(o.itemset));
    const g = svg.querySelector(`.node[data-key="${nodeKey}"]`);
    if (g) {
      const c = g.querySelector('circle');
      if (c) {
        c.style.stroke = '#00e676';
        c.style.strokeWidth = '3px';
        c.style.filter = 'drop-shadow(0 0 8px #00e676cc)';
        c.style.opacity = '1';
      }
    }
  }
}

function calculerSupport() {
  console.log("---- Début calculerSupport (Apriori optimisé avec maxK) ----");

  // --- 🔹 Ajout DOM automatique pour le champ maxK ---
  let maxKInput = document.getElementById('maxK');
  if (!maxKInput) {
    const label = document.createElement('label');
    label.textContent = "Nombre max d’éléments (maxK): ";
    label.style.marginLeft = "12px";
    label.style.color = "#eaf2ff";

    maxKInput = document.createElement('input');
    maxKInput.type = "number";
    maxKInput.id = "maxK";
    maxKInput.value = 3; // valeur par défaut
    maxKInput.min = 1;
    maxKInput.style.width = "60px";
    maxKInput.style.marginLeft = "4px";
    maxKInput.style.background = "#19253f";
    maxKInput.style.border = "1px solid #335";
    maxKInput.style.color = "#fff";
    maxKInput.style.borderRadius = "6px";

    const minSupEl = document.getElementById('minSupport');
    if (minSupEl && minSupEl.parentNode) {
      minSupEl.parentNode.insertBefore(label, minSupEl.nextSibling);
      minSupEl.parentNode.insertBefore(maxKInput, label.nextSibling);
    } else {
      document.body.prepend(label, maxKInput);
    }
  }

  // --- 🔹 Récupération des paramètres ---
  const minSup = parseInt(document.getElementById('minSupport').value);
  const maxK = parseInt(document.getElementById('maxK').value);
  const { transactions, items } = parseDataset(datasetEl.value);
  const totalTrans = transactions.length;
  const allSets = combinations(items).filter(s => s.length > 0);

  const container = document.getElementById('apriori-steps');
  container.innerHTML = '';

  // --- 🔹 Reset visuel ---
  for (const n of svg.querySelectorAll('.node')) n.classList.remove('invalid', 'valid');
  for (const e of svg.querySelectorAll('.edge')) e.classList.remove('invalid-edge');

  let step = 1;
  let Ck = allSets.filter(s => s.length === step);
  let Lk = [];
  let dernierValide = [];

  // --- 🔁 Boucle principale ---
  while (Ck.length > 0 && step <= maxK) {
    const color = stepColors[(step - 1) % stepColors.length];

    // 🔹 Calcul du support
    const supports = Ck.map(s => {
      const supAbs = transactions.filter(t => s.every(x => t.items.includes(x))).length;
      const supRel = (supAbs / totalTrans).toFixed(2);
      return { itemset: s, sup: supAbs, supRel };
    });

    // --- Afficher Ck ---
    container.appendChild(renderTableWithStepColor(`C${step}`, supports, minSup, color));

    const valid = supports.filter(o => o.sup >= minSup);
    const invalid = supports.filter(o => o.sup < minSup);

    highlightSetsStepColor(invalid, color);

    // --- Afficher Lk ---
    if (valid.length > 0) {
      container.appendChild(renderTableWithStepColor(`L${step}`, valid, minSup, color, true));
      dernierValide = valid;
    }

    // --- Arrêt si maxK atteint ---
    if (step >= maxK) {
      console.log(`🛑 Arrêt : taille maximale ${maxK} atteinte.`);
      break;
    }

    // 🔹 Génération des candidats C(k+1)
    const nextItems = uniq(valid.flatMap(o => o.itemset));
    let next = combinations(nextItems).filter(s => s.length === step + 1);

    // ⚙️ Élagage (pruning)
    next = next.filter(candidate => {
      for (let i = 0; i < candidate.length; i++) {
        const subset = candidate.slice(0, i).concat(candidate.slice(i + 1));
        const isFrequent = valid.some(v =>
          v.itemset.length === subset.length &&
          subset.every(x => v.itemset.includes(x))
        );
        if (!isFrequent) return false;
      }
      return true;
    });

    if (next.length === 0) break;

    Ck = next;
    step++;
  }

  // --- 🔹 Résumé final ---
  if (dernierValide.length > 0) {
    dernierNiveauFrequent = dernierValide.slice();
    kMax = dernierValide[0].itemset.length;

    const summaryLines = dernierValide.map(o => `
      <div>• {${o.itemset.join(' ')}} → support = ${o.sup} / ${totalTrans} = ${(o.sup / totalTrans).toFixed(2)}</div>
    `).join('');

    const chips = dernierValide.map(o => `{${o.itemset.join(' ')}}`).join(', ');
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'final-summary';
    summaryDiv.innerHTML = `
      <h3>🧩 Résultat final Apriori</h3>
      <p><b>L<sub>${kMax}</sub> fréquent (${dernierValide.length} itemset${dernierValide.length > 1 ? 's' : ''}) :</b> ${chips}</p>
      <div style="margin-top:8px; font-size:14px; color:#9fb8ff;">${summaryLines}</div>
      <p style="margin-top:10px;">📊 <b>Total transactions :</b> ${totalTrans}</p>
      <p style="margin-top:6px; color:#aaa;">🔒 Limite maxK = ${maxK}</p>
    `;
    container.appendChild(summaryDiv);

    console.log("✅ Dernier niveau fréquent :", dernierNiveauFrequent);
    console.log("✅ Taille du dernier niveau (kMax) :", kMax);

    // 💚 Coloration directe des derniers itemsets fréquents
    colorFinalFrequentNodes(dernierNiveauFrequent);

  } else {
    // --- Aucun itemset fréquent ---
    dernierNiveauFrequent = [];
    kMax = 0;
    console.warn("⚠️ Aucun niveau fréquent trouvé (Lk vide).");

    const warnDiv = document.createElement('div');
    warnDiv.id = 'final-summary';
    warnDiv.style.background = '#3b1a1a';
    warnDiv.style.color = '#ffaaaa';
    warnDiv.style.padding = '10px';
    warnDiv.style.borderRadius = '6px';
    warnDiv.innerHTML = `
      ⚠️ <b>Aucun dernier niveau fréquent</b>.<br>
      Lance d’abord le calcul du support (Apriori).
    `;
    container.appendChild(warnDiv);
  }

  console.log("---- Fin calculerSupport ----");
}


console.log("Dernier itemset fréquent :", dernierItemsetFrequent);
console.log("Dernier itemset global :", dernierItemsetFrequent);
const stepColors = [
  '#ffb703', // jaune
  '#7b61ff', // violet
  '#e91e63', // rose
  '#00bcd4', // cyan
  '#8bc34a', // vert
  '#ff9800', // orange
  '#9c27b0'  // mauve
];


function renderTableWithStepColor(label, data, minSup, color, highlight=false) {
  const datasetEl=document.getElementById('dataset');
  const { transactions } = parseDataset(datasetEl.value);
  const table = document.createElement('table');
  const title = document.createElement('h4');
  title.innerHTML = `${label}`;
  title.style.color = color;
  table.innerHTML = `
    <tr><th>itemset</th><th>sup.</th></tr>
    ${data.map(d=>`<tr style="background:${d.sup < minSup ? color+'33' : '#1c3f28'};">
      <td>{${d.itemset.join(' ')}}</td>
      <td>${d.sup} / ${transactions.length} = ${(d.sup / transactions.length).toFixed(2)}</td>
    </tr>`).join('')}
  `;
  const wrapper = document.createElement('div');
  wrapper.appendChild(title);
  wrapper.appendChild(table);
  return wrapper;
}

function highlightSetsStepColor(list, color){
  for(const o of list){
    const k = key(o.itemset);
    colorNodeAndDescendants(k, color);
  }
}

function colorNodeAndDescendants(k, color){
  const g = svg.querySelector(`.node[data-key="${k}"]`);
  if(g){
    const c = g.querySelector('circle');
    if(c){
      c.style.stroke = color;
      c.style.strokeWidth = '3px';
      c.style.filter = `drop-shadow(0 0 5px ${color}aa)`;
      c.style.opacity = 0.9;
    }
  }
  const info = adjacency.get(k);
  if(!info) return;
  for(const child of info.children){
    colorNodeAndDescendants(child, color);
  }
}



function highlightSetsStepColor(list, color){
  for(const o of list){
    const k = key(o.itemset);
    colorNodeAndDescendants(k, color);
  }
}

function colorNodeAndDescendants(k, color){
  const g = svg.querySelector(`.node[data-key="${k}"]`);
  if(g){
    const c = g.querySelector('circle');
    if(c){
      c.style.stroke = color;
      c.style.strokeWidth = '3px';
      c.style.filter = `drop-shadow(0 0 5px ${color}aa)`;
      c.style.opacity = 0.9;
    }
  }

  // 🔹 Colorer les arêtes sortantes
  for (const e of svg.querySelectorAll('.edge')) {
    const f = e.getAttribute('data-from');
    const t = e.getAttribute('data-to');
    if (f === k) {
      e.style.stroke = color;
      e.style.strokeWidth = '2.2px';
      e.style.opacity = 0.8;
      e.style.filter = `drop-shadow(0 0 3px ${color}88)`;
    }
  }

  // 🔹 Descendants récursifs
  const info = adjacency.get(k);
  if(!info) return;
  for(const child of info.children){
    colorNodeAndDescendants(child, color);
  }
}
function calculerRegles() {
  const { transactions } = parseDataset(datasetEl.value);
  const minSup = parseInt(document.getElementById('minSupport').value, 10) || 2;

  if (!dernierNiveauFrequent.length) {
    alert("⚠️ Aucun dernier niveau fréquent. Lance d'abord le calcul du support (Apriori).");
    return;
  }

  const d = kMax;                                   // d = taille du dernier niveau
  const R = Math.pow(3, d) - Math.pow(2, d + 1) + 1;

  // 🔹 Générer des règles pour CHAQUE itemset du dernier Lk
  const rules = [];
  for (const { itemset, sup } of dernierNiveauFrequent) {
    const subsets = allNonEmptyProperSubsets(itemset);   // tous X non vides et ≠ itemset
    const supXY = sup / transactions.length;             // support du set complet (X∪Y = itemset)

    for (const X of subsets) {
      const Y = itemset.filter(v => !X.includes(v));
      if (Y.length === 0) continue;

      const supX = transactions.filter(t => X.every(x => t.items.includes(x))).length / transactions.length;
      const supY = transactions.filter(t => Y.every(y => t.items.includes(y))).length / transactions.length;

      const conf = supXY / supX;
      const lift = conf / supY; // amélioration

      rules.push({
        source: itemset.join(' '),        // pour savoir de quel Lk vient la règle
        X, Y,
        support: supXY.toFixed(2),
        confiance: conf.toFixed(2),
        freqY: supY.toFixed(2),
        amelioration: lift.toFixed(2)
      });
    }
  }

  // meilleure règle (optionnel)
  const best = rules.reduce((a,b)=> (+b.amelioration > +a.amelioration ? b : a), rules[0]);

  // --- Résumé
  const chips = dernierNiveauFrequent.map(o => `{${o.itemset.join(' ')}}`).join(' , ');
  const summary = `
    <p><b>d = ${d}</b> → taille du dernier itemset fréquent.</p>
    <p><b>R = 3<sup>${d}</sup> - 2<sup>${d+1}</sup> + 1 = ${R}</b> règles possibles (théorique pour d).</p>
    <p><b>L<sub>${d}</sub> fréquent :</b> ${chips}</p>
    <p><b>Min Support :</b> ${minSup}</p>
    <p><b>Règles générées :</b> ${rules.length}</p>
  `;
  document.getElementById('rules-summary').innerHTML = summary;

  // --- Tableau
  const tableHTML = `
    <table>
      <tr>
        <th>#</th>
        <th>Itemset source (L${d})</th>
        <th>Règle</th>
        <th>Support (s)</th>
        <th>Confiance (α)</th>
        <th>Fréq(Y)</th>
        <th>Amélioration</th>
      </tr>
      ${rules.map((r,i)=>`
        <tr ${r===best ? 'style="background:#1b2e1a;color:#b5ffb5;font-weight:600;"':''}>
          <td>${i+1}</td>
          <td>{${r.source}}</td>
          <td>{${r.X.join(' ')}} ⇒ {${r.Y.join(' ')}}</td>
          <td>${r.support}</td>
          <td>${r.confiance}</td>
          <td>${r.freqY}</td>
          <td>${r.amelioration}</td>
        </tr>
      `).join('')}
    </table>
  `;
  document.getElementById('rules-table').innerHTML = tableHTML;
}
function allNonEmptyProperSubsets(arr) {
  const res = [];
  const n = arr.length;
  for (let i = 1; i < (1 << n) - 1; i++) {
    const subset = [];
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) subset.push(arr[j]);
    }
    res.push(subset);
  }
  return res;
}
build();