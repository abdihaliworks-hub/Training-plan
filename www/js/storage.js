/* ---------- platform ---------- */
/* NATIVE = running inside the Android app (Capacitor). Native plugins are only touched then. */
var NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
var Native=NATIVE?{
  fs:window.Capacitor.registerPlugin('Filesystem'),
  share:window.Capacitor.registerPlugin('Share')
}:null;
var APP_VERSION='2.0.0';
var SCHEMA_VERSION=2;

/* ---------- storage: artifact API if present, localStorage when saved to phone ---------- */
var KEY='board-plan-v1';
var SAVE_ERROR=null;
var store={
  get:function(){
    try{
      if(window.storage&&window.storage.get){
        return window.storage.get(KEY).then(function(r){return r?JSON.parse(r.value):null;}).catch(function(){return null;});
      }
      var v=localStorage.getItem(KEY);
      return Promise.resolve(v?JSON.parse(v):null);
    }catch(e){
      /* corrupt data must never brick the app: keep a copy aside and start clean */
      try{localStorage.setItem(KEY+'.corrupt-'+Date.now(),localStorage.getItem(KEY));}catch(e2){}
      return Promise.resolve(null);
    }
  },
  set:function(o){
    try{
      var json=JSON.stringify(o);
      if(window.storage&&window.storage.set) return window.storage.set(KEY,json).then(function(){SAVE_ERROR=null;}).catch(function(e){SAVE_ERROR=e;});
      localStorage.setItem(KEY,json);
      SAVE_ERROR=null;
    }catch(e){SAVE_ERROR=e;}
    return Promise.resolve();
  }
};
function defaultStart(){
  var d=new Date();d.setHours(0,0,0,0);
  var dow=(d.getDay()+6)%7; /* 0 = Monday */
  d.setDate(d.getDate()-dow);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
var STORAGE_OK=null;
function checkStorage(){
  try{
    if(window.storage&&window.storage.set){STORAGE_OK=true;return;}
    localStorage.setItem('__t','1');
    STORAGE_OK=(localStorage.getItem('__t')==='1');
    localStorage.removeItem('__t');
  }catch(e){STORAGE_OK=false;}
}
/* food: {entries:[...], foods:{id:{...}}} — see food.js for the record shapes */
var S={start:defaultStart(),log:{},ready:{},tests:{},food:{entries:[],foods:{}},vitals:{}};
var saveT=null;
function save(){
  clearTimeout(saveT);
  saveT=setTimeout(function(){
    store.set(S).then(function(){
      if(SAVE_ERROR)flash('Could not save — export a backup',true);
      else{flash();if(window.Backup)Backup.scheduleAuto();}
    });
  },350);
}
function flash(msg,bad){
  var f=document.getElementById('flash');
  f.textContent=msg||'Saved';f.classList.toggle('bad',!!bad);
  f.classList.add('show');
  clearTimeout(f._t);f._t=setTimeout(function(){f.classList.remove('show');},bad?2600:900);
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
