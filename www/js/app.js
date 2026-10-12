/* ---------- readiness ---------- */
var SLIDERS=[['sleep','Sleep quality'],['sore','Freshness (5 = no soreness)'],['mot','Motivation'],['stress','Calm (5 = no stress)']];
function renderSliders(){
  var key=iso(new Date()),r=S.ready[key]||{};
  document.getElementById('sliders').innerHTML=SLIDERS.map(function(a){
    var v=(r[a[0]]===undefined?3:r[a[0]]);
    return '<div class="slider"><div class="top"><span>'+a[1]+'</span><span id="v-'+a[0]+'">'+v+'</span></div>'+
      '<input type="range" min="1" max="5" step="1" value="'+v+'" data-k="'+a[0]+'"></div>';
  }).join('');
  document.getElementById('inRhr').value=(r.rhr===undefined||r.rhr===null)?'':r.rhr;
  document.getElementById('inHrv').value=(r.hrv===undefined||r.hrv===null)?'':r.hrv;
  Array.prototype.forEach.call(document.querySelectorAll('#sliders input'),function(el){
    el.addEventListener('input',function(e){
      var k=e.target.dataset.k;
      document.getElementById('v-'+k).textContent=e.target.value;
      setReady(k,+e.target.value);
    });
  });
}
function setReady(k,v){var key=iso(new Date());S.ready[key]=S.ready[key]||{};S.ready[key][k]=v;save();renderVerdict();}
function renderVerdict(){
  var r=S.ready[iso(new Date())]||{};
  var w=(r.sleep||3)+(r.sore||3)+(r.mot||3)+(r.stress||3);
  var rhr=r.rhr,el=document.getElementById('verdict');
  if(!rhr){el.style.setProperty('--c','var(--led-dim)');
    el.innerHTML='<div class="t">Enter your resting HR</div><p>It is the most useful single number you have. Your peak baseline was 52–55; you have been sitting in the low 60s.</p>';return;}
  var c,t,p;
  if(rhr>=62||w<=10){c='var(--led-magenta)';t='Red — back off';
    p='Rest, or Abrahangs and a walk. Training through this is how the last six months went. One easy day now costs you nothing.';}
  else if(rhr<=56&&w>=16){c='var(--led-green)';t='Green — go';
    p='Train as written and push the intensification work. This is the state you were in last October. Notice it.';}
  else{c='var(--led-yellow)';t='Amber — trim it';
    p='Keep the skill work, cut the intensity. Take the lower end of every set and rep range, or run the minimum version.';}
  el.style.setProperty('--c',c);
  el.innerHTML='<div class="t">'+t+'</div><p>'+p+'</p>';
}
document.getElementById('inRhr').addEventListener('input',function(e){setReady('rhr',e.target.value?+e.target.value:null);});
document.getElementById('inHrv').addEventListener('input',function(e){setReady('hrv',e.target.value?+e.target.value:null);});

/* ---------- today ---------- */
function blk(t,b){return '<div class="block"><div class="label">'+t+'</div><p>'+b+'</p></div>';}
function mac(v,k){return '<div class="macro"><div class="v">'+v+'</div><div class="k">'+k+'</div></div>';}
function renderToday(){
  var idx=todayIdx(),pre=idx<0,i=Math.max(0,Math.min(111,idx));
  var w=Math.floor(i/7)+1,dow=i%7,cy=cycleOf(w),s=session(dow,w),d=new Date();
  document.getElementById('hdrEyebrow').textContent='Cycle '+cy.id+' · '+cy.name;
  document.getElementById('hdrTitle').textContent=pre?('Starts '+fmt(startDate())):fmt(d);
  document.getElementById('hdrPos').innerHTML='<b>W'+w+' · '+DAYS[dow]+'</b>'+PHASE_NAME[s.ph];
  var card=document.getElementById('sessionCard');
  card.style.setProperty('--c',s.c);
  document.getElementById('sessName').textContent=s.name;
  document.getElementById('sessTitle').textContent=s.title;
  document.getElementById('sessFeel').textContent=s.feel;
  document.getElementById('sessBody').innerHTML=
    blk('Warm-up',s.warm)+blk('Main',s.main)+blk('Prevention & antagonist',s.prev)+blk('Cooldown',s.cool)+
    '<div class="note">'+s.note+'</div>'+
    '<div class="note" style="border-left:2px solid '+cy.c+'"><b>Cycle '+cy.id+'.</b> '+cy.brief+'</div>';
  document.getElementById('sessFallback').textContent=s.fb;
  var st=S.log[iso(d)];
  document.getElementById('btnFull').classList.toggle('on',st==='full');
  document.getElementById('btnMin').classList.toggle('on',st==='min');
  var f=FUEL[fuelFor(dow)];
  document.getElementById('fuelType').textContent=f.t;
  document.getElementById('macros').innerHTML=mac(f.kcal,'kcal')+mac(f.p+' g','protein')+mac(f.c+' g','carbs')+mac(f.f+' g','fat');
  document.getElementById('fuelNote').textContent=f.n;
}
function markDate(ds,kind){
  if(S.log[ds]===kind)delete S.log[ds];else S.log[ds]=kind;
  save();renderToday();renderBoard();renderStats();renderHistory();
}
function mark(kind){markDate(iso(new Date()),kind);}
document.getElementById('btnFull').onclick=function(){mark('full');};
document.getElementById('btnMin').onclick=function(){mark('min');};
document.getElementById('toEat').onclick=function(){go('eat');};

/* ---------- board ---------- */
function renderBoard(){
  var ti=todayIdx(),h='';
  CYCLES.forEach(function(cy){
    h+='<div class="cyc"><div class="cyc-hd"><h3>Cycle '+cy.id+' — '+cy.name+'</h3><span class="wk">wk '+cy.w[0]+(cy.w[1]!==cy.w[0]?'–'+cy.w[1]:'')+'</span></div>';
    for(var w=cy.w[0];w<=cy.w[1];w++){
      h+='<div class="wkrow"><div class="wknum">'+w+'</div>';
      for(var d=0;d<7;d++){
        var idx=(w-1)*7+d,dt=dateOf(idx),s=session(d,w),st=S.log[iso(dt)];
        var cls='hold'+(st==='full'?' done':'')+(st==='min'?' min':'')+(idx===ti?' today':'')+(idx<ti?' past':'');
        h+='<button class="'+cls+'" style="--c:'+s.c+'" data-idx="'+idx+'" aria-label="Week '+w+' '+DAYS[d]+', '+s.name+'"></button>';
      }
      h+='</div>';
    }
    h+='</div>';
  });
  document.getElementById('board').innerHTML=h;
  Array.prototype.forEach.call(document.querySelectorAll('.hold'),function(b){
    b.onclick=function(){peek(+b.dataset.idx);};
  });
}
function peek(idx){
  var w=Math.floor(idx/7)+1,d=idx%7,s=session(d,w),dt=dateOf(idx),ds=iso(dt);
  var st=S.log[ds];
  var el=document.getElementById('peekCard');
  el.className='card led';el.style.setProperty('--c',s.c);
  el.innerHTML='<div class="label"><span class="dot" style="--c:'+s.c+'"></span>Week '+w+' · '+fmt(dt)+'</div>'+
    '<h2>'+s.title+'</h2><div class="feel" style="--c:'+s.c+'">'+s.feel+'</div>'+
    blk('Main',s.main)+blk('Prevention',s.prev)+
    '<div class="btnrow">'+
      '<button class="btn'+(st==='full'?' on':'')+'" style="--c:var(--led-green)" data-d="'+ds+'" data-k="full">Did it</button>'+
      '<button class="btn'+(st==='min'?' on':'')+'" style="--c:var(--led-yellow)" data-d="'+ds+'" data-k="min">Minimum</button>'+
    '</div>'+
    '<details><summary>Minimum version</summary><p>'+s.fb+'</p></details>';
  Array.prototype.forEach.call(el.querySelectorAll('[data-k]'),function(b){
    b.onclick=function(){markDate(b.dataset.d,b.dataset.k);peek(idx);};
  });
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}
document.getElementById('inStart').addEventListener('change',function(e){
  if(e.target.value){S.start=e.target.value;save();renderAll();}
});

/* ---------- log ---------- */
function renderStats(){
  var ti=todayIdx(),i;
  var last=Math.min(ti,111);
  var done=0,elapsed=0,streak=0;
  for(i=0;i<=last;i++){elapsed++;if(S.log[iso(dateOf(i))])done++;}
  for(i=last;i>=0;i--){if(S.log[iso(dateOf(i))])streak++;else break;}
  var pct=elapsed>0?Math.round(done/elapsed*100):0;
  var w=Math.max(1,Math.min(16,Math.floor(Math.max(0,ti)/7)+1));
  document.getElementById('stats').innerHTML=
    '<div class="stat"><div class="v">'+streak+'</div><div class="k">day streak</div></div>'+
    '<div class="stat"><div class="v">'+(elapsed>0?pct+'%':'—')+'</div><div class="k">logged</div></div>'+
    '<div class="stat"><div class="v">'+w+'<span style="font-size:13px;color:var(--ink-3)">/16</span></div><div class="k">week</div></div>';
  var n=document.getElementById('streakNote');
  if(ti<0)n.innerHTML='<b>Block has not started.</b> Day 1 is '+fmt(startDate())+'. Change the start date on the Plan tab if you want to begin sooner.';
  else if(elapsed<7)n.innerHTML='<b>Early days.</b> Automaticity takes around two months. Log everything, including the minimum sessions — especially those.';
  else if(pct>=80)n.innerHTML='<b>This is the number that matters.</b> Above 80% and the plan works as written. Keep it there and the floor moves on its own.';
  else n.innerHTML='<b>Below 80%.</b> Do not rewrite the plan, shrink the sessions. A logged 15-minute fallback beats a skipped perfect session every time. Never miss twice.';
  var sw=document.getElementById('storageWarn');
  if(STORAGE_OK===false||SAVE_ERROR){
    sw.className='note';
    sw.innerHTML='<b>Saving is blocked in this browser.</b> Your logs will not survive a refresh. This usually means private browsing, or site data blocked for this domain. Export a backup below before you lose anything.';
  } else sw.className='hide';
}

/* history list — every logged day, newest first */
function renderHistory(){
  var keys=Object.keys(S.log).sort().reverse();
  var el=document.getElementById('history');
  if(!keys.length){
    el.innerHTML='<p class="tiny" style="margin:0">Nothing logged yet. Tap <b>Did it</b> on the Today tab, or tap any past day on the Plan tab to fill it in.</p>';
    return;
  }
  el.innerHTML=keys.map(function(k){
    var dt=new Date(k+'T00:00:00'),idx=Math.round((dt-startDate())/86400000);
    var w=Math.floor(idx/7)+1,dow=((idx%7)+7)%7;
    var s=(idx>=0&&idx<112)?session(dow,w):null;
    var kind=S.log[k];
    return '<div class="test" style="display:flex;align-items:center;gap:10px">'+
      '<span class="dot" style="--c:'+(s?s.c:'var(--led-dim)')+';margin:0;flex:0 0 auto"></span>'+
      '<div style="flex:1;min-width:0">'+
        '<div class="n" style="margin:0">'+(s?s.title:'Outside the block')+'</div>'+
        '<div class="tiny" style="margin:0">'+dt.toLocaleDateString('en-GB',{day:'numeric',month:'short'})+
          (s?' · W'+w+' '+DAYS[dow]:'')+'</div>'+
      '</div>'+
      '<span style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:.1em;color:'+
        (kind==='full'?'var(--led-green)':'var(--led-yellow)')+'">'+(kind==='full'?'FULL':'MIN')+'</span>'+
      '<button class="btn sm ghost" data-del="'+k+'" aria-label="Remove log">✕</button>'+
    '</div>';
  }).join('');
  Array.prototype.forEach.call(el.querySelectorAll('[data-del]'),function(b){
    b.onclick=function(){delete S.log[b.dataset.del];save();renderToday();renderBoard();renderStats();renderHistory();};
  });
}

function renderTests(){
  var cols=['A','B','C','D'];
  var h='<div class="tin" style="margin-bottom:8px">'+cols.map(function(c){
    return '<div style="text-align:center;font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:.1em;color:var(--ink-3)">'+(c==='D'?'FINAL':'CYCLE '+c)+'</div>';
  }).join('')+'</div>';
  TESTS.forEach(function(t,i){
    h+='<div class="test"><div class="n">'+t[0]+' <em>'+t[1]+'</em></div><div class="tin">';
    cols.forEach(function(c){
      var v=(S.tests[c]||{})[i]||'';
      h+='<input value="'+v+'" placeholder="—" data-c="'+c+'" data-i="'+i+'" inputmode="decimal">';
    });
    h+='</div></div>';
  });
  document.getElementById('tests').innerHTML=h;
  Array.prototype.forEach.call(document.querySelectorAll('#tests input'),function(el){
    el.addEventListener('input',function(e){
      var c=e.target.dataset.c,i=e.target.dataset.i;
      S.tests[c]=S.tests[c]||{};S.tests[c][i]=e.target.value;save();
    });
  });
}

/* ---------- static ---------- */
function renderStatic(){
  document.getElementById('fuelTable').innerHTML=['hard','mod','rest'].map(function(k){
    var f=FUEL[k];
    return '<div class="test"><div class="n">'+f.t+'</div><div class="macros" style="margin-top:0">'+
      mac(f.kcal,'kcal')+mac(f.p+' g','protein')+mac(f.c+' g','carbs')+mac(f.f+' g','fat')+
      '</div><p class="tiny">'+f.n+'</p></div>';
  }).join('');
  document.getElementById('meals').innerHTML=MEALS.map(function(m){
    return '<div class="meal"><div class="t">'+m[0]+'</div><p>'+m[1]+'</p></div>';}).join('');
  document.getElementById('supps').innerHTML=SUPPS.map(function(m){
    return '<div class="test"><div class="n">'+m[0]+'</div><p class="tiny" style="margin-top:0">'+m[1]+'</p></div>';}).join('');
  document.getElementById('why').innerHTML=WHY.map(function(m,i){
    return '<button class="chip" style="--c:'+m[2]+'" data-why="'+i+'" aria-expanded="false" aria-controls="whyDetail">'+
      '<i class="dot" style="--c:'+m[2]+'"></i>'+m[0]+'</button>';}).join('');
  Array.prototype.forEach.call(document.querySelectorAll('[data-why]'),function(b){
    b.onclick=function(){toggleWhy(+b.dataset.why);};
  });
  toggleWhy(-1);
}
/* tap a keyword to open its explanation, tap it again to close it */
var whyOpen=-1;
function toggleWhy(i){
  whyOpen=(i===whyOpen)?-1:i;
  Array.prototype.forEach.call(document.querySelectorAll('[data-why]'),function(b){
    b.setAttribute('aria-expanded',String(+b.dataset.why===whyOpen));
  });
  var el=document.getElementById('whyDetail');
  if(whyOpen<0){el.innerHTML='';return;}
  var m=WHY[whyOpen];
  el.innerHTML='<div class="why-open" style="--c:'+m[2]+'"><div class="label">'+m[0]+'</div><p>'+m[1]+'</p></div>';
}

/* ---------- nav ---------- */
var VIEWS=['today','plan','log','eat','why'];
var TITLES={today:'',plan:'The plan',log:'Progress',eat:'Fuel',why:'Reasoning'};
function go(v){
  VIEWS.forEach(function(x){document.getElementById('view-'+x).classList.toggle('hide',x!==v);});
  Array.prototype.forEach.call(document.querySelectorAll('nav button'),function(b){
    b.classList.toggle('on',b.dataset.v===v);});
  if(v==='today')renderToday();
  if(v==='eat')renderEat();
  if(v==='log')renderBackupStatus();
  else{
    var cy=cycleOf(Math.max(1,Math.floor(Math.max(0,todayIdx())/7)+1));
    document.getElementById('hdrEyebrow').textContent='Cycle '+cy.id+' · '+cy.name;
    document.getElementById('hdrTitle').textContent=TITLES[v];
    document.getElementById('hdrPos').innerHTML='';
  }
  window.scrollTo({top:0});
}
Array.prototype.forEach.call(document.querySelectorAll('nav button'),function(b){
  b.onclick=function(){go(b.dataset.v);};
});

document.getElementById('btnExport').onclick=exportData;
document.getElementById('btnCopyBackup').onclick=function(){
  try{showBackupText(Backup.text(),Backup.filename());}catch(e){flash('Could not build the backup',true);}
};
document.getElementById('btnPasteBackup').onclick=restoreFromText;
document.getElementById('btnImport').onclick=function(){document.getElementById('fileImport').click();};
document.getElementById('fileImport').onchange=function(e){
  if(e.target.files&&e.target.files[0])importData(e.target.files[0]);
  e.target.value='';
};

/* ---------- boot ---------- */
function renderAll(){
  document.getElementById('inStart').value=S.start;
  renderSliders();renderVerdict();renderToday();
  renderBoard();renderStats();renderHistory();renderTests();renderStatic();
  renderEat();renderBackupStatus();
}
checkStorage();
initEat();
store.get().then(function(saved){
  if(saved){for(var k in saved){S[k]=saved[k];}}
  S.food=normalizeFood(S.food||{});
  renderAll();
}).catch(function(){renderAll();});
