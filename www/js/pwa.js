/* ---------- web app install + Android app download ---------- */
var APK_URL='https://github.com/abdihaliworks-hub/Training-plan/releases/latest/download/tenacity-tendons.apk';
var GETAPP_KEY='board-getapp-dismissed';

(function(){
  if(NATIVE)return; /* already the real app */

  /* offline support for the website */
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('sw.js').catch(function(e){console.warn('Service worker failed:',e);});
    });
  }

  var card=document.getElementById('getApp'),txt=document.getElementById('getAppText');
  var apk=document.getElementById('btnApk'),inst=document.getElementById('btnInstall');
  var standalone=window.matchMedia('(display-mode: standalone)').matches;
  var dismissed=false;try{dismissed=localStorage.getItem(GETAPP_KEY)==='1';}catch(e){}
  var android=/Android/i.test(navigator.userAgent);
  var prompt=null;

  function show(){if(!dismissed)card.classList.remove('hide');}
  apk.href=APK_URL;
  if(android&&!inWrapper()){
    txt.textContent='Get the Android app: it keeps everything on your phone, works offline, and saves automatic backups to your Documents folder. After downloading, open the file and allow installing from your browser if Android asks.';
    show();
  }else{
    apk.classList.add('hide');
    txt.textContent='Install this as an app: its own icon, full screen, works offline.';
  }
  if(inWrapper()){
    /* old APK wrappers: point people to the real app */
    apk.classList.remove('hide');
    txt.textContent='There is now a proper Android app. First go to Log → Backup → Copy backup as text and keep that text safe. Then install the new app and use Restore from text.';
    show();
  }
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();prompt=e;
    if(!standalone){inst.classList.remove('hide');show();}
  });
  inst.onclick=function(){
    if(!prompt)return;
    prompt.prompt();
    prompt.userChoice.then(function(){prompt=null;inst.classList.add('hide');});
  };
  window.addEventListener('appinstalled',function(){inst.classList.add('hide');});
  document.getElementById('btnGetAppClose').onclick=function(){
    card.classList.add('hide');dismissed=true;
    try{localStorage.setItem(GETAPP_KEY,'1');}catch(e){}
  };
})();
