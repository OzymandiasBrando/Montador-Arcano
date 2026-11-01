/* PROJECT: VONDRAG · Montador Arcano Simples v3.0
   HTML / CSS / JavaScript puros. Sem simulador.
   Regras confirmadas separadas de propostas ainda em teste.
*/
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shapeModes = {'Círculo':['Projétil','Área marcada'],'Quadrado':['Parede','Armazenamento'],'Triângulo':['Controle elemental','Foco em objeto']};
  const elements = ['Fogo','Água','Terra','Grama','Gelo','Raio'];
  const effects = {
    Fogo:['Dano','Combustão','Empurrão','Calor'],
    Água:['Cura Efeito','Fluidez','Pressão','Gelo'],
    Terra:['Defesa','Peso','Esmagamento','Armadilhas'],
    Grama:['Cura','Veneno','Raízes','Crescimento'],
    Gelo:['Congelamento','Redução de Velocidade','Fragilidade'],
    Raio:['Perfuração','Velocidade','Paralisia']
  };
  const diamondEffects = {...effects,Fogo:[...effects.Fogo,'Explosivo']};
  const elementColors = {Fogo:'#f2977a',Água:'#81c5f0',Terra:'#cdb087',Grama:'#9adaab',Gelo:'#b8e9fa',Raio:'#cfb2ff'};
  const shapeColors = ['#e7b96e','#85d3cb','#a7b5ff'];
  const fusions = [
    ['Fogo','Água','Incompatível',true,true,[]],
    ['Fogo','Raio','Plasma',false,true,['Perfuração','Queimadura','Descarga energética']],
    ['Fogo','Terra','Lava',false,false,['Queimadura','Derretimento','Terreno ardente']],
    ['Fogo','Grama','Fumaça',false,false,['Obscurecimento','Irritação','Calor']],
    ['Fogo','Gelo','Incompatível',true,false,[]],
    ['Água','Terra','Lama',false,false,['Aprisionamento','Lentidão','Terreno instável']],
    ['Água','Grama','Seiva Vital',false,false,['Cura','Crescimento acelerado']],
    ['Água','Gelo','Nevasca',false,false,['Congelamento','Lentidão','Obscurecimento']],
    ['Água','Raio','Corrente Elétrica',false,false,['Paralisia','Choque','Condução elétrica']],
    ['Terra','Grama','Espinhos de Pedra',false,false,['Perfuração','Armadilhas','Aprisionamento']],
    ['Terra','Gelo','Permafrost',false,false,['Congelamento','Proteção','Fragilidade']],
    ['Terra','Raio','Magnetismo',false,false,['Atração de metais','Repulsão de metais','Desarme']],
    ['Grama','Gelo','Vinhas Congelantes',false,false,['Aprisionamento','Congelamento']],
    ['Grama','Raio','Bioeletricidade',false,false,['Paralisia','Estímulo']],
    ['Gelo','Raio','Tempestade Glacial',false,false,['Congelamento','Choque','Paralisia']]
  ];
  const timed = new Set(['Combustão','Queimadura','Veneno','Raízes','Congelamento','Redução de Velocidade','Fragilidade','Paralisia','Aprisionamento','Lentidão','Obscurecimento','Terreno ardente','Crescimento acelerado','Irritação']);
  const support = new Set(['Cura','Cura Efeito','Fluidez','Calor','Defesa','Crescimento','Velocidade','Recuperação','Proteção','Estímulo','Obscurecimento','Atração de metais','Repulsão de metais','Desarme','Armadilhas','Terreno instável']);
  const v3Key = 'vondrag.arcano.simples.grimorio.v3';
  const v3Draft = 'vondrag.arcano.simples.rascunho.v3';
  const legacyKey = 'vondrag.arcano.grimorio.v1';
  const legacyDraft = 'vondrag.arcano.rascunho.v1';
  let count = 0;
  let toastTimer;
  const uid = () => 'v' + Date.now().toString(36) + '-' + (++count).toString(36);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const capNum = (x,lo,hi,def=lo) => {let n=Number(x);return Number.isFinite(n)?Math.max(lo,Math.min(hi,Math.trunc(n))):def};
  const isManifest = l => (l.shape==='Círculo' && ['Projétil','Área marcada'].includes(l.mode)) || (l.shape==='Quadrado' && l.mode==='Parede');
  const defaultLayer = (shape='Círculo',mode='Projétil',element='Fogo',effect='auto') => ({id:uid(),shape,mode,element,effect,secondary:'Nenhum',diamond:'Nenhuma',stars:0,hexagons:0,rings:0,target:'Nenhum',trigger:'Toque ou quebra',focus:''});
  const defaultFormula = () => ({tier:1,name:'',offensive:true,layers:[defaultLayer()],activeId:null});
  function fusionOf(l) {return l.secondary==='Nenhum'?null:fusions.find(f=>(f[0]===l.element&&f[1]===l.secondary)||(f[1]===l.element&&f[0]===l.secondary))||null}
  function material(l) {return fusionOf(l)?.[2]||l.element}
  function propertyOptions(l) {const f=fusionOf(l);return f&&!f[3]?f[5]:effects[l.element]}
  function property(l) {if(l.secondary==='Nenhum'&&l.diamond!=='Nenhuma')return l.diamond;const opts=propertyOptions(l);return opts.includes(l.effect)?l.effect:opts[0]||'Efeito indisponível'}
  function normalizeLayer(raw) {
    const l=defaultLayer();if(!raw||typeof raw!=='object')return l;
    l.id=typeof raw.id==='string'&&raw.id.length<100?raw.id:l.id;
    l.shape=Object.keys(shapeModes).includes(raw.shape)?raw.shape:'Círculo';
    l.mode=shapeModes[l.shape].includes(raw.mode)?raw.mode:shapeModes[l.shape][0];
    l.element=elements.includes(raw.element)?raw.element:'Fogo';
    l.secondary=elements.includes(raw.secondary)&&raw.secondary!==l.element?raw.secondary:'Nenhum';
    l.effect=typeof raw.effect==='string'&&raw.effect.length<90?raw.effect:'auto';
    l.diamond=l.secondary==='Nenhum'&&diamondEffects[l.element].includes(raw.diamond)?raw.diamond:'Nenhuma';
    l.stars=capNum(raw.stars,0,12,0);l.hexagons=capNum(raw.hexagons,0,12,0);l.rings=capNum(raw.rings,0,8,0);
    l.target=typeof raw.target==='string'&&raw.target.length<100?raw.target:'Nenhum';
    l.trigger=['Toque','Quebra','Toque ou quebra'].includes(raw.trigger)?raw.trigger:'Toque ou quebra';
    l.focus=String(raw.focus??'').slice(0,100);return l;
  }
  function normalizeFormula(raw) {
    const fallback=defaultFormula();if(!raw||typeof raw!=='object'||!Array.isArray(raw.layers))return fallback;
    const tier=[1,2,3].includes(Number(raw.tier))?Number(raw.tier):1;
    const layers=raw.layers.slice(0,tier).map(normalizeLayer);
    if(layers.length===0)layers.push(defaultLayer());
    const seen=new Set();for(const l of layers){if(seen.has(l.id))l.id=uid();seen.add(l.id)}
    return {tier,layers,name:String(raw.name??'').slice(0,90),offensive:raw.offensive!==false,activeId:null};
  }
  const read = k => {try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  function getBook() {
    const own=read(v3Key),from=Array.isArray(own)?own:read(legacyKey);
    if(!Array.isArray(from))return [];
    return from.slice(0,250).filter(x=>x&&typeof x==='object'&&Array.isArray(x.formula?.layers)).map(x=>({id:String(x.id||uid()),date:String(x.date||x.savedAt||''),formula:normalizeFormula(x.formula)}));
  }
  let state=normalizeFormula(read(v3Draft)||read(legacyDraft)||defaultFormula());
  let book=getBook();
  let search='';let tierFilter='all';let view='montador';let advancedId=null;
  function persist(){try{localStorage.setItem(v3Draft,JSON.stringify(state));localStorage.setItem(v3Key,JSON.stringify(book))}catch{}}
  function notify(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200)}
  function opt(value,label,selected){return `<option value="${esc(value)}" ${selected===value?'selected':''}>${esc(label)}</option>`}
  function opts(arr,chosen){return arr.map(x=>Array.isArray(x)?opt(x[0],x[1],chosen):opt(x,x,chosen)).join('')}
  function shapeIcon(s){return `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.3" aria-hidden="true">${s==='Círculo'?'<circle cx="20" cy="20" r="14"/>':s==='Quadrado'?'<rect x="8" y="8" width="24" height="24"/>':'<path d="M20 6 35 33H5Z" stroke-linejoin="round"/>'}</svg>`}
  function modCount(){return state.layers.reduce((a,l)=>a+l.stars+l.hexagons+(l.secondary==='Nenhum'&&l.diamond!=='Nenhuma'?1:0),0)}
  function supportsStars(l){return timed.has(property(l))}
  function supportsHexagons(l){return l.mode==='Parede'||l.mode==='Área marcada'}
  function clearIncompatibleModifiers(l){
    let count=0;
    if(!supportsStars(l)&&l.stars>0){l.stars=0;count++}
    if(!supportsHexagons(l)&&l.hexagons>0){l.hexagons=0;count++}
    if(l.secondary!=='Nenhum'&&l.diamond!=='Nenhuma'){l.diamond='Nenhuma';count++}
    return count;
  }
  function clearAllModifiers(){state.layers.forEach(l=>{l.stars=0;l.hexagons=0;l.diamond='Nenhuma'});refresh();notify('Todos os aprimoramentos foram removidos.');}
  function reduceMods(){let extra=modCount()-state.tier*4;for(let i=state.layers.length-1;i>=0&&extra>0;i--){const l=state.layers[i];let v=Math.min(extra,l.hexagons);l.hexagons-=v;extra-=v;v=Math.min(extra,l.stars);l.stars-=v;extra-=v;if(extra>0&&l.diamond!=='Nenhuma'){l.diamond='Nenhuma';extra--}}}
  function analyze(formula=state){
    const indexed=formula.layers.map((l,i)=>({l,i}));const manifests=indexed.filter(x=>isManifest(x.l));
    const stores=indexed.filter(x=>x.l.shape==='Quadrado'&&x.l.mode==='Armazenamento').map(s=>{
      const holder=manifests.filter(x=>x.i<s.i).at(-1)||null;
      const trigger=!holder?'Ainda não definido':holder.l.mode==='Projétil'?'Impacto':holder.l.mode==='Parede'?s.l.trigger:'Ainda não definido';
      return {...s,holder,trigger,duration:timed.has(property(s.l))?1+s.l.stars:null};
    });
    const controls=indexed.filter(x=>x.l.shape==='Triângulo'&&x.l.mode==='Controle elemental').map(t=>{
      const target=manifests.find(m=>m.l.id===t.l.target)||null;
      const status=!target?'sem-alvo':material(target.l)!==material(t.l)?'divergente':fusionOf(t.l)||fusionOf(target.l)?'fusao-pendente':'válido';
      return {...t,target,status};
    });
    const errors=[],warnings=[];
    if(formula.layers.length>formula.tier)errors.push('O Tier escolhido não permite tantas camadas.');
    const count=formula.layers.reduce((n,l)=>n+l.stars+l.hexagons+(l.secondary==='Nenhum'&&l.diamond!=='Nenhuma'?1:0),0);
    if(count>formula.tier*4)errors.push('A fórmula ultrapassou o limite de aprimoramentos.');
    for(const x of indexed){const f=fusionOf(x.l);if(f?.[3]&&f[4])errors.push(`Camada ${x.i+1}: Fogo e Água não podem ser fundidos.`);if(f&&!f[4])warnings.push(`Camada ${x.i+1}: a fusão ${f[2]} ainda é uma proposta em teste.`);if(x.l.diamond!=='Nenhuma'&&x.l.secondary!=='Nenhum')errors.push(`Camada ${x.i+1}: Diamante não modifica fusões.`);if(x.l.stars>0&&!timed.has(property(x.l)))warnings.push(`Camada ${x.i+1}: duração de Estrela não se aplica automaticamente a ${property(x.l)}.`);if(x.l.hexagons>0&&!['Parede','Área marcada'].includes(x.l.mode))warnings.push(`Camada ${x.i+1}: Hexágono fora de estrutura/campo exige interpretação.`)}
    for(const t of controls){if(t.status==='sem-alvo')errors.push(`Triângulo na camada ${t.i+1}: escolha a manifestação que deseja controlar.`);if(t.status==='divergente')errors.push(`Triângulo na camada ${t.i+1}: o elemento precisa ser igual ao da manifestação.`);if(t.status==='fusao-pendente')warnings.push(`Triângulo na camada ${t.i+1}: representação de controle de fusão ainda não definida.`)}
    for(const s of stores){if(!s.holder)warnings.push(`Quadrado na camada ${s.i+1}: armazenamento sem portador ou gatilho definido.`);if(s.trigger==='Ainda não definido')warnings.push(`Camada ${s.i+1}: ativação desta manifestação ainda não foi definida.`);if(property(s.l)==='Dano')errors.push(`Camada ${s.i+1}: o efeito armazenado deve aplicar uma propriedade, não dano direto adicional.`)}
    if(stores.length>1)warnings.push('Armazenamentos em cadeia ainda precisam de regras específicas.');
    const main=manifests.find(m=>m.l.mode==='Projétil')||null;
    const direct=formula.offensive&&main&&!support.has(property(main.l))&&!errors.some(e=>e.includes('Fogo e Água'))?2*formula.tier+1+(fusionOf(main.l)&&!fusionOf(main.l)[3]?1:0):0;
    const name=formula.name.trim()||(manifests[0]?`${manifests[0].l.mode==='Parede'?'Parede':manifests[0].l.mode==='Projétil'?'Projétil':'Magia'} de ${material(manifests[0].l)}`:`Desenho de ${material(formula.layers[0])}`);
    const lines=[];const first=formula.layers[0];
    if(first.shape==='Círculo')lines.push(`O Círculo cria ${first.mode==='Projétil'?'um projétil':'uma área marcada'} de ${material(first)}.`);
    else if(first.shape==='Quadrado')lines.push(`O Quadrado cria ${first.mode==='Parede'?'uma parede':'um armazenamento'} de ${material(first)}.`);
    else lines.push(`O Triângulo usa ${material(first)} para ${first.mode==='Controle elemental'?'controle elemental':'focalizar magia em um objeto visível'}.`);
    for(const s of stores){if(s.holder){lines.push(`O Quadrado guarda ${property(s.l)} de ${material(s.l)} ${s.holder.l.mode==='Projétil'?'no':'na'} ${s.holder.l.mode.toLowerCase()} de ${material(s.holder.l)}. ${s.holder.l.mode==='Parede'?'A parede reaplica o efeito quando o gatilho ocorre, enquanto existir.':s.holder.l.mode==='Projétil'?'O efeito é liberado ao atingir o alvo.':'A ativação ainda não foi definida.'}`)}else lines.push(`Há um armazenamento de ${material(s.l)} sem portador especificado.`)}
    for(const t of controls){if(t.status==='válido')lines.push(`O Triângulo de ${material(t.l)} controla a manifestação de mesmo elemento da camada ${t.target.i+1}.`);else if(t.status==='divergente')lines.push(`O Triângulo de ${material(t.l)} não controla ${material(t.target.l)}: os elementos são diferentes.`)}
    for(const x of indexed.filter(x=>x.i>0&&x.l.shape==='Triângulo'&&x.l.mode==='Foco em objeto'))lines.push(`O Triângulo da camada ${x.i+1} focaliza ${material(x.l)} em um objeto visível${x.l.focus?' ('+x.l.focus+')':''}, respeitando o alcance do Tier.`);
    for(let i=1;i<formula.layers.length;i++){const out=formula.layers[i-1],inside=formula.layers[i];if((inside.shape==='Quadrado'&&inside.mode==='Armazenamento')||(inside.shape==='Triângulo'&&inside.mode==='Controle elemental'))continue;const key=out.shape+'>'+inside.shape;const names={'Quadrado>Círculo':'A estrutura pode servir como disparadora de uma projeção.','Círculo>Círculo':'Projeções encadeadas precisam de interpretação para cada etapa, sem dano adicional automático.','Triângulo>Círculo':'A combinação admite uma projeção remota dentro do alcance do Triângulo.','Triângulo>Quadrado':'O Triângulo pode focalizar magia em objeto visível, mantendo a função do Quadrado.','Triângulo>Triângulo':'A repetição de controle depende de uma função específica e não aumenta alcance automaticamente.','Quadrado>Quadrado':'Duas estruturas encadeadas não criam automaticamente mais efeitos.','Círculo>Quadrado':'Uma projeção pode transportar uma estrutura interna.','Círculo>Triângulo':'O Triângulo pode orientar a projeção se os elementos forem iguais.','Quadrado>Triângulo':'O Triângulo pode controlar uma parede se os elementos forem iguais.'};if(names[key])lines.push(names[key])}
    const fMain=fusionOf(first);if(fMain&&!fMain[3])lines.push(`A camada principal é uma fusão: ${first.element} + ${first.secondary} formam ${fMain[2]}.`);
    return {indexed,manifests,stores,controls,errors,warnings,name,lines,direct,mods:count};
  }
  function changeTier(newTier){newTier=capNum(newTier,1,3,1);state.tier=newTier;state.layers=state.layers.slice(0,newTier);if(!state.layers.some(l=>l.id===state.activeId))state.activeId=null;reduceMods();refresh()}
  function updateLayer(id,patch){const l=state.layers.find(x=>x.id===id);if(!l)return;Object.assign(l,patch);clearIncompatibleModifiers(l);reduceMods();refresh()}
  function addLayer(kind){if(state.layers.length>=3){notify('Limite de três camadas atingido.');return}const main=state.layers[0];let l;
    if(kind==='store')l=defaultLayer('Quadrado','Armazenamento','Raio','Paralisia');
    else if(kind==='control'){l=defaultLayer('Triângulo','Controle elemental',main.element,'auto');l.secondary=main.secondary;l.target=isManifest(main)?main.id:'Nenhum'}
    else l=defaultLayer('Quadrado','Parede','Terra','Defesa');
    if(state.tier<state.layers.length+1)state.tier=state.layers.length+1;
    state.layers.push(l);state.activeId=l.id;refresh();notify('Nova função adicionada. Escolha os detalhes da camada.')
  }
  function moveLayer(id,delta){const i=state.layers.findIndex(l=>l.id===id),j=i+delta;if(i<0||j<0||j>=state.layers.length)return;[state.layers[i],state.layers[j]]=[state.layers[j],state.layers[i]];refresh()}
  function removeLayer(id){const i=state.layers.findIndex(x=>x.id===id);if(i<=0){notify('A fórmula precisa ter uma forma principal.');return}state.layers.splice(i,1);state.activeId=null;refresh()}
  function renderBuilder(){
    $('#tier-select').innerHTML=[1,2,3].map(t=>`<button type="button" class="tier-btn ${state.tier===t?'active':''}" data-tier="${t}">Tier ${t}</button>`).join('');
    $('#spell-name').value=state.name;
    const main=state.layers[0];
    $('#main-shapes').innerHTML=Object.keys(shapeModes).map(s=>`<button type="button" class="shape-btn ${main.shape===s?'active':''}" data-main-shape="${esc(s)}">${shapeIcon(s)}<span>${esc(s)}</span></button>`).join('');
    $('#main-mode').innerHTML=opts(shapeModes[main.shape],main.mode);
    $('#main-element').innerHTML=opts(elements,main.element);
    $('#main-effect').innerHTML=opts(propertyOptions(main).map(e=>[e,e]),main.effect==='auto'||!propertyOptions(main).includes(main.effect)?propertyOptions(main)[0]:main.effect);
    const remaining=3-state.layers.length;
    $('#quick-actions').innerHTML=[['store','Guardar efeito','Paralisia, Veneno, Raízes…'],['control','Controlar','Guiar ou mover a magia'],['shape','Outra forma','Montagem mais avançada']].map(x=>`<button type="button" class="quick-btn" data-add="${x[0]}" ${remaining<=0?'disabled':''}><strong><span class="plus">+</span> ${x[1]}</strong><small>${x[2]}</small></button>`).join('');
    $('#layer-list').innerHTML=state.layers.map((l,i)=>`<div class="layer-strip ${state.activeId===l.id?'active':''}"><span class="layer-icon">${shapeIcon(l.shape)}</span><button class="layer-summary" data-layer="${esc(l.id)}" type="button"><strong>${i===0?'Principal':`Camada ${i+1}`} · ${esc(l.shape)} ${state.activeId===l.id?'✎':''}</strong><small>${esc(l.mode)} · ${esc(material(l))} ${l.secondary!=='Nenhum'?'(fusão)':''}</small></button><div class="layer-actions"><button class="icon-btn" data-move="-1" data-id="${esc(l.id)}" title="Mover para fora" aria-label="Mover para fora" ${i===0?'disabled':''}>↑</button><button class="icon-btn" data-move="1" data-id="${esc(l.id)}" title="Mover para dentro" aria-label="Mover para dentro" ${i===state.layers.length-1?'disabled':''}>↓</button>${i>0?`<button class="icon-btn" data-remove="${esc(l.id)}" title="Remover" aria-label="Remover">×</button>`:''}</div></div>`).join('');
    const l=state.layers.find(x=>x.id===state.activeId);
    if(l) {
      const i=state.layers.indexOf(l),isPrimary=i===0;
      const manifestOptions=state.layers.filter(x=>isManifest(x)&&x.id!==l.id);
      const f=fusionOf(l);
      $('#layer-editor').innerHTML=`<div class="layer-editor" data-edit-id="${esc(l.id)}"><div class="layer-editor-head"><h3>Editar ${isPrimary?'forma principal':`camada ${i+1}`}</h3><button class="btn ghost" data-close-editor type="button" style="min-height:32px;padding:7px 11px">Fechar ×</button></div><div class="two-fields"><div class="field"><label>Forma</label><select class="select" data-layer-field="shape">${opts(Object.keys(shapeModes),l.shape)}</select></div><div class="field"><label>Função</label><select class="select" data-layer-field="mode">${opts(shapeModes[l.shape],l.mode)}</select></div></div><div class="two-fields"><div class="field"><label>Elemento da camada</label><select class="select" data-layer-field="element">${opts(elements,l.element)}</select></div><div class="field"><label>Propriedade</label><select class="select" data-layer-field="effect">${opts(propertyOptions(l),l.effect==='auto'||!propertyOptions(l).includes(l.effect)?propertyOptions(l)[0]:l.effect)}</select></div></div>${l.shape==='Quadrado'&&l.mode==='Armazenamento'?`<p class="help-text">O armazenamento aplica o efeito do elemento, mas não causa dano adicional.</p>`:''}${l.shape==='Quadrado'&&l.mode==='Armazenamento'?`<div class="field" style="margin-top:13px"><label>Ativação quando estiver em uma parede</label><select class="select" data-layer-field="trigger">${opts(['Toque','Quebra','Toque ou quebra'],l.trigger)}</select></div>`:''}${l.shape==='Triângulo'&&l.mode==='Controle elemental'?`<div class="field"><label>Qual manifestação será controlada?</label><select class="select" data-layer-field="target">${opts([['Nenhum','Escolha uma forma'],...manifestOptions.map(m=>[m.id,`${m.mode} de ${material(m)}`])],l.target)}</select><p class="help-text">O elemento deve ser exatamente o mesmo da manifestação escolhida.</p></div>`:''}${l.shape==='Triângulo'&&l.mode==='Foco em objeto'?`<div class="field"><label>Objeto visível (opcional)</label><input class="input" data-layer-field="focus" maxlength="100" value="${esc(l.focus)}" placeholder="Ex.: arma na mão" /></div>`:''}${l.shape==='Círculo'?`<div class="field"><label>Círculos extras para ampliar escala (3 m + 2 m por círculo)</label><input type="number" min="0" max="8" class="number-input" data-layer-field="rings" value="${l.rings}" /></div>`:''}${l.shape==='Círculo'&&l.mode==='Projétil'&&isPrimary?`<div class="field"><label><input type="checkbox" data-layer-field="offensive" ${state.offensive?'checked':''}> Projétil causa dano direto</label></div>`:''}<details class="editor-extra" ${advancedId===l.id?'open':''}><summary>Fusão e Diamante (avançado) <span>⌄</span></summary><div class="field"><label>Fundir outro elemento nesta camada</label><select class="select" data-layer-field="secondary">${opts([['Nenhum','Sem fusão'],...elements.filter(x=>x!==l.element).map(x=>[x,x])],l.secondary)}</select><p class="help-text">Fusão mistura os elementos na mesma camada. Em camadas separadas, eles continuam diferentes.</p></div>${f?`<p class="notice ${f[3]&&f[4]?'bad':''}">${esc(f[2])} · ${f[4]?'Regra confirmada':'Proposta em teste'}</p>`:''}<div class="field"><label>Diamante — variação de elemento puro</label><select class="select" data-layer-field="diamond" ${l.secondary!=='Nenhum'?'disabled':''}>${opts([['Nenhuma','Sem Diamante'],...diamondEffects[l.element].map(x=>[x,x])],l.diamond)}</select></div></details></div>`;
    } else $('#layer-editor').innerHTML='';
    const used=modCount(),limit=state.tier*4;
    $('#modifiers-area').innerHTML=state.layers.map((l,i)=>{
      const cond=supportsStars(l),canHex=supportsHexagons(l);
      const any=l.stars+l.hexagons+(l.diamond!=='Nenhuma'?1:0)>0;
      return `<div class="modifier-card"><div class="modifier-top"><div><strong>${i===0?'Forma principal':`Camada ${i+1}`} · ${esc(material(l))}</strong><small>${esc(l.mode)}${cond?' · condição temporária':''}</small></div><span class="tag">${esc(l.shape)}</span></div><div class="modifier-controls"><div><strong>✦ Estrelas</strong><div class="help-text">${cond?'Duração da condição: 1 + Estrelas':l.stars>0?'Incompatível agora. Defina 0 para remover.':'A propriedade atual não recebe Estrelas'}</div></div><input class="number-input" type="number" min="0" max="${limit}" data-mod="stars" data-id="${esc(l.id)}" value="${l.stars}" ${!cond&&l.stars===0?'disabled':''} aria-label="Estrelas da camada ${i+1}"></div><div class="modifier-controls" style="margin-top:11px"><div><strong>⬡ Hexágonos</strong><div class="help-text">${canHex?'Permanência: 2 + Hexágonos':l.hexagons>0?'Incompatível agora. Defina 0 para remover.':'Disponível apenas para parede ou área'}</div></div><input class="number-input" type="number" min="0" max="${limit}" data-mod="hexagons" data-id="${esc(l.id)}" value="${l.hexagons}" ${!canHex&&l.hexagons===0?'disabled':''} aria-label="Hexágonos da camada ${i+1}"></div>${any?`<button type="button" class="clear-layer-mods" data-clear-mods="${esc(l.id)}">× Remover aprimoramentos desta camada</button>`:''}</div>`;
    }).join('')+`<div class="remaining ${used>limit?'warning':''}"><span>Aprimoramentos usados</span><strong>${used} / ${limit}</strong>${used>0?'<button type="button" class="btn ghost clear-all-mods" data-clear-all-mods="1">Limpar todos</button>':''}</div>`;
  }

  function geometrySVG(formula=state,{size=320}={}){
    const sizeNumber=capNum(size,120,1000,320);
    const parts=[];
    const iconStar=(x,y,c)=>`<path d="M${x} ${y-7} l2.2 4.5 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7Z" fill="${c}" stroke="${c}" stroke-width=".5"/>`;
    const iconHex=(x,y,c)=>`<polygon points="${x-5.5},${y-3.1} ${x},${y-6.2} ${x+5.5},${y-3.1} ${x+5.5},${y+3.1} ${x},${y+6.2} ${x-5.5},${y+3.1}" fill="${c}" fill-opacity=".09" stroke="${c}" stroke-width="1.8"/>`;
    const iconDiamond=(x,y,c)=>`<path d="M${x} ${y-7} L${x+6} ${y} ${x} ${y+7} ${x-6} ${y}Z" stroke="${c}" stroke-width="2" fill="${c}" fill-opacity=".23"/>`;
    const baseRadii=[103,69,36];
    formula.layers.forEach((l,i)=>{
      const r=baseRadii[i],c=shapeColors[i];
      let path='';
      if(l.shape==='Círculo')path=`<circle cx="160" cy="160" r="${r}" fill="none" stroke="${c}" stroke-width="3.5"/>`;
      else if(l.shape==='Quadrado'){const side=r*1.45;path=`<rect x="${160-side/2}" y="${160-side/2}" width="${side}" height="${side}" rx="2" stroke="${c}" stroke-width="3.5" fill="none"/>`}
      else path=`<path d="M160 ${160-r} L${160+r*.87} ${160+r*.53} L${160-r*.87} ${160+r*.53}Z" stroke="${c}" stroke-width="3.5" fill="none" stroke-linejoin="round"/>`;
      if(l.rings>0&&l.shape==='Círculo'){
        const upper=[137,105,83][i];const gap=(upper-r-3)/(Math.max(1,l.rings));
        for(let j=1;j<=l.rings;j++){const out=(r+3+gap*j).toFixed(2);path+=`<circle cx="160" cy="160" r="${out}" fill="none" stroke="${c}" stroke-width="1.15" stroke-dasharray="2 6" opacity=".65" data-scale-ring="${i+1}"/>`}
      }
      parts.push(`<g data-form-layer="${i+1}">${path}</g>`);
    });
    // Orbitais separados por camada; cada símbolo tem seu espaço e é desenhado, não abreviado.
    formula.layers.forEach((l,i)=>{
      const c=shapeColors[i],radius=[134,112,88][i];
      const icons=[];
      if(l.secondary==='Nenhum'&&l.diamond!=='Nenhuma')icons.push('diamond');
      for(let j=0;j<l.stars;j++)icons.push('star');
      for(let j=0;j<l.hexagons;j++)icons.push('hex');
      // Renderizar cada símbolo, inclusive valores antigos importados.
      const visible=icons;
      const glyphs=visible.map((kind,j)=>{
        const a=(-Math.PI/2)+(j*2*Math.PI/visible.length);
        const x=160+Math.cos(a)*radius,y=160+Math.sin(a)*radius;
        const inner=kind==='star'?iconStar(x,y,c):kind==='hex'?iconHex(x,y,c):iconDiamond(x,y,c);
        return `<g data-modifier="${kind}" data-modifier-layer="${i+1}"><title>Camada ${i+1}: ${kind==='star'?'Estrela':kind==='hex'?'Hexágono':'Diamante'} ${j+1} de ${visible.length}</title>${inner}</g>`;
      }).join('');
      parts.push(`<g class="sigil-modifiers">${glyphs}</g>`);
    });
    const desc=formula.layers.map((l,i)=>`Camada ${i+1}: ${l.shape}; ${l.stars} Estrelas; ${l.hexagons} Hexágonos; ${l.diamond==='Nenhuma'?0:1} Diamante`).join('. ');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="${sizeNumber}" height="${sizeNumber}" role="img" aria-label="${esc(desc)}"><defs><filter id="vondrag-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="160" cy="160" r="143" stroke="#d7b483" stroke-opacity=".23" stroke-width="1" stroke-dasharray="2 8" fill="none"/><circle cx="160" cy="160" r="130" stroke="#a2cad2" stroke-opacity=".12" fill="none"/><path d="M160 10v18 M160 292v18 M10 160h18 M292 160h18" stroke="#e8bf82" stroke-opacity=".48" stroke-width="2"/><g>${parts.join('')}</g><circle cx="160" cy="160" r="3.2" fill="#eace9b"/></svg>`;
  }

  function renderPreview(a){
    const svg=geometrySVG(state);$('#magic-preview').innerHTML=svg;
    $('#preview-legend').innerHTML=state.layers.map((l,i)=>`<span class="legend-chip"><b style="color:${shapeColors[i]}">●</b> ${esc(l.shape)} · ${esc(material(l))}</span>`).join('');
    $('#preview-name').textContent=a.name;
    $('#preview-desc').textContent=a.lines[0]||'Sua magia aparece aqui.';
    const wall=a.manifests.find(m=>m.l.mode==='Parede');
    const cond=a.stores.find(s=>s.duration!==null);
    $('#preview-metrics').innerHTML=[['Tier',String(state.tier)],['Camadas',state.layers.length+' / '+state.tier],['Estrutura',wall?`${2+wall.l.hexagons} turnos`:'—'],['Efeito guardado',cond?`${cond.duration} turno(s)`:'—']].map(x=>`<div class="preview-metric"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join('');
  }
  function renderResult(a){
    const main=a.manifests.find(m=>m.l.mode==='Projétil');
    const primary=state.layers[0];
    const wall=a.manifests.find(m=>m.l.mode==='Parede');
    const heading=(title,html)=>`<section class="result-section"><h4>${title}</h4>${html}</section>`;
    const row=(label,value)=>`<div class="result-detail"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
    const layerCards=state.layers.map((l,i)=>{
      const f=fusionOf(l);const mode=esc(l.mode);const hasCondition=timed.has(property(l));
      const values=[row('Elemento',l.secondary==='Nenhum'?l.element:`${l.element} + ${l.secondary} → ${material(l)}${f&&!f[4]?' (em teste)':''}`),row('Propriedade',property(l)),row('Estrelas',`${l.stars}${hasCondition?` · efeito: ${1+l.stars} turno(s)`:l.stars?' · não aplicável':''}`),row('Hexágonos',`${l.hexagons}${l.mode==='Parede'?` · estrutura: ${2+l.hexagons} turno(s)`:l.mode==='Área marcada'?` · campo: +${l.hexagons} turno(s)`:l.hexagons?' · não aplicável':''}`),row('Diamante',l.secondary==='Nenhum'?l.diamond:'Não disponível em fusão')];
      if(l.shape==='Círculo')values.push(row('Escala do Círculo',`${3+2*l.rings} m (3 + ${l.rings} × 2)`));
      if(l.shape==='Triângulo'){values.push(row('Alcance',`${4+2*state.tier} m`));if(l.mode==='Controle elemental')values.push(row('Alvo do controle',state.layers.some(x=>x.id===l.target)?`Camada ${state.layers.findIndex(x=>x.id===l.target)+1}: ${state.layers.find(x=>x.id===l.target).mode} de ${material(state.layers.find(x=>x.id===l.target))}`:'Não definido'));if(l.mode==='Foco em objeto'&&l.focus)values.push(row('Objeto visível',l.focus))}
      if(l.mode==='Armazenamento'){const s=a.stores.find(s=>s.l.id===l.id);values.push(row('Ativação',s?.trigger||'A definir'));values.push(row('Dano do efeito guardado','0 Tokens'));if(s?.holder?.l.mode==='Parede')values.push(row('Reaplicação','Contínua enquanto a parede existir'))}
      return `<div class="result-layer"><div class="result-layer-head"><b><span class="result-layer-dot" style="background:${shapeColors[i]}"></span>Camada ${i+1} · ${esc(l.shape)}</b><small>${mode}</small></div><div class="result-details">${values.join('')}</div></div>`;
    }).join('');
    const highlights=[row('Tier',String(state.tier)),row('Camadas',`${state.layers.length} de ${state.tier}`),row('Aprimoramentos',`${a.mods} de ${4*state.tier}`),row('Elemento principal',material(primary))];
    if(main)highlights.push(row('Dano direto (em teste)',`${a.direct} Tokens`));
    if(wall)highlights.push(row('Permanência da parede',`${2+wall.l.hexagons} turno(s)`));
    if(a.stores.length)highlights.push(row('Dano adicional armazenado','0 Tokens'));
    const controls=a.controls.length?heading('Controle elemental',a.controls.map(t=>`<div class="result-detail"><span>Triângulo da camada ${t.i+1}</span><strong>${esc(t.status==='válido'?'Vínculo válido':t.status==='sem-alvo'?'Sem manifestação vinculada':t.status==='divergente'?'Elementos diferentes':'Controle de fusão em estudo')}</strong></div>`).join('')):'';
    const notes=a.errors.map(x=>`<p class="notice bad">${esc(x)}</p>`).join('')+a.warnings.map(x=>`<p class="notice">${esc(x)}</p>`).join('');
    $('#result-panel').innerHTML=`<h3>${esc(a.name)}</h3><p class="result-subtitle">Confira o resultado completo antes de salvar.</p><div class="result-overview">${highlights.join('')}</div>${heading('Como a magia funciona',`<ol class="rules-list">${a.lines.map(x=>`<li>${esc(x)}</li>`).join('')||'<li>Uma forma e um elemento formam a magia.</li>'}</ol>`)}${heading('Formas, elementos e aprimoramentos',layerCards)}${controls}${notes?heading('Avisos e regras em teste',notes):''}${main?'<p class="help-text">O dano 3/5/7 Tokens por Tier (+1 em fusão) ainda está em teste.</p>':''}`;
    $('#save-spell').disabled=a.errors.length>0;
  }

  function renderGuide(){
    $('#guide-elements').innerHTML=elements.map(e=>`<div class="element-item"><strong><span style="color:${elementColors[e]};display:inline">◆</span> ${e}</strong><span>${effects[e].map(esc).join(' · ')}</span></div>`).join('');
  }
  function examples(){
    const ex=(name,tier,layerList,subtitle,offensive=true)=>({id:'ex-'+name,name,subtitle,formula:normalizeFormula({tier,layers:layerList,name,offensive})});
    const make=(sh,mode,el,ef='auto')=>defaultLayer(sh,mode,el,ef);
    const fire=make('Círculo','Projétil','Fogo','Dano');
    const wall=make('Quadrado','Parede','Terra','Defesa');
    const stone=make('Círculo','Projétil','Terra','Esmagamento');const lightning=make('Quadrado','Armazenamento','Raio','Paralisia');
    const bwall=make('Quadrado','Parede','Terra','Defesa');bwall.hexagons=2;const bwstor=make('Quadrado','Armazenamento','Raio','Paralisia');bwstor.stars=2;const tri=make('Triângulo','Controle elemental','Terra','Peso');tri.target=bwall.id;
    const plasma=make('Círculo','Projétil','Fogo','auto');plasma.secondary='Raio';
    const guided=make('Círculo','Projétil','Gelo','Congelamento');const guidedTri=make('Triângulo','Controle elemental','Gelo','Congelamento');guidedTri.target=guided.id;
    return [
      ex('Bola de Fogo',1,[fire],'Uma forma e um elemento.'),
      ex('Parede de Terra',1,[wall],'Uma estrutura simples.',false),
      ex('Rocha Paralisante',2,[stone,lightning],'Paralisia ao atingir.'),
      ex('Muralha Paralisante',3,[bwall,bwstor,tri],'Parede com armazenamento e controle.',false),
      ex('Projétil de Plasma',1,[plasma],'Fusão de Fogo e Raio.'),
      ex('Lança de Gelo Guiada',2,[guided,guidedTri],'Triângulo do mesmo elemento.')
    ];
  }
  const examplesList=examples();
  function matches(formula,name,subtitle=''){
    if(tierFilter!=='all'&&String(formula.tier)!==tierFilter)return false;
    const hay=[name,subtitle,...formula.layers.flatMap(l=>[l.shape,l.mode,l.element,l.secondary,material(l),property(l)])].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const q=search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();return hay.includes(q);
  }
  function card(entry,isSaved){const f=entry.formula,a=analyze(f);return `<article class="spell-card"><div class="spell-art">${geometrySVG(f,{size:170})}</div><div class="spell-info"><div class="spell-meta"><span>Tier ${f.tier}</span><span>${f.layers.length} forma(s)</span><span>${isSaved?'Minha magia':'Exemplo'}</span></div><h3>${esc(isSaved?(f.name||a.name):entry.name)}</h3><p>${esc(entry.subtitle||a.lines[0]||'Desenho mágico.')}</p><div class="spell-buttons"><button class="btn secondary" data-open="${esc(entry.id)}" data-source="${isSaved?'saved':'example'}">Abrir no Montador</button>${isSaved?`<button class="btn ghost" title="Excluir magia" aria-label="Excluir magia" data-delete="${esc(entry.id)}">Excluir</button>`:''}</div></div></article>`}
  function renderLibrary(){
    const e=examplesList.filter(x=>matches(x.formula,x.name,x.subtitle));
    const b=book.filter(x=>matches(x.formula,x.formula.name||analyze(x.formula).name));
    $('#example-cards').innerHTML=e.length?e.map(x=>card(x,false)).join(''):'<div class="empty-library">Nenhum exemplo encontrado.</div>';
    $('#saved-cards').innerHTML=b.length?b.map(x=>card(x,true)).join(''):'<div class="empty-library">Nenhuma magia encontrada. Crie uma magia e salve no Grimório.</div>';
    $('#library-count').textContent=book.length;
    $('#saved-count').textContent=`${book.length} magia(s) salvas neste navegador`;
  }
  function refresh(){const details=$('.editor-extra');const parent=details?.closest('[data-edit-id]');if(details&&parent){if(details.open)advancedId=parent.dataset.editId;else if(advancedId===parent.dataset.editId)advancedId=null}const a=analyze();renderBuilder();renderPreview(a);renderResult(a);renderLibrary();persist()}
  function navigate(which){if(!['montador','guia','biblioteca'].includes(which))return;view=which;$$('.view').forEach(el=>{const yes=el.id==='view-'+which;el.hidden=!yes;el.classList.toggle('active',yes)});$$('.nav-tab').forEach(b=>{const yes=b.dataset.view===which;b.classList.toggle('active',yes);if(yes)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});history.replaceState(null,'','#'+which);window.scrollTo({top:0,behavior:'instant'});if(which==='biblioteca')renderLibrary()}
  function report(){
    const a=analyze();
    const lines=['PROJECT: VONDRAG — FICHA COMPLETA DE DESENHO MÁGICO',`Nome: ${a.name}`,`Tier: ${state.tier}`,`Formas funcionais: ${state.layers.length} de ${state.tier}`,`Aprimoramentos: ${a.mods} de ${4*state.tier}`,`Ordem das camadas: ${state.layers.map(l=>l.shape).join(' > ')}`,'','CAMADAS (EXTERNA PARA INTERNA):'];
    state.layers.forEach((l,i)=>{
      const f=fusionOf(l),timer=timed.has(property(l));
      lines.push('',`Camada ${i+1} — ${l.shape}: ${l.mode}`,`Elemento: ${l.element}${l.secondary!=='Nenhum'?' + '+l.secondary+' = '+material(l):''}`,`Propriedade: ${property(l)}`,`Diamante: ${l.secondary==='Nenhum'?l.diamond:'Não permitido em fusão'}`,`Estrelas: ${l.stars}${timer?' / Duração da condição: '+(1+l.stars)+' turno(s)':''}`,`Hexágonos: ${l.hexagons}${l.mode==='Parede'?' / Parede: '+(2+l.hexagons)+' turno(s)':''}`,`Círculos extras: ${l.shape==='Círculo'?l.rings+' / Escala '+(3+2*l.rings)+' m':'Não se aplica'}`);
      if(l.shape==='Triângulo')lines.push(`Alcance do Triângulo: ${4+2*state.tier} m`, `Vínculo de controle: ${state.layers.some(x=>x.id===l.target)?'Camada '+(state.layers.findIndex(x=>x.id===l.target)+1)+' / '+state.layers.find(x=>x.id===l.target).mode+' de '+material(state.layers.find(x=>x.id===l.target)):'Não definido'}`);
      if(f)lines.push(`Fusão: ${f[4]?'confirmada':'em teste'}`);
    });
    lines.push('','COMO FUNCIONA:',...a.lines,'','DANO E ATIVAÇÃO:',`Dano direto (escala experimental): ${a.direct} Tokens`,`Dano adicional das magias armazenadas: 0 Tokens`);
    a.stores.forEach(s=>lines.push(`Armazenamento na camada ${s.i+1}: ${material(s.l)} / ${property(s.l)} / Gatilho: ${s.trigger} / ${s.holder?.l.mode==='Parede'?'Reaplicação contínua enquanto a parede existir':'Reaplicação não estabelecida'} / Duração: ${s.duration===null?'não se aplica':s.duration+' turno(s)'}`));
    a.controls.forEach(t=>lines.push(`Triângulo na camada ${t.i+1}: ${t.status} / Alvo ${t.target?'camada '+(t.target.i+1):'não definido'}`));
    if(a.errors.length)lines.push('','ERROS:',...a.errors);
    if(a.warnings.length)lines.push('','A DEFINIR / EM TESTE:',...a.warnings);
    return lines.join('\n');
  }

  function download(filename,text,type){const b=new Blob([text],{type});const url=URL.createObjectURL(b);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  const fileSlug=(x)=>String(x||'magia').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)||'magia';
  function save(){const a=analyze();if(a.errors.length){notify('Corrija as regras destacadas antes de salvar.');return}book.unshift({id:uid(),date:new Date().toISOString(),formula:normalizeFormula(state)});persist();renderLibrary();notify('Magia salva no seu Grimório!')}
  function loadFormula(f){state=normalizeFormula(f);state.activeId=null;refresh();navigate('montador');notify('Magia aberta no Montador.')}
  function importData(json){let list=[];if(Array.isArray(json))list=json;else if(json&&Array.isArray(json.spells))list=json.spells;else if(json&&Array.isArray(json.layers))list=[{formula:json}];else if(json?.formula?.layers)list=[json];else throw new Error('Formato de Grimório não reconhecido.');
    let added=0;for(const x of list.slice(0,150)){const formula=x?.formula?.layers?x.formula:x?.layers?x:null;if(!formula)continue;book.push({id:uid(),date:new Date().toISOString(),formula:normalizeFormula(formula)});added++}if(!added)throw new Error('Arquivo sem magias compatíveis.');persist();renderLibrary();notify(`${added} magia(s) importadas.`)}
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button,[data-nav]');if(!btn)return;
    if(btn.dataset.view||btn.dataset.nav){e.preventDefault();navigate(btn.dataset.view||btn.dataset.nav);return}
    if(btn.dataset.tier){changeTier(btn.dataset.tier);return}
    if(btn.dataset.mainShape){const l=state.layers[0];l.shape=btn.dataset.mainShape;l.mode=shapeModes[l.shape][0];l.rings=0;clearIncompatibleModifiers(l);state.offensive=l.shape==='Círculo';refresh();return}
    if(btn.dataset.add){addLayer(btn.dataset.add);return}
    if(btn.dataset.layer){state.activeId=state.activeId===btn.dataset.layer?null:btn.dataset.layer;refresh();return}
    if(btn.dataset.closeEditor!==undefined){state.activeId=null;refresh();return}
    if(btn.dataset.clearMods){const l=state.layers.find(x=>x.id===btn.dataset.clearMods);if(l){l.stars=0;l.hexagons=0;l.diamond='Nenhuma';refresh();notify('Aprimoramentos desta camada removidos.')}return}
    if(btn.dataset.clearAllMods!==undefined){clearAllModifiers();return}
    if(btn.dataset.move){moveLayer(btn.dataset.id,Number(btn.dataset.move));return}
    if(btn.dataset.remove){removeLayer(btn.dataset.remove);return}
    if(btn.id==='save-spell'){save();return}
    if(btn.id==='copy-spell'){if(navigator.clipboard?.writeText){navigator.clipboard.writeText(report()).then(()=>notify('Ficha copiada!')).catch(()=>notify('Copie a ficha com Ctrl+C no navegador.'))}else{const ta=document.createElement('textarea');ta.value=report();document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();notify('Ficha copiada!')}return}
    if(btn.id==='reset-spell'){state=defaultFormula();refresh();notify('Nova magia iniciada.');return}
    if(btn.id==='download-svg'){download(fileSlug(analyze().name)+'.svg',geometrySVG(state,{size:600}),'image/svg+xml;charset=utf-8');notify('Desenho SVG salvo.');return}
    if(btn.dataset.open){const item=btn.dataset.source==='saved'?book.find(x=>x.id===btn.dataset.open):examplesList.find(x=>x.id===btn.dataset.open);if(item)loadFormula(item.formula);return}
    if(btn.dataset.delete){const i=book.findIndex(x=>x.id===btn.dataset.delete);if(i<0)return;if(confirm('Excluir esta magia do Grimório?')){book.splice(i,1);persist();renderLibrary();notify('Magia excluída.')}return}
    if(btn.id==='export-book'){download('vondrag-grimorio.json',JSON.stringify({type:'vondrag-grimoire',version:3,spells:book},null,2),'application/json;charset=utf-8');notify('Grimório exportado.');return}
    if(btn.id==='import-book'){$('#import-input').click();return}
  });
  document.addEventListener('change',e=>{
    const t=e.target;
    if(t.id==='main-mode'){state.layers[0].mode=t.value;clearIncompatibleModifiers(state.layers[0]);refresh();return}
    if(t.id==='main-element'){const l=state.layers[0];l.element=t.value;if(l.secondary===t.value)l.secondary='Nenhum';l.effect='auto';l.diamond='Nenhuma';clearIncompatibleModifiers(l);refresh();return}
    if(t.id==='main-effect'){state.layers[0].effect=t.value;state.layers[0].diamond='Nenhuma';clearIncompatibleModifiers(state.layers[0]);refresh();return}
    if(t.dataset.layerField){const box=t.closest('[data-edit-id]');if(!box)return;const id=box.dataset.editId,l=state.layers.find(x=>x.id===id);if(!l)return;
      const key=t.dataset.layerField;let v=t.type==='checkbox'?t.checked:t.value;
      if(key==='shape'){l.shape=v;l.mode=shapeModes[v][0];l.target='Nenhum';l.rings=0}
      else if(key==='mode'){l.mode=v}
      else if(key==='element'){l.element=v;if(l.secondary===v)l.secondary='Nenhum';l.effect='auto';l.diamond='Nenhuma'}
      else if(key==='secondary'){l.secondary=v;l.effect='auto';l.diamond='Nenhuma'}
      else if(key==='effect'){l.effect=v;l.diamond='Nenhuma'}
      else if(key==='diamond'){if(v!=='Nenhuma'&&l.diamond==='Nenhuma'&&modCount()>=state.tier*4){notify('Limite de aprimoramentos atingido.');refresh();return}l.diamond=v}
      else if(key==='rings'){l.rings=capNum(v,0,8,0)}
      else if(key==='offensive'){state.offensive=v}
      else if(key==='target'){l.target=v}
      else if(key==='trigger'){l.trigger=v}
      else if(key==='focus'){l.focus=String(v).slice(0,100)}
      clearIncompatibleModifiers(l);refresh();return;
    }
    if(t.dataset.mod){const l=state.layers.find(x=>x.id===t.dataset.id);if(!l)return;const key=t.dataset.mod,old=l[key],val=capNum(t.value,0,state.tier*4,0);if(val>old&&((key==='stars'&&!supportsStars(l))||(key==='hexagons'&&!supportsHexagons(l)))){notify('Este aprimoramento não é compatível com a função atual.');refresh();return}l[key]=val;if(modCount()>4*state.tier){l[key]=old;notify('Limite de aprimoramentos do Tier atingido.')}refresh();return}
    if(t.id==='filter-tier'){tierFilter=t.value;renderLibrary()}
  });
  $('#spell-name').addEventListener('input',e=>{state.name=e.target.value.slice(0,90);const a=analyze();$('#preview-name').textContent=a.name;renderResult(a);persist()});
  $('#search-spells').addEventListener('input',e=>{search=e.target.value;renderLibrary()});
  $('#import-input').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>3_000_000)throw new Error('O arquivo é muito grande.');importData(JSON.parse(await f.text()))}catch(err){notify(err.message||'Erro ao importar arquivo.')}e.target.value=''});
  renderGuide();refresh();navigate(['montador','guia','biblioteca'].includes(location.hash.slice(1))?location.hash.slice(1):'montador');
})();
