/* ---------- band data: Xiaomi Smart Band 9 Pro → Mi Fitness → Health Connect → this app ----------
   Only inside the Android app (a website can't read Health Connect).
   Each synced day is stored in S.vitals['YYYY-MM-DD'] = {rhr, rhrSource, hrv, sleepMin, bedtime, wake,
   steps, hrMin, hrMax, syncedAt} so it is backed up and can be charted like everything else.
   Resting HR: a RestingHeartRate record if Mi Fitness writes one, otherwise estimated from the
   heart rate measured while you slept (the low end of the night, not the single lowest beat).      */

var HEALTH_TYPES=['HeartRateSeries','RestingHeartRate','HeartRateVariabilityRmssd','SleepSession','Steps'];
var HEALTH_KEY='board-health';
var Health={
  plugin:NATIVE?window.Capacitor.registerPlugin('HealthConnect'):null,
  state:function(){try{return JSON.parse(localStorage.getItem(HEALTH_KEY))||{};}catch(e){return {};}},
  setState:function(o){var s=Health.state();for(var k in o)s[k]=o[k];try{localStorage.setItem(HEALTH_KEY,JSON.stringify(s));}catch(e){}},
  busy:false,

  availability:function(){
    if(!Health.plugin)return Promise.resolve('Web');
    return Health.plugin.checkAvailability().then(function(r){return r.availability;}).catch(function(){return 'NotSupported';});
  },
  connect:function(){
    return Health.plugin.requestHealthPermissions({read:HEALTH_TYPES,write:[]}).then(function(r){
      var ok=(r.grantedPermissions||[]).length>0;
      Health.setState({connected:ok,granted:r.grantedPermissions||[]});
      if(ok)return Health.sync(true);
      renderHealth();
    });
  },
  /* all pages of one record type */
  read:function(type,from,to){
    var out=[],pages=0;
    function page(token){
      var o={type:type,timeRangeFilter:{type:'between',startTime:from,endTime:to},pageSize:1000};
      if(token)o.pageToken=token;
      return Health.plugin.readRecords(o).then(function(r){
        out=out.concat(r.records||[]);
        if(r.pageToken&&++pages<10)return page(r.pageToken);
        return out;
      });
    }
    return page(null).catch(function(){return [];}); /* a type you didn't allow just comes back empty */
  },
  sync:function(force){
    if(!Health.plugin||Health.busy)return Promise.resolve();
    var st=Health.state();
    if(!st.connected)return Promise.resolve();
    if(!force&&st.syncedAt&&Date.now()-new Date(st.syncedAt)<15*60000)return Promise.resolve();
    Health.busy=true;renderHealth();
    var now=new Date(),from=new Date(now);from.setDate(from.getDate()-8);from.setHours(12,0,0,0);
    return Promise.all(HEALTH_TYPES.map(function(t){return Health.read(t,from,now);})).then(function(r){
      var rec={};HEALTH_TYPES.forEach(function(t,i){rec[t]=r[i];});
      var days=computeVitals(rec,now);
      S.vitals=S.vitals||{};
      Object.keys(days).forEach(function(ds){
        var prev=S.vitals[ds]||{};
        for(var k in days[ds])if(days[ds][k]!=null)prev[k]=days[ds][k];
        S.vitals[ds]=prev;
      });
      fillMorningCheck();
      Health.setState({syncedAt:new Date().toISOString(),error:null,
        counts:HEALTH_TYPES.reduce(function(o,t){o[t]=rec[t].length;return o;},{})});
      save();
    }).catch(function(e){
      Health.setState({error:String(e&&e.message||e)});
    }).then(function(){Health.busy=false;renderHealth();renderSliders();renderVerdict();});
  }
};

/* ---- turn raw Health Connect records into one summary per day (the day you woke up) ---- */
function hcT(x){return new Date(x).getTime();}
function dayOf(ms){return iso(new Date(ms));}
function computeVitals(rec,now){
  var days={},get=function(ds){return days[ds]||(days[ds]={});};
  var ASLEEP={2:1,4:1,5:1,6:1}; /* sleeping, light, deep, REM */

  /* sleep: sessions grouped by wake-up day; minutes asleep from the stages when present */
  (rec.SleepSession||[]).forEach(function(s){
    var st=hcT(s.startTime),en=hcT(s.endTime),ds=dayOf(en),d=get(ds),min;
    if(s.stages&&s.stages.length){
      min=s.stages.reduce(function(a,g){return a+(ASLEEP[g.stage]?(hcT(g.endTime)-hcT(g.startTime))/60000:0);},0);
      if(!min)min=(en-st)/60000;
    }else min=(en-st)/60000;
    d.sleepMin=Math.round((d.sleepMin||0)+min);
    if(!d.bedtime||st<hcT(d.bedtime))d.bedtime=new Date(st).toISOString();
    if(!d.wake||en>hcT(d.wake))d.wake=new Date(en).toISOString();
    (d._win=d._win||[]).push([st,en]);
  });

  /* heart rate samples */
  var samples=[];
  (rec.HeartRateSeries||[]).forEach(function(r){
    (r.samples||[]).forEach(function(x){if(x.beatsPerMinute>25&&x.beatsPerMinute<230)samples.push([hcT(x.time),x.beatsPerMinute]);});
  });
  samples.sort(function(a,b){return a[0]-b[0];});
  samples.forEach(function(x){
    var d=get(dayOf(x[0]));
    d.hrMin=d.hrMin==null?x[1]:Math.min(d.hrMin,x[1]);
    d.hrMax=d.hrMax==null?x[1]:Math.max(d.hrMax,x[1]);
  });
  /* resting HR estimate: 10th percentile of heart rate while asleep */
  Object.keys(days).forEach(function(ds){
    var d=days[ds];
    if(d._win){
      var hr=samples.filter(function(x){return d._win.some(function(w){return x[0]>=w[0]&&x[0]<=w[1];});})
        .map(function(x){return x[1];}).sort(function(a,b){return a-b;});
      if(hr.length>=5){d.rhr=hr[Math.floor(hr.length*0.1)];d.rhrSource='estimated from sleep heart rate';}
    }
    delete d._win;
  });
  /* the band's own resting HR wins over the estimate */
  (rec.RestingHeartRate||[]).forEach(function(r){
    var d=get(dayOf(hcT(r.time)));d.rhr=Math.round(r.beatsPerMinute);d.rhrSource='from Mi Fitness';
  });
  (rec.HeartRateVariabilityRmssd||[]).forEach(function(r){
    var d=get(dayOf(hcT(r.time)));d.hrv=Math.round(r.heartRateVariabilityMillis);
  });

  /* steps: apps often both write the same steps, so per day take the source with the most, not the sum */
  var byDay={};
  (rec.Steps||[]).forEach(function(r){
    var ds=dayOf(hcT(r.startTime)),o=(r.metadata&&r.metadata.dataOrigin)||'?';
    byDay[ds]=byDay[ds]||{};byDay[ds][o]=(byDay[ds][o]||0)+r.count;
  });
  Object.keys(byDay).forEach(function(ds){
    get(ds).steps=Math.max.apply(null,Object.keys(byDay[ds]).map(function(o){return byDay[ds][o];}));
  });
  var stamp=(now||new Date()).toISOString();
  Object.keys(days).forEach(function(ds){days[ds].syncedAt=stamp;});
  return days;
}

/* put the band's numbers into today's morning check — never over something you typed */
function fillMorningCheck(){
  var ds=iso(new Date()),v=(S.vitals||{})[ds];if(!v)return;
  var r=S.ready[ds]=S.ready[ds]||{};
  if(v.rhr!=null&&(r.rhr==null||r.rhrSrc==='band')){r.rhr=v.rhr;r.rhrSrc='band';}
  if(v.hrv!=null&&(r.hrv==null||r.hrvSrc==='band')){r.hrv=v.hrv;r.hrvSrc='band';}
}

/* ---- Today card ---- */
function avgRhr(days){
  var vals=[],d=new Date();
  for(var i=1;i<=days;i++){d.setDate(d.getDate()-1);var v=(S.vitals||{})[iso(d)];if(v&&v.rhr)vals.push(v.rhr);}
  return vals.length>=3?vals.reduce(function(a,b){return a+b;},0)/vals.length:null;
}
function hm(min){return Math.floor(min/60)+'h '+String(Math.round(min%60)).padStart(2,'0');}
function renderHealth(){
  var card=document.getElementById('bandCard');
  if(!card)return;
  if(!NATIVE){card.classList.add('hide');return;}
  card.classList.remove('hide');
  var st=Health.state(),body=document.getElementById('bandBody');
  if(!st.connected){
    Health.availability().then(function(av){
      if(av==='Available'){
        body.innerHTML='<p class="tiny" style="margin-top:0">Pull resting heart rate, sleep and steps from your Xiaomi Smart Band 9 Pro, and fill in the morning check automatically.</p>'+
          '<ol class="tiny" style="padding-left:18px;margin:8px 0 0">'+
            '<li>In the <b>Mi Fitness</b> app, open your profile, find <b>Health Connect</b> and turn syncing on.</li>'+
            '<li>Tap <b>Connect</b> below and allow heart rate, sleep and steps.</li></ol>'+
          '<div class="btnrow"><button class="btn" id="bandConnect" style="--c:var(--led-green)">Connect</button></div>';
      }else if(av==='NotInstalled'){
        body.innerHTML='<p class="tiny" style="margin-top:0">Your band’s data reaches this app through Android’s <b>Health Connect</b>, which isn’t installed on this phone yet. Install it from the Play Store, then come back.</p>'+
          '<div class="btnrow"><a class="btn" href="https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata" style="--c:var(--led-green)">Get Health Connect</a></div>';
      }else{
        body.innerHTML='<p class="tiny" style="margin:0">Health Connect isn’t supported on this phone, so band data can’t be read. You can still type resting HR in by hand.</p>';
      }
      var b=document.getElementById('bandConnect');
      if(b)b.onclick=function(){b.disabled=true;b.textContent='Waiting for permission…';
        Health.connect().catch(function(e){Health.setState({error:String(e&&e.message||e)});renderHealth();});};
    });
    return;
  }
  var today=iso(new Date()),v=(S.vitals||{})[today]||{},avg=avgRhr(7);
  var diff=(v.rhr!=null&&avg!=null)?Math.round(v.rhr-avg):null;
  var stat=function(val,k){return '<div class="stat"><div class="v">'+val+'</div><div class="k">'+k+'</div></div>';};
  var unit=function(u){return '<span style="font-size:12px;color:var(--ink-3)"> '+u+'</span>';};
  body.innerHTML='<div class="stats">'+
      stat(v.rhr!=null?v.rhr+unit('bpm'):'—','resting HR')+
      stat(v.sleepMin!=null?hm(v.sleepMin):'—','sleep')+
      stat(v.steps!=null?v.steps.toLocaleString('en-GB'):'—','steps today')+
    '</div>'+
    (v.hrv!=null?'<p class="tiny">HRV '+v.hrv+' ms</p>':'')+
    '<div class="note">'+
      (v.rhr!=null?(diff!=null?'<b>'+(diff>0?'+':'')+diff+' bpm</b> vs your 7-day average ('+Math.round(avg)+'). '+(diff>=4?'Elevated — take it easy today.':(diff<=-2?'Lower than usual — a good sign.':'Normal range.')):'<b>Resting HR</b> '+esc(v.rhrSource||'')+'. A 7-day average appears after three nights.')
        :'No band data for last night yet. Wear the band to bed and open Mi Fitness in the morning so it syncs.')+
      (v.bedtime&&v.wake?'<br>Slept '+new Date(v.bedtime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})+'–'+new Date(v.wake).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})+'.':'')+
    '</div>'+
    '<p class="tiny">'+(Health.busy?'Syncing…':(st.error?'<span class="err">Sync problem: '+esc(st.error)+'</span>':
      (st.syncedAt?'Synced '+new Date(st.syncedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'')))+'</p>'+
    '<div class="btnrow" style="margin-top:4px"><button class="btn sm ghost" id="bandSync">Sync now</button>'+
      '<button class="btn sm ghost" id="bandSettings">Health Connect settings</button></div>';
  document.getElementById('bandSync').onclick=function(){Health.sync(true);};
  document.getElementById('bandSettings').onclick=function(){Health.plugin.openHealthConnectSetting().catch(function(){});};
}
function initHealth(){
  if(!NATIVE)return;
  Health.sync(false);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)Health.sync(false);});
}
