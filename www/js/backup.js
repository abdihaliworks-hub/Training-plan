/* ---------- backup: export / restore / automatic file backups ----------
   Why this is careful: the old export created a blob: link and clicked it. Android
   WebViews (the app wrappers) can't download blob: links — that is what crashed.
   Now every path has a fallback, and the last fallback (copy as text) always works.

   Inside the Android app:   writes the JSON to Documents/TenacityTendons/ on the phone,
                             then opens the share sheet (Drive, e-mail, Files…).
                             Also writes an automatic daily backup there after every change.
   In a mobile browser:      share sheet with the file, else a normal download.
   In an app wrapper:        shows the backup as text with a Copy button.            */

var BACKUP_DIR='TenacityTendons';
var STATUS_KEY='board-backup-status';
var Backup={
  build:function(){
    var food=S.food||{entries:[],foods:{}};
    return {
      app:'tenacity-tendons',
      kind:'full-backup',
      schemaVersion:SCHEMA_VERSION,
      appVersion:APP_VERSION,
      exportedAt:new Date().toISOString(),
      timezone:(Intl.DateTimeFormat().resolvedOptions().timeZone||''),
      platform:NATIVE?'android-app':'web',
      counts:{
        daysLogged:Object.keys(S.log||{}).length,
        readinessDays:Object.keys(S.ready||{}).length,
        foodEntries:(food.entries||[]).length,
        savedFoods:Object.keys(food.foods||{}).length,
        bandDays:Object.keys(S.vitals||{}).length
      },
      units:{energy:'kcal',protein:'g',carbs:'g',fat:'g',amounts:'grams (converted from the unit logged)',
        restingHR:'bpm',hrv:'ms',sleep:'minutes asleep',steps:'count'},
      data:S
    };
  },
  text:function(){return JSON.stringify(Backup.build(),null,2);},
  filename:function(){return 'tenacitytendons-backup-'+iso(new Date())+'.json';},

  status:function(){try{return JSON.parse(localStorage.getItem(STATUS_KEY))||{};}catch(e){return {};}},
  setStatus:function(o){
    var s=Backup.status();for(var k in o)s[k]=o[k];
    try{localStorage.setItem(STATUS_KEY,JSON.stringify(s));}catch(e){}
    renderBackupStatus();
  },

  /* ---- native file helpers ---- */
  ensurePerm:function(){
    if(!NATIVE)return Promise.resolve();
    return Native.fs.checkPermissions().then(function(p){
      if(p&&p.publicStorage==='granted')return;
      return Native.fs.requestPermissions();
    }).catch(function(){});
  },
  writeNative:function(path,text){
    return Backup.ensurePerm().then(function(){
      return Native.fs.writeFile({path:path,data:text,directory:'DOCUMENTS',encoding:'utf8',recursive:true});
    });
  },

  /* ---- automatic backup (Android app): one file per day, newest 30 kept ---- */
  autoT:null,
  scheduleAuto:function(){
    if(!NATIVE)return;
    clearTimeout(Backup.autoT);
    Backup.autoT=setTimeout(Backup.runAuto,4000);
  },
  runAuto:function(){
    var text;try{text=Backup.text();}catch(e){return;}
    var dir=BACKUP_DIR+'/auto',name='backup-'+iso(new Date())+'.json';
    return Backup.writeNative(dir+'/'+name,text)
      .catch(function(){ /* file may belong to a previous install — write a fresh name instead */
        name='backup-'+iso(new Date())+'-'+Date.now()+'.json';
        return Backup.writeNative(dir+'/'+name,text);
      })
      .then(function(){
        Backup.setStatus({autoAt:new Date().toISOString(),autoPath:'Documents/'+dir+'/'+name,autoError:null});
        return Backup.prune(dir);
      })
      .catch(function(e){Backup.setStatus({autoError:String(e&&e.message||e)});});
  },
  prune:function(dir){
    return Native.fs.readdir({path:dir,directory:'DOCUMENTS'}).then(function(r){
      var names=(r.files||[]).map(function(f){return typeof f==='string'?f:f.name;})
        .filter(function(n){return /^backup-.*\.json$/.test(n);}).sort();
      var old=names.slice(0,Math.max(0,names.length-30));
      return Promise.all(old.map(function(n){
        return Native.fs.deleteFile({path:dir+'/'+n,directory:'DOCUMENTS'}).catch(function(){});
      }));
    }).catch(function(){});
  }
};

/* Android System WebView inside some other app (the old APK wrappers) */
function inWrapper(){return !NATIVE&&/; wv\)/.test(navigator.userAgent);}
function isMobile(){return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);}

function exportData(){
  var text,name=Backup.filename();
  try{text=Backup.text();}
  catch(e){flash('Could not build the backup',true);return;}
  var p;
  if(NATIVE)p=exportNative(text,name);
  else if(inWrapper())p=Promise.reject(new Error('This app wrapper cannot save files.'));
  else p=exportWeb(text,name);
  p.then(function(where){
    Backup.setStatus({manualAt:new Date().toISOString(),manualWhere:where||''});
    flash('Backup exported');
  }).catch(function(err){
    if(err&&err.name==='AbortError')return; /* user closed the share sheet */
    showBackupText(text,name,err);
  });
}
function exportNative(text,name){
  var path=BACKUP_DIR+'/'+name;
  return Backup.writeNative(path,text).then(function(){
    return Native.fs.getUri({path:path,directory:'DOCUMENTS'}).then(function(r){
      return Native.share.share({title:'Board backup',dialogTitle:'Save or send your backup',files:[r.uri]})
        .catch(function(){}); /* closing the share sheet is fine — the file is already saved */
    }).then(function(){return 'Documents/'+path;});
  });
}
function exportWeb(text,name){
  /* phones: share sheet with the file (Save to Drive / Files / e-mail) */
  try{
    if(isMobile()&&navigator.canShare&&window.File){
      var file=new File([text],name,{type:'application/json'});
      if(navigator.canShare({files:[file]}))
        return navigator.share({files:[file],title:'Board backup'}).then(function(){return 'shared';});
    }
  }catch(e){}
  /* everything else: ordinary download */
  return new Promise(function(resolve,reject){
    try{
      var url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
      var a=document.createElement('a');
      a.href=url;a.download=name;a.rel='noopener';
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      setTimeout(function(){URL.revokeObjectURL(url);},60000);
      resolve('Downloads/'+name);
    }catch(e){reject(e);}
  });
}

/* last-resort: show the JSON so it can be copied anywhere (notes, e-mail, Drive) */
function showBackupText(text,name,err){
  openSheet('Copy your backup',
    (err?'<p class="tiny" style="margin-top:0">Saving a file didn’t work here'+(err.message?' ('+esc(err.message)+')':'')+'. Copy the text below instead and paste it into a note, an e-mail to yourself, or a file called <b>'+esc(name)+'</b>.</p>'
        :'<p class="tiny" style="margin-top:0">This is your whole backup as text. Paste it somewhere safe. To restore, use <b>Restore from text</b>.</p>')+
    '<textarea id="bkText" readonly></textarea>'+
    '<div class="btnrow"><button class="btn" id="bkCopy" style="--c:var(--led-green)">Copy</button>'+
    (navigator.share?'<button class="btn ghost" id="bkShare">Share as text</button>':'')+'</div>');
  var ta=document.getElementById('bkText');ta.value=text;
  document.getElementById('bkCopy').onclick=function(){
    copyText(text,ta).then(function(ok){
      if(ok){Backup.setStatus({manualAt:new Date().toISOString(),manualWhere:'copied as text'});flash('Copied');}
      else flash('Select the text and copy it manually',true);
    });
  };
  var sh=document.getElementById('bkShare');
  if(sh)sh.onclick=function(){navigator.share({title:name,text:text}).catch(function(){});};
}
function copyText(text,ta){
  if(navigator.clipboard&&navigator.clipboard.writeText)
    return navigator.clipboard.writeText(text).then(function(){return true;},function(){return legacyCopy(ta);});
  return Promise.resolve(legacyCopy(ta));
}
function legacyCopy(ta){
  try{ta.removeAttribute('readonly');ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);
    var ok=document.execCommand('copy');ta.setAttribute('readonly','');return ok;}catch(e){return false;}
}

/* ---------- restore ---------- */
function parseBackup(text){
  var o=JSON.parse(String(text).replace(/^﻿/,''));
  var d=(o&&o.app==='tenacity-tendons'&&o.data)?o.data:o; /* new wrapped format, or an old raw export */
  if(!d||typeof d!=='object'||Array.isArray(d))throw new Error('This is not a backup from this app.');
  var out={},found=false;
  if(typeof d.start==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.start)){out.start=d.start;found=true;}
  ['log','ready','tests','vitals'].forEach(function(k){
    if(d[k]&&typeof d[k]==='object'&&!Array.isArray(d[k])){out[k]=d[k];found=true;}
  });
  if(d.food&&typeof d.food==='object'){out.food=normalizeFood(d.food);found=true;}
  if(!found)throw new Error('No training data found in this file.');
  return out;
}
function applyRestore(data){
  var n=Object.keys(data.log||{}).length,f=((data.food||{}).entries||[]).length;
  if(!confirm('Replace the data on this device with this backup?\n\n'+n+' logged days · '+f+' food entries'))return;
  try{localStorage.setItem(KEY+'.before-restore',JSON.stringify(S));}catch(e){}
  for(var k in data)S[k]=data[k];
  if(!S.food)S.food={entries:[],foods:{}};
  store.set(S).then(function(){
    renderAll();closeSheet();
    flash(SAVE_ERROR?'Restored, but saving failed':'Backup restored',!!SAVE_ERROR);
    Backup.scheduleAuto();
  });
}
function importData(file){
  var r=new FileReader();
  r.onload=function(){
    try{applyRestore(parseBackup(r.result));}
    catch(e){alert('That file could not be read. '+(e&&e.message?e.message:'It needs to be a backup exported from this app.'));}
  };
  r.onerror=function(){alert('That file could not be opened.');};
  r.readAsText(file);
}
function restoreFromText(){
  openSheet('Restore from text',
    '<p class="tiny" style="margin-top:0">Paste the backup text you copied earlier.</p>'+
    '<textarea id="rsText" placeholder="{ &quot;app&quot;: &quot;tenacity-tendons&quot;, … }"></textarea>'+
    '<div class="btnrow"><button class="btn" id="rsGo" style="--c:var(--led-green)">Restore</button></div>'+
    '<p class="tiny err" id="rsErr"></p>');
  document.getElementById('rsGo').onclick=function(){
    try{applyRestore(parseBackup(document.getElementById('rsText').value));}
    catch(e){document.getElementById('rsErr').textContent='Could not read that: '+(e.message||e);}
  };
}

/* ---------- status card on the Log tab ---------- */
function ago(isoStr){
  if(!isoStr)return null;
  var d=(Date.now()-new Date(isoStr).getTime())/86400000;
  return d<1?'today':(d<2?'yesterday':Math.floor(d)+' days ago');
}
function renderBackupStatus(){
  var intro=document.getElementById('backupIntro'),el=document.getElementById('backupStatus');
  if(!intro||!el)return;
  var st=Backup.status();
  intro.textContent=NATIVE
    ?'Everything is stored inside this app. A copy is also saved automatically to Documents/TenacityTendons on your phone, so it survives even if the app is removed.'
    :'Everything is stored on this device only. Export now and then so a cleared browser cannot wipe sixteen weeks.';
  var lines=[];
  if(NATIVE){
    if(st.autoError)lines.push('<b class="err">Automatic backup failed:</b> '+esc(st.autoError));
    else if(st.autoAt)lines.push('<b>Automatic backup:</b> '+ago(st.autoAt)+' · '+esc(st.autoPath||''));
    else lines.push('<b>Automatic backup:</b> runs after your next change.');
  }
  var m=ago(st.manualAt);
  lines.push('<b>Last export:</b> '+(m?m+(st.manualWhere?' · '+esc(st.manualWhere):''):'never'));
  if(!NATIVE&&(!st.manualAt||(Date.now()-new Date(st.manualAt))>7*86400000))
    lines.push('<span style="color:var(--led-yellow)">Over a week without a backup — export one now.</span>');
  el.innerHTML=lines.join('<br>');
}
