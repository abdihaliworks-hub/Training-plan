/* ---------- food logging ----------
   Data lives in S.food and is saved/backed up with everything else:
   S.food.entries: [{id, date:'YYYY-MM-DD', time:ISO, name, foodId|null, source:'scan'|'manual'|'saved'|'quick',
                     amount, unit, grams|null, kcal, p, c, f, dayType:'hard'|'mod'|'rest'}]
   S.food.foods:   {id: {id, name, basis:'100g'|'100ml', per100:{kcal,p,c,f,fiber,sugar,satfat,salt},
                     servingG|null, source, createdAt, updatedAt, uses}}                                   */

var UNITS=[
  ['g','grams',1],['kg','kilograms',1000],['oz','ounces',28.3495],['lb','pounds',453.592],
  ['ml','millilitres',1],['dl','decilitres',100],['l','litres',1000],
  ['tsp','teaspoons · 5 ml',5],['tbsp','tablespoons · 15 ml',15],['cup','cups · 240 ml',240],
  ['fl oz','fluid ounces',29.5735],['serving','servings',null]
];
var VOLUME={ml:1,dl:1,l:1,tsp:1,tbsp:1,cup:1,'fl oz':1};
var MACRO_BARS=[['kcal','Calories','kcal','var(--led-yellow)'],['c','Carbs','g','var(--led-blue)'],
  ['p','Protein','g','var(--led-magenta)'],['f','Fat','g','var(--led-green)']];
var EAT={day:null,range:'week'};

function num(v){var n=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(n)?n:null;}
function r1(n){return Math.round(n*10)/10;}
function normalizeFood(food){
  var out={entries:[],foods:{}};
  (Array.isArray(food.entries)?food.entries:[]).forEach(function(e){
    if(!e||typeof e!=='object'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date))return;
    out.entries.push({id:e.id||uid(),date:e.date,time:e.time||null,name:String(e.name||'Food'),foodId:e.foodId||null,
      source:e.source||'manual',amount:num(e.amount),unit:e.unit||null,grams:num(e.grams),
      kcal:num(e.kcal)||0,p:num(e.p)||0,c:num(e.c)||0,f:num(e.f)||0,dayType:e.dayType||dayTypeOf(e.date)});
  });
  var foods=(food.foods&&typeof food.foods==='object')?food.foods:{};
  Object.keys(foods).forEach(function(id){
    var x=foods[id];if(!x||!x.per100)return;
    out.foods[id]={id:id,name:String(x.name||'Food'),basis:x.basis==='100ml'?'100ml':'100g',per100:x.per100,
      servingG:num(x.servingG),source:x.source||'manual',createdAt:x.createdAt||null,updatedAt:x.updatedAt||null,uses:x.uses||0};
  });
  return out;
}
function food(){if(!S.food||!Array.isArray(S.food.entries))S.food=normalizeFood(S.food||{});return S.food;}

/* ---- targets for a date, from the plan's day types ---- */
function dayTypeOf(ds){
  var idx=Math.round((new Date(ds+'T00:00:00')-startDate())/86400000);
  return fuelFor(((idx%7)+7)%7);
}
function rng(s){var p=String(s).split(/[–-]/).map(Number);return [p[0],p[1]||p[0]];}
function targetsFor(ds){
  var f=FUEL[dayTypeOf(ds)];
  return {type:f.t,kcal:rng(f.kcal),p:rng(f.p),c:rng(f.c),f:rng(f.f)};
}
function totalsFor(ds){
  var t={kcal:0,p:0,c:0,f:0,n:0};
  food().entries.forEach(function(e){if(e.date===ds){t.kcal+=e.kcal;t.p+=e.p;t.c+=e.c;t.f+=e.f;t.n++;}});
  return t;
}

/* ---- Eat tab ---- */
function renderEat(){
  if(!EAT.day)EAT.day=iso(new Date());
  var ds=EAT.day,today=iso(new Date()),tg=targetsFor(ds),tot=totalsFor(ds);
  var d=new Date(ds+'T00:00:00');
  document.getElementById('dayTitle').textContent=ds===today?'Today':d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'});
  document.getElementById('dayType').textContent=tg.type;
  document.getElementById('dayNext').disabled=(ds>=today);
  document.getElementById('dayNext').style.opacity=(ds>=today)?.3:1;
  document.getElementById('dayBars').innerHTML=MACRO_BARS.map(function(b){
    var v=tot[b[0]],lo=tg[b[0]][0],hi=tg[b[0]][1],max=hi*1.15;
    var left=v<lo?Math.round(lo-v):0,over=v>hi?Math.round(v-hi):0;
    var sub=v===0?'Target '+lo+'–'+hi+' '+b[2]
      :(over?over+' '+b[2]+' over':(left?left+' '+b[2]+' to go':'In range ✓'));
    return '<div class="bar"><div class="bar-top"><span class="k">'+b[1]+'</span>'+
      '<span class="v">'+Math.round(v)+' <small>/ '+lo+'–'+hi+' '+b[2]+'</small></span></div>'+
      '<div class="track" role="progressbar" aria-label="'+b[1]+'" aria-valuenow="'+Math.round(v)+'" aria-valuemin="0" aria-valuemax="'+hi+'">'+
        '<div class="zone" style="left:'+(lo/max*100)+'%;width:'+((hi-lo)/max*100)+'%"></div>'+
        '<div class="fill" style="--c:'+b[3]+';width:'+Math.min(100,v/max*100)+'%"></div></div>'+
      '<div class="bar-sub">'+sub+'</div></div>';
  }).join('');
  renderEntries(ds);
  renderTrend();
}
function renderEntries(ds){
  var list=food().entries.filter(function(e){return e.date===ds;})
    .sort(function(a,b){return String(a.time).localeCompare(String(b.time));});
  document.getElementById('dayCount').textContent=list.length?'· '+list.length:'';
  var el=document.getElementById('dayEntries');
  if(!list.length){el.innerHTML='<p class="tiny" style="margin:0">Nothing logged for this day yet. Scan a label, pick one of your foods, or type the macros in.</p>';return;}
  el.innerHTML=list.map(function(e){
    var t=e.time?new Date(e.time).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'';
    var amt=e.amount!=null&&e.unit?r1(e.amount)+' '+e.unit+' · ':'';
    return '<div class="entry"><div class="main"><div class="nm">'+esc(e.name)+'</div>'+
      '<div class="mx">'+(t?t+' · ':'')+amt+'P '+r1(e.p)+' · C '+r1(e.c)+' · F '+r1(e.f)+'</div></div>'+
      '<div class="kc">'+Math.round(e.kcal)+'<span class="tiny"> kcal</span></div>'+
      '<button class="btn sm ghost" data-delentry="'+e.id+'" aria-label="Remove '+esc(e.name)+'">✕</button></div>';
  }).join('');
  Array.prototype.forEach.call(el.querySelectorAll('[data-delentry]'),function(b){
    b.onclick=function(){
      var f=food();f.entries=f.entries.filter(function(e){return e.id!==b.dataset.delentry;});
      save();renderEat();
    };
  });
}
function shiftDay(n){
  var d=new Date(EAT.day+'T00:00:00');d.setDate(d.getDate()+n);
  var ds=iso(d);if(ds>iso(new Date()))return;
  EAT.day=ds;renderEat();
}

/* ---- trends: week / month / year ---- */
function dailyTotals(){
  var m={};
  food().entries.forEach(function(e){
    var t=m[e.date]||(m[e.date]={kcal:0,p:0,c:0,f:0});
    t.kcal+=e.kcal;t.p+=e.p;t.c+=e.c;t.f+=e.f;
  });
  return m;
}
function renderTrend(){
  var days=dailyTotals(),pts=[],now=new Date();now.setHours(0,0,0,0);
  var i,d,ds;
  if(EAT.range==='year'){
    for(i=11;i>=0;i--){
      var y=now.getFullYear(),mo=now.getMonth()-i;
      var first=new Date(y,mo,1),key=first.getFullYear()+'-'+String(first.getMonth()+1).padStart(2,'0');
      var sum={kcal:0,p:0,c:0,f:0},n=0;
      Object.keys(days).forEach(function(k){if(k.slice(0,7)===key){var t=days[k];sum.kcal+=t.kcal;sum.p+=t.p;sum.c+=t.c;sum.f+=t.f;n++;}});
      pts.push({label:first.toLocaleDateString('en-GB',{month:'short'}),full:first.toLocaleDateString('en-GB',{month:'long',year:'numeric'}),
        v:n?sum.kcal/n:null,p:n?sum.p/n:0,c:n?sum.c/n:0,f:n?sum.f/n:0,n:n,band:null});
    }
  }else{
    var len=EAT.range==='week'?7:30;
    for(i=len-1;i>=0;i--){
      d=new Date(now);d.setDate(d.getDate()-i);ds=iso(d);
      var t=days[ds],tg=targetsFor(ds);
      pts.push({label:len===7?DAYS[(d.getDay()+6)%7]:String(d.getDate()),
        full:d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}),
        v:t?t.kcal:null,p:t?t.p:0,c:t?t.c:0,f:t?t.f:0,n:t?1:0,band:tg.kcal});
    }
  }
  /* summary over days that actually have food logged */
  var logged=pts.filter(function(p){return p.v!=null;});
  var dayCount=EAT.range==='year'?logged.reduce(function(a,p){return a+p.n;},0):logged.length;
  var avg=function(k){
    if(EAT.range==='year'){var n=0,s=0;logged.forEach(function(p){s+=(k==='v'?p.v:p[k])*p.n;n+=p.n;});return n?s/n:null;}
    return logged.length?logged.reduce(function(a,p){return a+(k==='v'?p.v:p[k]);},0)/logged.length:null;
  };
  var a=avg('v');
  document.getElementById('trendStats').innerHTML=
    '<div class="stat"><div class="v">'+(a!=null?Math.round(a):'—')+'</div><div class="k">avg kcal / day</div></div>'+
    '<div class="stat"><div class="v">'+(a!=null?Math.round(avg('p')):'—')+'<span style="font-size:13px;color:var(--ink-3)"> g</span></div><div class="k">avg protein</div></div>'+
    '<div class="stat"><div class="v">'+dayCount+'</div><div class="k">days logged</div></div>';
  document.getElementById('trendNote').textContent=logged.length
    ?'Averages count only days with food logged. Shaded bands are each day’s calorie target. Tap a bar for details.'
    :'Log some food and your averages will build up here.';
  drawChart(pts);
}
function drawChart(pts){
  var W=600,H=210,L=38,R=6,T=10,B=24,el=document.getElementById('trendChart');
  var top=0;pts.forEach(function(p){top=Math.max(top,p.v||0,p.band?p.band[1]:0);});
  top=Math.max(1000,Math.ceil(top*1.08/500)*500);
  var step=top>3000?1000:500,y=function(v){return T+(H-T-B)*(1-v/top);};
  var bw=(W-L-R)/pts.length,gap=Math.max(2,bw*0.22),s='';
  for(var g=0;g<=top;g+=step)
    s+='<line class="grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(g)+'" y2="'+y(g)+'"/>'+
       '<text class="axis" x="'+(L-6)+'" y="'+(y(g)+3)+'" text-anchor="end">'+(g>=1000?(g/1000)+'k':g)+'</text>';
  var labelEvery=pts.length>14?5:1;
  pts.forEach(function(p,i){
    var x=L+i*bw+gap/2,w=bw-gap;
    if(p.band)s+='<rect class="band" x="'+(L+i*bw)+'" width="'+bw+'" y="'+y(p.band[1])+'" height="'+(y(p.band[0])-y(p.band[1]))+'"/>';
    if(p.v!=null&&p.v>0){
      var h=Math.max(2,y(0)-y(p.v)),rr=Math.min(4,w/2);
      /* rounded top, square base */
      s+='<path class="bar-r" data-i="'+i+'" d="M'+x+','+y(0)+'V'+(y(0)-h+rr)+'Q'+x+','+(y(0)-h)+' '+(x+rr)+','+(y(0)-h)+
        'H'+(x+w-rr)+'Q'+(x+w)+','+(y(0)-h)+' '+(x+w)+','+(y(0)-h+rr)+'V'+y(0)+'Z"/>';
    }
    if(i%labelEvery===0||i===pts.length-1)
      s+='<text class="axis" x="'+(L+i*bw+bw/2)+'" y="'+(H-6)+'" text-anchor="middle">'+p.label+'</text>';
    s+='<rect class="hit" data-i="'+i+'" x="'+(L+i*bw)+'" y="'+T+'" width="'+bw+'" height="'+(H-T-B)+'"/>';
  });
  el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Calories per '+(EAT.range==='year'?'month':'day')+'">'+s+'</svg><div class="tip hide" id="tip"></div>';
  var tip=document.getElementById('tip'),svg=el.querySelector('svg');
  function show(i){
    var p=pts[i];
    Array.prototype.forEach.call(el.querySelectorAll('.bar-r'),function(b){b.classList.toggle('sel',+b.dataset.i===i);});
    tip.innerHTML='<b>'+(p.v!=null?Math.round(p.v)+' kcal':'nothing logged')+'</b>'+
      '<span>'+p.full+(EAT.range==='year'&&p.n?' · avg of '+p.n+' days':'')+'</span>'+
      (p.v!=null?'<span>P '+Math.round(p.p)+' · C '+Math.round(p.c)+' · F '+Math.round(p.f)+' g</span>':'')+
      (p.band?'<span>Target '+p.band[0]+'–'+p.band[1]+'</span>':'');
    var sc=svg.getBoundingClientRect().width/W;
    var cx=(L+i*bw+bw/2)*sc,cy=y(Math.max(p.v||0,p.band?p.band[1]:0))*sc-6;
    tip.style.left=Math.max(70,Math.min(el.clientWidth-70,cx))+'px';tip.style.top=Math.max(40,cy)+'px';
    tip.classList.remove('hide');
  }
  Array.prototype.forEach.call(el.querySelectorAll('.hit'),function(h){
    h.addEventListener('mouseenter',function(){show(+h.dataset.i);});
    h.addEventListener('click',function(){show(+h.dataset.i);});
  });
  svg.addEventListener('mouseleave',function(){tip.classList.add('hide');
    Array.prototype.forEach.call(el.querySelectorAll('.bar-r'),function(b){b.classList.remove('sel');});});
}

/* ---- bottom sheet ---- */
function openSheet(title,html){
  document.getElementById('sheetTitle').textContent=title;
  document.getElementById('sheetBody').innerHTML=html;
  document.getElementById('sheet').classList.remove('hide');
  document.getElementById('sheetBg').classList.remove('hide');
  document.body.classList.add('noscroll');
  document.getElementById('sheet').scrollTop=0;
}
function closeSheet(){
  document.getElementById('sheet').classList.add('hide');
  document.getElementById('sheetBg').classList.add('hide');
  document.body.classList.remove('noscroll');
  OCR.onProgress=null;
}

/* ---- scanning ---- */
var scanToken=0;
function startScan(file){
  var token=++scanToken,url=URL.createObjectURL(file);
  openSheet('Reading the label',
    '<img class="preview" src="'+url+'" alt="Your photo">'+
    '<div class="spinner"></div><p class="center tiny" id="scanMsg" style="margin:0">Analysing the nutrition table…</p>'+
    '<div class="progress"><i id="scanBar"></i></div>');
  OCR.read(file,function(m){
    if(token!==scanToken)return;
    var msg=document.getElementById('scanMsg'),bar=document.getElementById('scanBar');
    if(!msg||!bar)return;
    if(m.status==='recognizing text'){msg.textContent='Reading numbers… '+Math.round(m.progress*100)+'%';bar.style.width=(m.progress*100)+'%';}
    else if(m.status==='second look'){msg.textContent='Taking a closer look…';bar.style.width='0%';}
    else if(/load|initializ/.test(m.status||''))msg.textContent='Starting the label reader (first time takes a few seconds)…';
  }).then(function(res){
    if(token!==scanToken)return;
    URL.revokeObjectURL(url);
    if(res.parsed.ok){
      foodForm({title:'Check the values',source:'scan',editable:true,
        food:{name:'',basis:res.parsed.basis,per100:res.parsed.per100},
        intro:'Found: '+res.parsed.found.join(', ')+'. Compare with the label and fix anything that’s off.',
        warn:res.parsed.warn,guessed:res.parsed.guessed,rawText:res.text});
    }else scanFailed(res.text);
  }).catch(function(e){
    if(token!==scanToken)return;
    URL.revokeObjectURL(url);
    scanFailed('',e);
  });
}
function scanFailed(text,err){
  openSheet('Couldn’t read that label',
    '<p class="tiny" style="margin-top:0">'+(err?'The label reader hit a problem: '+esc(err.message||err)+'.':
      'The nutrition table wasn’t clear enough. Tips: fill the frame with just the table, avoid glare, hold steady, good light.')+'</p>'+
    '<div class="btnrow"><button class="btn" id="scAgain" style="--c:var(--led-yellow)">Try another photo</button>'+
    '<button class="btn ghost" id="scManual">Type it in</button></div>'+
    (text?'<details><summary>What the reader saw</summary><pre class="tiny" style="white-space:pre-wrap">'+esc(text)+'</pre></details>':''));
  document.getElementById('scAgain').onclick=function(){document.getElementById('fileScan').click();};
  document.getElementById('scManual').onclick=function(){
    foodForm({title:'Enter the label',source:'manual',editable:true,food:{name:'',basis:'100g',per100:{}}});
  };
}

/* ---- the food form: per-100 values + amount + unit -> macros ---- */
function unitOptions(sel,basis){
  return UNITS.map(function(u){
    var isSel=sel?u[0]===sel:u[0]===(basis==='100ml'?'ml':'g');
    return '<option value="'+u[0]+'"'+(isSel?' selected':'')+'>'+u[0]+' — '+u[1]+'</option>';
  }).join('');
}
function gramsFor(amount,unit,servingG){
  if(amount==null)return null;
  if(unit==='serving')return servingG?amount*servingG:null;
  for(var i=0;i<UNITS.length;i++)if(UNITS[i][0]===unit)return amount*UNITS[i][2];
  return null;
}
function foodForm(o){
  var fd=o.food,p=fd.per100||{},ed=o.editable;
  var v=function(x){return x==null?'':x;};
  var field=function(id,label,val,extra){
    return '<div class="field"><label for="'+id+'">'+label+'</label><input type="number" step="any" min="0" inputmode="decimal" id="'+id+'" value="'+v(val)+'"'+(extra||'')+'></div>';
  };
  var per=fd.basis==='100ml'?'100 ml':'100 g';
  var html=(o.intro?'<p class="tiny" style="margin-top:0">'+esc(o.intro)+'</p>':'')+
    (o.warn?'<p class="flag">⚠ '+esc(o.warn)+'</p>':'')+
    '<div class="field"><label for="ffName">Name</label><input type="text" id="ffName" value="'+esc(fd.name||'')+'" placeholder="e.g. Havregryn" autocomplete="off"'+(ed?'':' readonly')+'></div>'+
    (ed?'<div class="label mt">Per <select id="ffBasis" class="input" style="width:auto;display:inline-block;padding:4px 8px;font-size:12px"><option value="100g"'+(fd.basis!=='100ml'?' selected':'')+'>100 g</option><option value="100ml"'+(fd.basis==='100ml'?' selected':'')+'>100 ml</option></select></div>'
       :'<div class="label mt">Per '+per+'</div>')+
    '<div class="grid4">'+
      field('ffKcal','kcal',p.kcal,ed?'':' readonly')+field('ffC','carbs',p.c,ed?'':' readonly')+
      field('ffP','protein',p.p,ed?'':' readonly')+field('ffF','fat',p.f,ed?'':' readonly')+
    '</div>'+
    '<div class="label mt">How much did you eat?</div>'+
    '<div class="grid2">'+
      field('ffAmt','amount',o.amount!=null?o.amount:'',' autofocus')+
      '<div class="field"><label for="ffUnit">unit</label><select id="ffUnit">'+unitOptions(o.unit,fd.basis)+'</select></div>'+
    '</div>'+
    '<div class="field mt" id="ffServWrap"><label for="ffServ">1 serving = grams</label><input type="number" step="any" min="0" inputmode="decimal" id="ffServ" value="'+v(fd.servingG)+'"></div>'+
    '<div class="totals" id="ffTotals"></div><p class="tiny" id="ffHint"></p>'+
    (o.source!=='saved'?'<label class="check"><input type="checkbox" id="ffSave" checked> Save to My foods for next time</label>':'')+
    '<div class="btnrow"><button class="btn" id="ffAdd" style="--c:var(--led-green)">Add to '+(EAT.day===iso(new Date())?'today':'this day')+'</button></div>'+
    (o.rawText?'<details><summary>What the reader saw</summary><pre class="tiny" style="white-space:pre-wrap">'+esc(o.rawText)+'</pre></details>':'');
  openSheet(o.title,html);

  var $=function(id){return document.getElementById(id);};
  function per100(){return {kcal:num($('ffKcal').value),p:num($('ffP').value),c:num($('ffC').value),f:num($('ffF').value)};}
  function calc(){
    var pv=per100(),amt=num($('ffAmt').value),unit=$('ffUnit').value,serv=num($('ffServ').value);
    $('ffServWrap').classList.toggle('hide',unit!=='serving'&&!(ed&&serv));
    var g=gramsFor(amt,unit,serv);
    if(pv.kcal==null&&pv.p!=null&&pv.c!=null&&pv.f!=null)pv.kcal=pv.p*4+pv.c*4+pv.f*9;
    var k=g==null?null:g/100;
    var t={kcal:k!=null&&pv.kcal!=null?pv.kcal*k:null,c:k!=null&&pv.c!=null?pv.c*k:null,p:k!=null&&pv.p!=null?pv.p*k:null,f:k!=null&&pv.f!=null?pv.f*k:null};
    $('ffTotals').innerHTML=mac(t.kcal==null?'—':Math.round(t.kcal),'kcal')+mac(t.c==null?'—':r1(t.c)+' g','carbs')+
      mac(t.p==null?'—':r1(t.p)+' g','protein')+mac(t.f==null?'—':r1(t.f)+' g','fat');
    var basis=ed?$('ffBasis').value:fd.basis;
    $('ffHint').textContent=unit==='serving'&&!serv?'Set how many grams one serving is.'
      :(VOLUME[unit]&&basis==='100g'?'Volume is converted as 1 ml ≈ 1 g. Fine for drinks and yoghurt; less exact for oil or flour.':
        (!VOLUME[unit]&&unit!=='serving'&&basis==='100ml'?'Weight is converted as 1 g ≈ 1 ml.':''));
    return {pv:pv,amt:amt,unit:unit,serv:serv,g:g,t:t,basis:basis};
  }
  ['ffKcal','ffP','ffC','ffF','ffAmt','ffServ'].forEach(function(id){$(id).addEventListener('input',calc);});
  $('ffUnit').addEventListener('change',calc);
  if(ed)$('ffBasis').addEventListener('change',function(){
    var u=$('ffUnit').value;if(u==='g'||u==='ml')$('ffUnit').value=this.value==='100ml'?'ml':'g';calc();});
  (o.guessed||[]).forEach(function(k){var el=$({kcal:'ffKcal',p:'ffP',c:'ffC',f:'ffF'}[k]);if(el)el.classList.add('guess');});
  calc();
  setTimeout(function(){var a=$('ffAmt');if(a&&!o.amount)a.focus();},200);

  $('ffAdd').onclick=function(){
    var r=calc(),name=$('ffName').value.trim();
    if(r.amt==null||r.amt<=0){$('ffHint').innerHTML='<span class="err">Enter how much you ate.</span>';return;}
    if(r.g==null){$('ffHint').innerHTML='<span class="err">Set the serving size in grams.</span>';return;}
    if(r.t.kcal==null){$('ffHint').innerHTML='<span class="err">Enter at least kcal, or all three macros.</span>';return;}
    var f=food(),now=new Date().toISOString(),fid=o.foodId||null;
    var keep=$('ffSave')&&$('ffSave').checked&&name;
    if(keep){
      var existing=null;
      Object.keys(f.foods).forEach(function(id){if(f.foods[id].name.toLowerCase()===name.toLowerCase())existing=id;});
      fid=existing||uid();
      var prev=f.foods[fid]||{createdAt:now,uses:0};
      f.foods[fid]={id:fid,name:name,basis:r.basis,
        per100:{kcal:r.pv.kcal,p:r.pv.p||0,c:r.pv.c||0,f:r.pv.f||0,fiber:(fd.per100||{}).fiber,sugar:(fd.per100||{}).sugar,satfat:(fd.per100||{}).satfat,salt:(fd.per100||{}).salt},
        servingG:r.serv,source:prev.source||o.source,createdAt:prev.createdAt,updatedAt:now,uses:prev.uses||0};
    }
    if(fid&&f.foods[fid]){f.foods[fid].uses=(f.foods[fid].uses||0)+1;if(r.serv&&!f.foods[fid].servingG)f.foods[fid].servingG=r.serv;}
    addEntry({name:name||'Food',foodId:fid,source:o.source,amount:r.amt,unit:r.unit,grams:r1(r.g),
      kcal:r1(r.t.kcal),p:r1(r.t.p||0),c:r1(r.t.c||0),f:r1(r.t.f||0)});
    closeSheet();
  };
}
function addEntry(e){
  var ds=EAT.day||iso(new Date()),today=iso(new Date());
  e.id=uid();e.date=ds;e.dayType=dayTypeOf(ds);
  e.time=ds===today?new Date().toISOString():new Date(ds+'T12:00:00').toISOString();
  food().entries.push(e);
  save();renderEat();
}

/* ---- quick macros (no label, just totals) ---- */
function quickForm(){
  openSheet('Quick macros',
    '<p class="tiny" style="margin-top:0">For meals without a label. Leave kcal empty and it’s calculated from the macros.</p>'+
    '<div class="field"><label for="qName">What was it?</label><input type="text" id="qName" placeholder="e.g. Lunch at work" autocomplete="off"></div>'+
    '<div class="grid4 mt">'+
      ['qKcal|kcal','qC|carbs g','qP|protein g','qF|fat g'].map(function(x){x=x.split('|');
        return '<div class="field"><label for="'+x[0]+'">'+x[1]+'</label><input type="number" step="any" min="0" inputmode="decimal" id="'+x[0]+'"></div>';}).join('')+
    '</div><p class="tiny" id="qHint"></p>'+
    '<div class="btnrow"><button class="btn" id="qAdd" style="--c:var(--led-green)">Add</button></div>');
  var $=function(id){return document.getElementById(id);};
  function vals(){var p=num($('qP').value)||0,c=num($('qC').value)||0,f=num($('qF').value)||0,k=num($('qKcal').value);
    if(k==null)k=p*4+c*4+f*9;return {kcal:k,p:p,c:c,f:f};}
  ['qKcal','qP','qC','qF'].forEach(function(id){$(id).addEventListener('input',function(){
    var v=vals();$('qHint').textContent=num($('qKcal').value)==null&&v.kcal?'≈ '+Math.round(v.kcal)+' kcal from macros':'';});});
  $('qAdd').onclick=function(){
    var v=vals();
    if(!v.kcal){$('qHint').innerHTML='<span class="err">Enter kcal or some macros.</span>';return;}
    addEntry({name:$('qName').value.trim()||'Quick add',foodId:null,source:'quick',amount:null,unit:null,grams:null,
      kcal:r1(v.kcal),p:r1(v.p),c:r1(v.c),f:r1(v.f)});
    closeSheet();
  };
  setTimeout(function(){var q=$('qName');if(q)q.focus();},200);
}

/* ---- My foods ---- */
function foodsSheet(){
  openSheet('My foods',
    '<div class="field"><input type="search" id="fsQ" placeholder="Search your foods" autocomplete="off" aria-label="Search your foods"></div>'+
    '<div id="fsList" class="mt"></div>'+
    '<div class="btnrow"><button class="btn ghost" id="fsNew">+ New food by hand</button></div>');
  var q=document.getElementById('fsQ');
  function draw(){
    var term=q.value.trim().toLowerCase(),f=food();
    var list=Object.keys(f.foods).map(function(id){return f.foods[id];})
      .filter(function(x){return !term||x.name.toLowerCase().indexOf(term)>=0;})
      .sort(function(a,b){return (b.uses||0)-(a.uses||0)||a.name.localeCompare(b.name);});
    var el=document.getElementById('fsList');
    if(!list.length){el.innerHTML='<p class="tiny" style="margin:0">'+(term?'No match.':'No saved foods yet. Every label you scan is saved here, so next time it’s one tap.')+'</p>';return;}
    el.innerHTML=list.map(function(x){
      var p=x.per100;
      return '<div class="food-row"><button class="main" data-pick="'+x.id+'"><div class="nm">'+esc(x.name)+'</div>'+
        '<div class="mx">per '+(x.basis==='100ml'?'100 ml':'100 g')+': '+Math.round(p.kcal||0)+' kcal · C '+r1(p.c||0)+' · P '+r1(p.p||0)+' · F '+r1(p.f||0)+'</div></button>'+
        '<button class="btn sm ghost" data-edit="'+x.id+'" aria-label="Edit '+esc(x.name)+'">Edit</button>'+
        '<button class="btn sm ghost" data-del="'+x.id+'" aria-label="Delete '+esc(x.name)+'">✕</button></div>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('[data-pick]'),function(b){b.onclick=function(){
      var x=food().foods[b.dataset.pick];
      foodForm({title:x.name,source:'saved',editable:false,food:x,foodId:x.id,unit:x.servingG?'serving':null,amount:x.servingG?1:null});
    };});
    Array.prototype.forEach.call(el.querySelectorAll('[data-edit]'),function(b){b.onclick=function(){editFood(b.dataset.edit);};});
    Array.prototype.forEach.call(el.querySelectorAll('[data-del]'),function(b){b.onclick=function(){
      var x=food().foods[b.dataset.del];
      if(!confirm('Delete "'+x.name+'" from My foods? Days you already logged keep their numbers.'))return;
      delete food().foods[b.dataset.del];save();draw();
    };});
  }
  q.addEventListener('input',draw);draw();
  document.getElementById('fsNew').onclick=function(){
    foodForm({title:'New food',source:'manual',editable:true,food:{name:'',basis:'100g',per100:{}}});
  };
}
function editFood(id){
  var x=food().foods[id],p=x.per100;
  openSheet('Edit food',
    '<div class="field"><label for="efName">Name</label><input type="text" id="efName" value="'+esc(x.name)+'"></div>'+
    '<div class="label mt">Per '+(x.basis==='100ml'?'100 ml':'100 g')+'</div><div class="grid4">'+
    [['efKcal','kcal',p.kcal],['efC','carbs',p.c],['efP','protein',p.p],['efF','fat',p.f]].map(function(a){
      return '<div class="field"><label for="'+a[0]+'">'+a[1]+'</label><input type="number" step="any" min="0" inputmode="decimal" id="'+a[0]+'" value="'+(a[2]==null?'':a[2])+'"></div>';}).join('')+
    '</div><div class="field mt"><label for="efServ">1 serving = grams (optional)</label><input type="number" step="any" min="0" inputmode="decimal" id="efServ" value="'+(x.servingG||'')+'"></div>'+
    '<div class="btnrow"><button class="btn" id="efSave" style="--c:var(--led-green)">Save</button><button class="btn ghost" id="efBack">Back</button></div>');
  var $=function(i){return document.getElementById(i);};
  $('efBack').onclick=foodsSheet;
  $('efSave').onclick=function(){
    x.name=$('efName').value.trim()||x.name;
    x.per100.kcal=num($('efKcal').value);x.per100.c=num($('efC').value)||0;x.per100.p=num($('efP').value)||0;x.per100.f=num($('efF').value)||0;
    x.servingG=num($('efServ').value);x.updatedAt=new Date().toISOString();
    save();foodsSheet();
  };
}

/* ---- wiring ---- */
function initEat(){
  document.getElementById('dayPrev').onclick=function(){shiftDay(-1);};
  document.getElementById('dayNext').onclick=function(){shiftDay(1);};
  document.getElementById('btnScan').onclick=function(){document.getElementById('fileScan').click();};
  document.getElementById('fileScan').onchange=function(e){
    var f=e.target.files&&e.target.files[0];e.target.value='';
    if(f)startScan(f);
  };
  document.getElementById('btnFoods').onclick=foodsSheet;
  document.getElementById('btnQuick').onclick=quickForm;
  document.getElementById('sheetClose').onclick=closeSheet;
  document.getElementById('sheetBg').onclick=closeSheet;
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSheet();});
  Array.prototype.forEach.call(document.querySelectorAll('#trendTabs button'),function(b){
    b.onclick=function(){
      EAT.range=b.dataset.r;
      Array.prototype.forEach.call(document.querySelectorAll('#trendTabs button'),function(x){x.classList.toggle('on',x===b);});
      renderTrend();
    };
  });
}
