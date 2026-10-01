let subjects=[];
const key='iiml_revision_progress_v2';
let progress=JSON.parse(localStorage.getItem(key)||'{}');

function normaliseProgress(){
  let changed=false;
  Object.keys(progress).forEach(k=>{
    if(typeof progress[k]==='boolean'){
      progress[k]={done:progress[k], completedAt:progress[k]?Date.now():null};
      changed=true;
    }
  });
  if(changed)localStorage.setItem(key,JSON.stringify(progress));
}
normaliseProgress();

function isDone(k){return !!(progress[k] && progress[k].done)}
function save(){localStorage.setItem(key,JSON.stringify(progress))}

async function load(){
  const r=await fetch('data/subjects.json');
  subjects=await r.json();
  const filter=document.getElementById('filter');
  subjects.forEach(s=>{
    const o=document.createElement('option');
    o.value=s.id;
    o.textContent=s.code+' – '+s.name;
    filter.appendChild(o);
  });
  render();
}

function totals(){
  const total=subjects.reduce((a,s)=>a+s.modules.length,0);
  const done=subjects.reduce((a,s)=>a+s.modules.filter((_,i)=>isDone(s.id+'_'+i)).length,0);
  return {total,done,pct:total?Math.round(done/total*100):0};
}

function renderDashboard(){
  const {total,done,pct}=totals();
  document.getElementById('subjectCount').textContent=subjects.length;
  document.getElementById('moduleCount').textContent=total;
  document.getElementById('completedCount').textContent=done;
  document.getElementById('overallPct').textContent=pct+'%';

  document.getElementById('subjectProgress').innerHTML=subjects.map(s=>{
    const d=s.modules.filter((_,i)=>isDone(s.id+'_'+i)).length;
    const p=s.modules.length?Math.round(d/s.modules.length*100):0;
    return `<div class="subject-row">
      <div class="subject-head"><span><b>${s.code}</b> — ${s.name}</span><span>${d}/${s.modules.length} (${p}%)</span></div>
      <div class="bar"><div class="fill" style="width:${p}%"></div></div>
    </div>`;
  }).join('');

  const pending=[];
  subjects.forEach(s=>s.modules.forEach((m,i)=>{
    if(!isDone(s.id+'_'+i)) pending.push({subject:s, module:m, index:i});
  }));
  const queue=pending.slice(0,6);
  document.getElementById('reviseQueue').innerHTML=queue.length
    ? queue.map(x=>`<div class="queue-item"><b>${x.subject.code}</b> — ${x.module}<small>Pending module · use the subject card below to mark complete</small></div>`).join('')
    : '<div class="empty">All modules are currently marked complete.</div>';

  document.getElementById('pendingList').innerHTML=pending.length
    ? pending.slice(0,20).map(x=>`<div class="queue-item"><b>${x.subject.code}</b> — ${x.module}</div>`).join('') +
      (pending.length>20?`<div class="empty">Showing first 20 of ${pending.length} pending modules.</div>`:'')
    : '<div class="empty">No pending modules.</div>';

  const recent=Object.entries(progress)
    .filter(([,v])=>v && v.done && v.completedAt)
    .sort((a,b)=>b[1].completedAt-a[1].completedAt)
    .slice(0,8)
    .map(([k,v])=>{
      const [sid,idx]=k.split('_');
      const s=subjects.find(x=>x.id===sid);
      return s?{subject:s,module:s.modules[Number(idx)],at:v.completedAt}:null;
    }).filter(Boolean);

  document.getElementById('recentList').innerHTML=recent.length
    ? recent.map(x=>`<div class="queue-item"><b>${x.subject.code}</b> — ${x.module}<small>${new Date(x.at).toLocaleString()}</small></div>`).join('')
    : '<div class="empty">Complete a module to start the recent-history list.</div>';

  const overlaps=[];
  subjects.forEach(s=>s.overlaps.forEach(o=>overlaps.push(`<span class="tag"><b>${s.code}</b> · ${o}</span>`)));
  document.getElementById('overlapMap').innerHTML=overlaps.join('');
}

function render(){
  renderDashboard();
  const q=document.getElementById('search').value.toLowerCase().trim();
  const f=document.getElementById('filter').value;
  const list=subjects.filter(s=>{
    if(f!=='all'&&s.id!==f)return false;
    if(!q)return true;
    return (s.name+' '+s.code+' '+s.modules.join(' ')+' '+s.overlaps.join(' ')).toLowerCase().includes(q);
  });

  const grid=document.getElementById('grid');
  grid.innerHTML='';
  list.forEach(s=>{
    const done=s.modules.filter((_,i)=>isDone(s.id+'_'+i)).length;
    const card=document.createElement('article');
    card.className='card';
    card.innerHTML=`<div class="code">${s.code}</div><h2>${s.name}</h2>
      <div class="progress"><label>${done}/${s.modules.length} modules completed</label>
      <div class="bar"><div class="fill" style="width:${s.modules.length?done/s.modules.length*100:0}%"></div></div></div>
      <h3>Revision modules</h3>
      <ol class="modules">${s.modules.map((m,i)=>`<li><label><input type="checkbox" data-key="${s.id}_${i}" ${isDone(s.id+'_'+i)?'checked':''}> ${m}</label></li>`).join('')}</ol>
      <h3>Video resources</h3>
      ${s.videos.map(v=>`<a class="video" href="${v.url}" target="_blank" rel="noopener"><b>${v.title}</b><br><small>${v.provider} · ${v.type}</small></a>`).join('')}
      <div class="overlap"><strong>Cross-subject overlap</strong><br>${s.overlaps.map(x=>`<span class="tag">${x}</span>`).join('')}</div>`;
    grid.appendChild(card);
  });

  grid.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.addEventListener('change',e=>{
    progress[e.target.dataset.key]={
      done:e.target.checked,
      completedAt:e.target.checked?Date.now():null
    };
    save();
    render();
  }));
}

document.getElementById('search').addEventListener('input',render);
document.getElementById('filter').addEventListener('change',render);
document.getElementById('reset').addEventListener('click',()=>{
  if(confirm('Reset all module progress and recent-completion history?')){
    progress={};
    save();
    render();
  }
});
load();
