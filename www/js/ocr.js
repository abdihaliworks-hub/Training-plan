/* ---------- nutrition label scanner ----------
   Runs fully on the device with Tesseract OCR (bundled in vendor/, no internet needed).
   Reads English and Norwegian (also handles Swedish/Danish wording) "per 100 g" tables.  */

var OCR={
  worker:null,loading:null,onProgress:null,
  abs:function(p){return new URL(p,location.href).href;},
  get:function(){
    if(OCR.loading)return OCR.loading;
    if(!window.Tesseract){
      OCR.loading=new Promise(function(res,rej){
        var s=document.createElement('script');
        s.src='vendor/tesseract/tesseract.min.js';
        s.onload=res;s.onerror=function(){rej(new Error('The label reader could not be loaded.'));};
        document.head.appendChild(s);
      }).then(OCR.create);
    }else OCR.loading=OCR.create();
    OCR.loading.catch(function(){OCR.loading=null;});
    return OCR.loading;
  },
  create:function(){
    return Tesseract.createWorker(['eng','nor'],1,{
      workerPath:OCR.abs('vendor/tesseract/worker.min.js'),
      corePath:OCR.abs('vendor/tesseract/core'),
      langPath:OCR.abs('vendor/tesseract/lang'),
      workerBlobURL:false,
      logger:function(m){if(OCR.onProgress)OCR.onProgress(m);}
    }).then(function(w){
      /* auto page layout (tesseract.js defaults to "single block", which mangles tables) */
      return w.setParameters({tessedit_pageseg_mode:'3',preserve_interword_spaces:'1'}).then(function(){OCR.worker=w;return w;});
    });
  },
  /* image File/Blob -> {text, parsed}. Reads the photo once; if the numbers don't add up,
     reads an upscaled copy too and keeps whichever reading is more consistent. */
  read:function(file,onProgress){
    OCR.onProgress=onProgress;
    var worker;
    function pass(scale){
      return prepImage(file,scale).then(function(img){return worker.recognize(img);})
        .then(function(res){var text=(res&&res.data&&res.data.text)||'';return {text:text,parsed:parseLabel(text)};});
    }
    return OCR.get().then(function(w){worker=w;return pass(1);}).then(function(a){
      if(a.parsed.confident)return a;
      if(OCR.onProgress)OCR.onProgress({status:'second look',progress:0});
      return pass(2).then(function(b){return betterRead(a,b);},function(){return a;});
    });
  }
};
function betterRead(a,b){
  var sa=a.parsed.score,sb=b.parsed.score;
  return sb>sa?b:a;
}

/* Scale, convert to grayscale and stretch contrast: steadier OCR on phone photos. */
function prepImage(file,scale){
  scale=scale||1;
  return new Promise(function(resolve){
    var url=URL.createObjectURL(file),img=new Image();
    img.onload=function(){
      try{
        var long=Math.max(img.width,img.height);
        var sc=Math.min(1,2000/long);
        if(long*sc<1000)sc=Math.min(2,1000/long);
        sc=Math.min(sc*scale,3200/long);
        var w=Math.round(img.width*sc),h=Math.round(img.height*sc);
        var cv=document.createElement('canvas');cv.width=w;cv.height=h;
        var cx=cv.getContext('2d');cx.drawImage(img,0,0,w,h);
        var d=cx.getImageData(0,0,w,h),p=d.data,i,g,lo=255,hi=0,hist=new Array(256).fill(0);
        for(i=0;i<p.length;i+=4){g=(p[i]*0.299+p[i+1]*0.587+p[i+2]*0.114)|0;p[i]=g;hist[g]++;}
        /* stretch contrast between the 2nd and 98th percentile */
        var n=w*h,acc=0;
        for(i=0;i<256;i++){acc+=hist[i];if(acc>n*0.02){lo=i;break;}}
        acc=0;for(i=255;i>=0;i--){acc+=hist[i];if(acc>n*0.02){hi=i;break;}}
        var span=Math.max(1,hi-lo);
        for(i=0;i<p.length;i+=4){g=Math.max(0,Math.min(255,(p[i]-lo)*255/span));p[i]=p[i+1]=p[i+2]=g;}
        cx.putImageData(d,0,0);
        URL.revokeObjectURL(url);
        cv.toBlob(function(b){resolve(b||file);},'image/png');
      }catch(e){URL.revokeObjectURL(url);resolve(file);}
    };
    img.onerror=function(){URL.revokeObjectURL(url);resolve(file);};
    img.src=url;
  });
}

/* ---------- text -> per-100 values ----------
   OCR on labels has typical slips: the unit "g" read as "9" (7,0 g -> "709"), decimal
   commas dropped, "1" read as l/|/i, "0" as o. So each number gets a few candidate
   readings, and the combination that best matches the label's own energy figure
   (fat×9 + carbs×4 + protein×4 + fibre×2) wins. Fields that needed a guess are flagged. */
var NUTRIENTS=[
  /* key, label words, words that mean it's a sub-line (skip) */
  ['fat',  /\b(fett|fat|fedt|lipider|total fat)\b/, /(mett|m[æa]tt|saturat|enumett|flerumett|umettet|trans|av dette|hvorav|herav|varav|of which)/],
  ['satfat',/(mettede|m[æa]ttede|m[äa]ttat|saturat)/,/(enumett|flerumett|unsat)/],
  ['carbs',/(karbohydrat|carbohydrate|kolhydrat|kulhydrat|\bcarbs?\b)/,/(sukker|sugar|socker|polyol|stivelse|starch)/],
  ['sugar',/(sukker|sugars?|socker)/,/(tilsatt|added|polyol)/],
  ['fiber',/(kostfiber|fiber|fibre)/,null],
  ['protein',/(protein|prote[il1]n)/,null],
  ['salt',/\b(salt|sodium|natrium)\b/,null]
];
/* the value text right after a nutrient word -> list of {v, cost} readings */
function candidates(rest){
  var m=rest.match(/^[\s:.\-–—_|*"']*<?\s*([0-9oOlI|i][0-9oOlI|i.,]*(?:\s[0-9]{1,2}(?![0-9]))?)\s*(m?g|9)?/);
  if(!m)return [];
  var raw=m[1].replace(/\s+/g,'').replace(/[oO]/g,'0').replace(/[lI|i]/g,'1').replace(/,/g,'.');
  if(!/\d/.test(raw))return [];
  if(m[2]==='mg')return [{v:+raw/1000,cost:0}];
  var explicit=m[2]==='g';
  if(m[2]==='9')raw+='9';
  /* a trailing 9 with no "g" after it is most likely the g itself */
  var tail9=!explicit&&/9$/.test(raw)&&raw.replace('.','').length>1;
  var bases=[[raw,tail9?0.7:0]];
  if(tail9)bases.push([raw.slice(0,-1),0.2]);
  if(tail9&&raw.length>2)bases.push([raw.slice(0,-2),1.5]);
  var out=[];
  bases.forEach(function(b){
    var d=b[0].replace(/\.$/,''),c=b[1];
    if(!d)return;
    if(d.indexOf('.')>=0){out.push({v:parseFloat(d),cost:c});return;}
    out.push({v:parseInt(d,10),cost:c+(d.length>1&&d[0]==='0'?1:0)});
    if(d.length>=2)out.push({v:parseFloat(d.slice(0,-1)+'.'+d.slice(-1)),cost:c+0.6});
    if(d.length>=3)out.push({v:parseFloat(d.slice(0,-2)+'.'+d.slice(-2)),cost:c+1.0});
  });
  return out.filter(function(x){return isFinite(x.v)&&x.v>=0&&x.v<=100;});
}
function parseLabel(raw){
  var t=String(raw||'').toLowerCase()
    .replace(/(\d)\s*,\s*(\d)/g,'$1,$2')
    .replace(/k[ce]a[il1t]\b/g,'kcal').replace(/\bk[jl]\b/g,'kj');
  var lines=t.split(/\n+/).map(function(l){return l.trim();}).filter(Boolean);
  var found=[],kcal=null;

  /* energy: prefer kcal anywhere in the text, else convert kJ */
  var m=t.match(/(\d{1,4}(?:[.,]\d)?)\s*kcal/);
  if(m&&parseFloat(m[1].replace(',','.'))<=950){kcal=parseFloat(m[1].replace(',','.'));found.push('kcal');}
  else{
    m=t.match(/(\d{2,4}(?:[.,]\d)?)\s*kj/);
    if(m&&parseFloat(m[1])<=4000){kcal=Math.round(parseFloat(m[1].replace(',','.'))/4.184);found.push('kcal (from kJ)');}
  }
  var cand={};
  NUTRIENTS.forEach(function(n){
    for(var i=0;i<lines.length;i++){
      var l=lines[i],km=l.match(n[1]);
      if(!km||(n[2]&&n[2].test(l)))continue;
      var c=candidates(l.slice(km.index+km[0].length));
      if(!c.length&&lines[i+1]&&/^[\s<]*[0-9oO]/.test(lines[i+1]))c=candidates(lines[i+1]);
      if(c.length){cand[n[0]]=c;break;}
    }
  });

  /* choose one reading per nutrient */
  var pick={},keys=['fat','carbs','protein','fiber'].filter(function(k){return cand[k];});
  var best=null;
  if(kcal!=null&&cand.fat&&cand.carbs&&cand.protein){
    (function walk(i,chosen,cost){
      if(i===keys.length){
        var c=chosen.fat.v*9+(chosen.carbs.v+chosen.protein.v)*4+(chosen.fiber?chosen.fiber.v*2:0);
        var sum=chosen.fat.v+chosen.carbs.v+chosen.protein.v+(chosen.fiber?chosen.fiber.v:0);
        if(sum>100.5)return;
        var err=Math.abs(c-kcal)/Math.max(kcal,1);
        var score=Math.max(0,err-0.03)*30+cost*0.1;
        if(!best||score<best.score)best={score:score,err:err,chosen:Object.assign({},chosen)};
        return;
      }
      cand[keys[i]].forEach(function(x){chosen[keys[i]]=x;walk(i+1,chosen,cost+x.cost);});
    })(0,{},0);
  }
  ['fat','carbs','protein','fiber','satfat','sugar','salt'].forEach(function(k){
    if(best&&best.chosen[k])pick[k]=best.chosen[k];
    else if(cand[k])pick[k]=cand[k].slice().sort(function(a,b){return a.cost-b.cost;})[0];
  });
  /* sub-lines can't exceed their parent */
  [['satfat','fat'],['sugar','carbs']].forEach(function(r){
    if(pick[r[0]]&&pick[r[1]]&&pick[r[0]].v>pick[r[1]].v){
      var ok=cand[r[0]].filter(function(x){return x.v<=pick[r[1]].v;}).sort(function(a,b){return a.cost-b.cost;})[0];
      if(ok)pick[r[0]]=ok;else delete pick[r[0]];
    }
  });
  var val=function(k){return pick[k]?Math.round(pick[k].v*100)/100:null;};
  var per={kcal:kcal,p:val('protein'),c:val('carbs'),f:val('fat'),fiber:val('fiber'),sugar:val('sugar'),satfat:val('satfat'),salt:val('salt')};
  ['fat','carbs','protein','fiber'].forEach(function(k){if(pick[k])found.push(k);});
  if(per.kcal==null&&per.f!=null&&per.c!=null&&per.p!=null){
    per.kcal=Math.round(per.f*9+(per.c+per.p)*4+(per.fiber||0)*2);found.push('kcal (calculated)');
  }
  var guessed=[];
  [['fat','f'],['carbs','c'],['protein','p']].forEach(function(k){if(pick[k[0]]&&pick[k[0]].cost>0)guessed.push(k[1]);});
  var macros=['f','c','p'].filter(function(k){return per[k]!=null;}).length;
  var warn=null,err=best?best.err:null;
  if(err!=null&&err>0.12)warn='The numbers don’t quite add up — double-check them against the label.';
  else if(guessed.length)warn='Some numbers were hard to read (highlighted) — check them against the label.';
  var ok=(kcal!=null&&macros>=2)||macros===3;
  return {
    ok:ok,
    confident:ok&&macros===3&&kcal!=null&&!guessed.length&&err!=null&&err<0.06,
    score:(ok?10:0)+macros*2+(kcal!=null?2:0)-(err!=null?Math.min(err,1)*10:3)-guessed.length*0.5,
    per100:per,basis:/100\s*ml/.test(t)?'100ml':'100g',found:found,warn:warn,guessed:guessed
  };
}
