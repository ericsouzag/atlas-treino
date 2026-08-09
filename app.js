// =====================================================
// ESTADO
// =====================================================
let currentFicha = JSON.parse(JSON.stringify(FICHA_DEFAULT));
let selectedDay = 0;
let swapTarget = null; // {dayIdx, slotIdx}

// =====================================================
// UTIL
// =====================================================
function firstWord(s){ return (s||'').split(' ')[0]; }
function primaryOverlap(a,b){
  const aw = a.primary.map(firstWord), bw = b.primary.map(firstWord);
  return aw.filter(w=>bw.includes(w)).length;
}
function groupOverlap(a,b){ return a.groups.filter(g=>b.groups.includes(g)).length; }
function illustration(ex){
  const photo = (typeof PHOTO_DATA !== 'undefined') ? PHOTO_DATA[ex.name] : null;
  if(photo){
    return `<div class="illus-wrap illus-photo"><img src="${photo}" alt="${ex.name}" loading="lazy"></div>`;
  }
  const p = ex.pose;
  if(!p) return '';
  return `<div class="illus-wrap">${buildPose(p.stance, p.arms, p.equip, exerciseZone(ex))}</div>`;
}
const ZONE_BY_GROUP = {
  peito:'torso', costas:'torso', ombro:'torso', trapezio:'torso', core:'torso',
  biceps:'arms', triceps:'arms', antebraco:'arms',
  quadriceps:'legs', posterior:'legs', gluteos:'legs', panturrilha:'legs', adutor_abdutor:'legs',
};
function exerciseZone(ex){ return ZONE_BY_GROUP[ex.groups[0]] || null; }
function tagsHtml(ex){
  return `<div class="tag-row">`
    + ex.primary.map(m=>`<span class="tag primary">${m}</span>`).join('')
    + ex.secondary.map(m=>`<span class="tag secondary">${m}</span>`).join('')
    + `</div>`;
}

// =====================================================
// TABS
// =====================================================
document.querySelectorAll('nav.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.toggle('active', b===btn));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+btn.dataset.view).classList.add('active');
    if(btn.dataset.view === 'atlas' && !window.__atlasBuilt){ buildAtlas(); window.__atlasBuilt = true; }
  });
});

// =====================================================
// FICHA VIEW
// =====================================================
function renderDaySelect(){
  const el = document.getElementById('daySelect');
  el.innerHTML = currentFicha.map((d,i)=>`
    <button class="day-chip ${i===selectedDay?'active':''}" data-idx="${i}">
      ${d.day}<span class="g">${d.label}</span>
    </button>`).join('');
  el.querySelectorAll('.day-chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{ selectedDay = +chip.dataset.idx; renderDaySelect(); renderDayContent(); });
  });
}

function renderDayContent(){
  const day = currentFicha[selectedDay];
  const el = document.getElementById('dayContent');
  el.innerHTML = day.exercises.map((name, slotIdx)=>{
    const ex = EX_BY_NAME[name];
    if(!ex) return `<div class="ex-card">Exercício não encontrado: ${name}</div>`;
    return `
    <div class="ex-card">
      ${illustration(ex)}
      <div class="ex-top">
        <div>
          <div class="ex-name">${ex.name}</div>
          <div class="ex-equip">${ex.equip}</div>
        </div>
        <button class="swap-btn" data-day="${selectedDay}" data-slot="${slotIdx}">🔁 Trocar</button>
      </div>
      ${tagsHtml(ex)}
    </div>`;
  }).join('');
  el.querySelectorAll('.swap-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      openSwapModal(+btn.dataset.day, +btn.dataset.slot);
    });
  });
}

// ---- swap modal ----
function openSwapModal(dayIdx, slotIdx){
  swapTarget = {dayIdx, slotIdx};
  const currentName = currentFicha[dayIdx].exercises[slotIdx];
  const ex = EX_BY_NAME[currentName];
  document.getElementById('modalTitle').textContent = `Substituir: ${ex.name}`;
  document.getElementById('modalSub').textContent = `Trabalha ${ex.primary.join(', ')}. Escolha um exercício que treine a mesma porção.`;

  const candidates = EX.filter(e => e.name !== ex.name && groupOverlap(e,ex) > 0)
    .map(e => ({ e, score: groupOverlap(e,ex)*3 + primaryOverlap(e,ex)*2 }))
    .sort((a,b)=>b.score-a.score)
    .slice(0,10);

  const optionsEl = document.getElementById('modalOptions');
  optionsEl.innerHTML = candidates.map(c=>{
    const sameMuscle = primaryOverlap(c.e, ex) > 0;
    return `
    <div class="option-card" data-name="${c.e.name.replace(/"/g,'&quot;')}">
      <div class="thumb">${PHOTO_DATA[c.e.name] ? `<img src="${PHOTO_DATA[c.e.name]}" alt="${c.e.name}" style="width:100%;border-radius:8px;display:block;">` : buildPose(c.e.pose.stance, c.e.pose.arms, c.e.pose.equip, exerciseZone(c.e))}</div>
      <div class="info">
        <div class="name">${c.e.name}</div>
        <div class="match">${sameMuscle ? '✓ mesma porção muscular' : 'grupo relacionado'} — ${c.e.primary.join(', ')}</div>
      </div>
    </div>`;
  }).join('') || `<p style="color:var(--muted);">Nenhum substituto encontrado.</p>`;

  optionsEl.querySelectorAll('.option-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      currentFicha[swapTarget.dayIdx].exercises[swapTarget.slotIdx] = card.dataset.name;
      closeSwapModal();
      renderDayContent();
    });
  });

  document.getElementById('swapModal').classList.add('open');
}
function closeSwapModal(){ document.getElementById('swapModal').classList.remove('open'); }
document.getElementById('closeModal').addEventListener('click', closeSwapModal);
document.getElementById('swapModal').addEventListener('click', (e)=>{ if(e.target.id==='swapModal') closeSwapModal(); });

// ---- regenerate / reset ----
document.getElementById('regenBtn').addEventListener('click', ()=>{
  currentFicha.forEach(day=>{
    day.exercises = day.exercises.map(name=>{
      const ex = EX_BY_NAME[name];
      const candidates = EX.filter(e => e.name !== ex.name && groupOverlap(e,ex) > 0)
        .map(e => ({ e, score: groupOverlap(e,ex)*3 + primaryOverlap(e,ex)*2 }))
        .sort((a,b)=>b.score-a.score)
        .slice(0,6);
      if(candidates.length === 0) return name;
      const pick = candidates[Math.floor(Math.random()*candidates.length)];
      return pick.e.name;
    });
  });
  renderDayContent();
});
document.getElementById('resetBtn').addEventListener('click', ()=>{
  currentFicha = JSON.parse(JSON.stringify(FICHA_DEFAULT));
  selectedDay = 0;
  renderDaySelect();
  renderDayContent();
});

// =====================================================
// ATLAS VIEW
// =====================================================
function buildAtlas(){
  const chipRow = document.getElementById('atlasChips');
  let activeGroup = 'all';
  chipRow.innerHTML = `<button class="chip active" data-key="all">Todos</button>` +
    GROUP_META.map(g=>`<button class="chip" data-key="${g.key}">${g.label}</button>`).join('');

  function render(){
    const term = document.getElementById('atlasSearch').value.trim().toLowerCase();
    const content = document.getElementById('atlasContent');
    content.innerHTML = '';
    GROUP_META.forEach(g=>{
      if(activeGroup !== 'all' && activeGroup !== g.key) return;
      const items = EX.filter(e => e.groups.includes(g.key) && (!term ||
        (e.name+' '+e.equip+' '+e.primary.join(' ')+' '+e.secondary.join(' ')).toLowerCase().includes(term)));
      if(items.length===0) return;
      const section = document.createElement('section');
      section.innerHTML = `<div class="group-head"><h2>${g.label}</h2></div>
        <div class="card-grid">${items.map(ex=>`
          <div class="ex-card">
            ${illustration(ex)}
            <div class="ex-name">${ex.name}</div>
            <div class="ex-equip">${ex.equip}</div>
            ${tagsHtml(ex)}
          </div>`).join('')}</div>`;
      content.appendChild(section);
    });
  }
  chipRow.addEventListener('click', e=>{
    const b = e.target.closest('.chip'); if(!b) return;
    activeGroup = b.dataset.key;
    chipRow.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active', c===b));
    render();
  });
  document.getElementById('atlasSearch').addEventListener('input', render);
  render();
}

// =====================================================
// BUILDER VIEW
// =====================================================
let builderDays = [];
function newBuilderDay(dayLabel){
  return { day: dayLabel || `DIA ${builderDays.length+1}`, groups: [{group:'peito', count:3}] };
}
function renderBuilder(){
  const el = document.getElementById('builderDays');
  el.innerHTML = builderDays.map((d,di)=>`
    <div class="builder-day" data-di="${di}">
      <div class="builder-day-head">
        <input type="text" value="${d.day}" data-role="dayname" data-di="${di}">
        <button class="remove-day" data-di="${di}">remover dia ✕</button>
      </div>
      ${d.groups.map((g,gi)=>`
        <div class="group-row" data-di="${di}" data-gi="${gi}">
          <select data-role="group" data-di="${di}" data-gi="${gi}">
            ${GROUP_META.map(gm=>`<option value="${gm.key}" ${gm.key===g.group?'selected':''}>${gm.label}</option>`).join('')}
          </select>
          <input type="number" min="1" max="8" value="${g.count}" data-role="count" data-di="${di}" data-gi="${gi}">
          <button class="remove-row" data-di="${di}" data-gi="${gi}">✕</button>
        </div>`).join('')}
      <button class="add-group-btn" data-di="${di}">+ adicionar grupo muscular</button>
    </div>`).join('');

  el.querySelectorAll('[data-role=dayname]').forEach(inp=>inp.addEventListener('input', ()=>{
    builderDays[+inp.dataset.di].day = inp.value;
  }));
  el.querySelectorAll('[data-role=group]').forEach(sel=>sel.addEventListener('change', ()=>{
    builderDays[+sel.dataset.di].groups[+sel.dataset.gi].group = sel.value;
  }));
  el.querySelectorAll('[data-role=count]').forEach(inp=>inp.addEventListener('input', ()=>{
    builderDays[+inp.dataset.di].groups[+inp.dataset.gi].count = Math.max(1, +inp.value || 1);
  }));
  el.querySelectorAll('.remove-row').forEach(btn=>btn.addEventListener('click', ()=>{
    builderDays[+btn.dataset.di].groups.splice(+btn.dataset.gi,1);
    renderBuilder();
  }));
  el.querySelectorAll('.add-group-btn').forEach(btn=>btn.addEventListener('click', ()=>{
    builderDays[+btn.dataset.di].groups.push({group:'peito', count:2});
    renderBuilder();
  }));
  el.querySelectorAll('.remove-day').forEach(btn=>btn.addEventListener('click', ()=>{
    builderDays.splice(+btn.dataset.di,1);
    renderBuilder();
  }));
}
document.getElementById('addDayBtn').addEventListener('click', ()=>{
  builderDays.push(newBuilderDay());
  renderBuilder();
});
// seed with one day
builderDays.push(newBuilderDay('SEG'));
renderBuilder();

// escolhe exercícios cobrindo o máximo de porções distintas do grupo
function pickForGroup(groupKey, count, alreadyUsed){
  const pool = EX.filter(e => e.groups.includes(groupKey) && !alreadyUsed.has(e.name));
  // agrupar por "porção" (primeira palavra do músculo principal)
  const byPortion = {};
  pool.forEach(e=>{
    const key = e.primary.map(firstWord).join('+');
    (byPortion[key] = byPortion[key] || []).push(e);
  });
  const portionKeys = Object.keys(byPortion).sort(()=>Math.random()-0.5);
  const picks = [];
  let i = 0;
  while(picks.length < count && portionKeys.length > 0){
    const key = portionKeys[i % portionKeys.length];
    const arr = byPortion[key];
    if(arr.length){
      const idx = Math.floor(Math.random()*arr.length);
      picks.push(arr.splice(idx,1)[0]);
    } else {
      portionKeys.splice(i % portionKeys.length, 1);
      continue;
    }
    i++;
    if(picks.length >= count) break;
    if(i > 200) break;
  }
  picks.forEach(p=>alreadyUsed.add(p.name));
  return picks;
}

document.getElementById('generateBtn').addEventListener('click', ()=>{
  const used = new Set();
  const newFicha = builderDays.map(d=>{
    let exNames = [];
    d.groups.forEach(g=>{
      const picks = pickForGroup(g.group, g.count, used);
      exNames = exNames.concat(picks.map(p=>p.name));
    });
    const labels = d.groups.map(g => GROUP_META.find(gm=>gm.key===g.group).label).join(' + ');
    return { day: d.day, label: labels, exercises: exNames };
  });
  currentFicha = newFicha;
  selectedDay = 0;
  renderDaySelect();
  renderDayContent();
  document.querySelector('nav.tabs button[data-view=ficha]').click();
});

// =====================================================
// INIT
// =====================================================
renderDaySelect();
renderDayContent();
