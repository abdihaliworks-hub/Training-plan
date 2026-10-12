/* ---------- plan data ---------- */
var C={blue:'var(--led-blue)',yellow:'var(--led-yellow)',magenta:'var(--led-magenta)',green:'var(--led-green)',dim:'var(--led-dim)'};
var CYCLES=[
 {id:'A',name:'Re-entry & Capacity',w:[1,5],c:C.blue,
  brief:'Accumulate the volume you have not accumulated in six months. Max hangs are in from week 1, at a generous margin — the constraint is detraining from inconsistency, not your hand. Climbing volume high, intensity capped around RPE 7. Win = you kept the chain, even if half of it was fallback sessions.'},
 {id:'B',name:'Strength & Power',w:[6,10],c:C.magenta,
  brief:'Margins tighten and load goes on. Limit bouldering and heavy gym work. Every target starts above what you actually achieved in Cycle A, not above where you think you should be. Win = measurable gain on at least two test metrics.'},
 {id:'C',name:'Peak & Express',w:[11,15],c:C.green,
  brief:'Convert strength into performance. Get outside. Fewer, better attempts. Win = a new hard send or benchmark PR, and a week 1 that feels obviously easier than Cycle A week 1.'},
 {id:'D',name:'Deload & Retest',w:[16,16],c:C.yellow,
  brief:'Full test battery against weeks 5, 10 and 15. Then choose: a new macrocycle from the new baselines, or one to two weeks completely off. Both are legitimate.'}
];
function cycleOf(w){for(var i=0;i<CYCLES.length;i++){if(w>=CYCLES[i].w[0]&&w<=CYCLES[i].w[1])return CYCLES[i];}return CYCLES[3];}
function phaseOf(w){if(w>=16)return 'deload';var i=((w-1)%5)+1;return i<=2?'volume':(i<=4?'intens':'peak');}
var PHASE_NAME={volume:'Volume block',intens:'Intensification',peak:'Mini-peak & test',deload:'Deload'};
var DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function session(dow,w){
  var ph=phaseOf(w),cy=cycleOf(w).id,o={};
  if(dow===0){
    o.name='Skill & volume';o.c=C.blue;o.title='Skill + volume climbing';
    o.feel={volume:'Crisp and light. Lots of climbing, nothing desperate. Stop the moment your footwork gets sloppy.',
      intens:'Fresh and precise. Fewer problems, harder styles. Quality is the cap, not fatigue.',
      peak:'Light and sharp. A rehearsal, not a workout. Leave feeling like you could have done more.',
      deload:'Play. Climb things you enjoy, well below your limit.'}[ph];
    o.warm='5 min pulse raise · wrist prep circuit ×2 · shoulder CARs and band external rotation · easy traverse · ladder up to RPE 6.';
    o.main={volume:'20–25 submax boulders at RPE 6–7. Interleave styles deliberately: slab, vertical, overhang, coordination. Flash and on-sight focus, not repeats.',
      intens:'12–16 boulders at RPE 7, biased hard toward your weakest style. Two drills: silent feet, straight-arm movement.',
      peak:'8–10 boulders, easy to moderate. Perfect movement only. External focus — look at the hold, not your body.',
      deload:'10–12 easy boulders. Movement quality only.'}[ph];
    o.prev='Scap pull-ups 3×8 · dips or push-ups 3×8–10 for the triceps · FlexBar Tyler twist 3×15 each direction · finger extensor band 2×20.';
    o.cool='90/90 hip · ATG split squat · knee-to-wall ankle. 10 min, loaded rather than passive.';
    o.fb='20 minutes: wrist prep, then 8–10 easy boulders with footwork as the only focus. Leave.';
    o.note='Interleaving styles feels worse during the session and produces better retention and transfer. That trade is the whole point — this is the day you get more technical.';
  }else if(dow===1){
    o.name='Strength';o.c=C.yellow;o.title='Gym strength + lower body';
    o.feel={volume:'Heavy but controlled. Two reps left in the tank on every set. Worked, not wrecked.',
      intens:'Genuinely hard. The last rep grinds but stays clean. End the set when form breaks, not when you fail.',
      peak:'Short, sharp, maximal. Few sets, full rest, big intent. This is a measurement.',
      deload:'Half the sets, same weights. Move well, go home.'}[ph];
    o.warm='Full-body pulse raise · wrist prep · ankle and hip mobility · two ramp-up sets per lift.';
    o.main=({volume:'3×6–8 at ~70–75%, RPE 7',intens:'4–5×3–5 at ~85–90%, RPE 8–9',peak:'2–3 heavy singles or doubles, recorded',deload:'2×5 at ~65%'}[ph])
      +' across: weighted pull-up · overhead press or dip · pistol progression 4×5–8 per side.';
    o.prev='Posterior chain: Nordic curl 3×5, calf raise 3×12. Core: hollow-body hold 3×20–40 s, hanging leg raise 3×8–12.';
    o.cool='Loaded stretching — ankle, hip flexor, hamstring. 8 min.';
    o.fb='15 minutes: three sets each of weighted pull-up, dip, pistol progression. Done.';
    o.note='The press and the pistol are not filler. Your triceps lag your pull strength, and pistols are gated by ankle dorsiflexion — roughly 35–40° versus 15–20° for a normal squat. Check knee-to-wall and aim for 10–14 cm.';
  }else if(dow===2){
    o.name='Rest';o.c=C.dim;o.title='Rest, or Abrahangs only';
    o.feel='Nothing here should feel like training. If you are tempted to add something, do not.';
    o.warm='None needed. Warm your hands under the tap before hanging.';
    o.main='Full rest, or two 10-minute Abrahang sets — feet on the floor, roughly 70–80% effort, at least six hours apart — plus a walk. Your morning check decides which.';
    o.prev='Wrist prep circuit if you feel stiff.';
    o.cool='Sleep is the session. Protect it.';
    o.fb='One 10-minute Abrahang set. On a bad day that counts as a complete day.';
    o.note='Ten minutes is the cap for a reason: engineered ligament work suggests tissue goes refractory to loading after about that long. More is not more here.';
  }else if(dow===3){
    o.name='Fingers';o.c=C.magenta;o.title='Finger strength + board';
    o.feel='Fingers strongly loaded, never sharp. Hard is fine; pointy is not. End the session on a good set, not a failed one.';
    o.warm='20 minutes, thorough. Pulse raise · wrist prep · progressive finger warm-up on the exact edge and grip you will train · easy climbing.';
    if(cy==='A')o.main='Max hangs, 20 mm, half-crimp: 7–10 s leaving a 5 s margin, 3–5 min rest. Sets ratchet 3 → 4 across the cycle. Deliberately submaximal — you are re-establishing the pattern, not testing it. Then Kilter 35 min at RPE 6–7. Finish with 3 × 30 s density hangs at ~50%.';
    else if(cy==='B')o.main='Max hangs, 20 mm: 7–10 s leaving a 3 s margin, 3–5 min rest. Sets ratchet 4 → 5 across the cycle, then add load rather than sets. Then Kilter 40 min, power and body tension.';
    else if(cy==='C')o.main='Max hangs at a 2 s margin, 4–5 sets — reduce the margin before you reduce the edge. Then Kilter limit problems, 45 min, full rest between every go.';
    else o.main='Two easy sets of hangs at 60%. Board optional and easy.';
    if(ph==='peak')o.main+=' Test day: work up to your max-hang added load and record it, then one benchmark attempt.';
    o.prev='Reverse wrist curls 3×15 · band external rotation 3×15.';
    o.cool='Gentle forearm and finger mobility. Low-intensity cooldown hangs if the fingers feel tight.';
    o.fb='Two max-hang sets, no board. Fifteen minutes including the warm-up. The hangs are the irreplaceable part; the board is not.';
    o.note='Never train hangs to failure — the strength gain is similar and the injury risk is much lower. Progress by adding sets first, then by shrinking your margin. Kilter stays capped at one to two sessions a week, never back-to-back days. Optional: 15 g collagen with ~50 mg vitamin C, 45–60 min before.';
  }else if(dow===4){
    o.name='Buffer';o.c=C.dim;o.title='Buffer day';
    o.feel='Deliberately unstructured. This day exists so that life does not break the week.';
    o.warm='—';
    o.main='Rest, mobility, or whichever session the week ate. If Thursday got skipped, this is now your finger day.';
    o.prev='Ankle and hip loaded mobility, 15 min: knee-to-wall pulses, 90/90, couch stretch.';
    o.cool='—';
    o.fb='Nothing. Taking this day off is using it correctly.';
    o.note='Most plans fail because they assume a perfect week. This one budgets for a bad one.';
  }else if(dow===5){
    o.name='Limit';o.c=C.green;o.title=(ph==='peak')?'Performance day':'Limit bouldering';
    o.feel='Try HARD. Powerful and fresh, never pumped and tired. A few great attempts beat many mediocre ones.';
    o.warm='25 minutes, never skipped. Full progressive ladder to near-limit before your first real go.';
    o.main={volume:'Limit boulders, 60 min, 3–4 min rest. Moderate intent — you are rebuilding the habit of trying hard while fresh.',
      intens:'Project session, 75–90 min. Maximal intent on every go, 4–5 min rest. Film your key attempts and watch them back.',
      peak:'Performance day. Outside if the weather allows. Six to eight genuinely maximal attempts. Send it or learn from it.',
      deload:'Easy outdoor day or a social session. Climb for the reason you started.'}[ph];
    o.prev='If you are not fried: push-ups and face pulls, two sets each.';
    o.cool='Walk, eat, sleep. Recovery starts now.';
    o.fb='15 minutes: warm up properly, three maximal attempts on one problem, leave.';
    o.note='Video review is the cheapest technique gain available. Compare what you intended against what you actually did.';
  }else{
    o.name='Rest';o.c=C.dim;o.title='Full rest';
    o.feel='Do nothing athletic. This is where the adaptation actually happens.';
    o.warm='—';
    o.main='Sleep in. Batch cook for the week. Log the week honestly. Read next week\u2019s targets off the Log tab.';
    o.prev='—';o.cool='—';
    o.fb='Meal prep only. That alone protects the next seven days.';
    o.note='Sunday cooking is the highest-leverage hour of your week. Your nutrition collapses on Tuesday because of what did not happen on Sunday.';
  }
  o.ph=ph;o.cy=cy;return o;
}

var FUEL={
 hard:{t:'Hard training day',kcal:'2900–3100',p:'150–165',c:'360–430',f:'70–85',
  n:'Carbs 5–6 g/kg, weighted around the session. Eat before you train and again within a couple of hours after. This is not the day to be clever.'},
 mod:{t:'Moderate day',kcal:'2700–2850',p:'150–160',c:'290–340',f:'70–80',
  n:'Carbs 4–4.7 g/kg. Protein does not drop on easier days — tissue remodelling happens whether or not you trained hard.'},
 rest:{t:'Rest day',kcal:'2450–2600',p:'150–160',c:'215–250',f:'75–85',
  n:'Carbs down to 3–3.5 g/kg, protein held. Do not treat a rest day as a fast; recovery is an energy-expensive process.'}
};
function fuelFor(dow){return (dow===1||dow===3||dow===5)?'hard':(dow===0?'mod':'rest');}

var MEALS=[
 ['Breakfast','Overnight oats: 80–100 g havregryn, 300 g skyr, banana, frozen blåbær, 30 g whey, walnuts or flax. Roughly 45–55 g protein, plus iron, magnesium and omega-3. Alternative: three-egg omelette with spinach, wholegrain bread, skyr on the side.'],
 ['Lunch · batch','Spiced chicken thigh or lean lamb over basmati with paprika, tomato, onion, spinach and chickpeas. Cook a big pot on Sunday and portion it out. 45–55 g protein, and real iron from the lamb and beans.'],
 ['Dinner','Oily fish twice a week — baked laks or makrell with potatoes and broccoli, for vitamin D and omega-3. Other nights: lentil or bean stew with rice, or turkey mince with pasta and vegetables.'],
 ['Snacks','Skyr with fruit · kesam · banana with peanut butter · almonds · dates · mackerel on Wasa · a shake when cooking is not happening.'],
 ['Around the session','Dates or a banana with coffee 45–60 min before. Collagen and vitamin C before finger days. Shake plus fruit after, then a real meal within two hours.'],
 ['Before sleep','30–40 g of a casein-type protein on training days — skyr or cottage cheese. Overnight is when tendon and muscle remodelling happens.']
];
var SUPPS=[
 ['Creatine monohydrate','3–5 g every day. Timing is irrelevant and no loading phase is needed. The best-evidenced strength supplement there is.'],
 ['Vitamin D','About 2000 IU daily, at minimum from October through April. At 60°N you make essentially none in winter, and darker skin lowers synthesis further. Get a 25(OH)D blood test and titrate to it rather than guessing.'],
 ['Collagen + vitamin C','15 g with about 50 mg vitamin C, 45–60 min before finger sessions. Works with loading, not instead of it.'],
 ['Omega-3','If you eat oily fish less than twice a week.'],
 ['Caffeine','3–6 mg/kg, which is 220–430 mg for you, 30–60 min before hard sessions only. Start low. Daily use costs you both the effect and your sleep.'],
 ['Iron and ferritin','Not something to supplement blind. Test it, especially if fatigue persists.']
];
var WHY=[
 ['Fingers','Max hangs use contractions under 10 s at high intensity, 3–5 min rest, 2–5 sets, twice a week with 48–72 h between. Do not train to failure — similar strength gain, much lower injury risk. Progress by adding sets across the cycle first, then by reducing your margin.',C.magenta],
 ['Daily low-intensity hangs','A retrospective cohort of climbers found frequent low-intensity finger loading improved grip strength about as much as maximal loading, and that combining the two was additive. Some of that is probably confidence and tissue conditioning rather than raw strength. Use it as a cheap add-on around your max hangs, and as a complete session on a bad day — not as the programme.',C.magenta],
 ['Elbows','The FlexBar Tyler twist has strong trial support for lateral elbow pain — one trial was stopped early so everyone could receive the treatment. The reverse twist covers the medial side, which is the one climbers get. 3×15 twice daily when symptomatic, 3×15 twice a week as prevention.',C.yellow],
 ['Wrists','There are almost no muscles in the wrist. Wrist strength means forearm conditioning plus joint tolerance to loaded extension. Two minutes of prep before every session prevents most problems. Never load them cold, and train the extensors, not just the flexors.',C.yellow],
 ['Tendons','If anything turns tendinopathic, heavy slow resistance is the template: 12 weeks, three sessions a week, six-second reps, load progressing from 15RM down to 6RM. It matches or beats eccentric-only work and adherence is better.',C.green],
 ['From gymnastics','Take the straight-arm scapular strength, the hollow-body tension, the end-range control, the joint prep, and the model of short frequent skill practice. Leave the planche, the iron cross and the tumbling — injury risk without climbing payoff.',C.blue],
 ['Technique','Variable, interleaved practice performs worse during the session and better on retention and transfer. Pair it with an external focus of attention. Skill work goes early in the session, capped by quality rather than fatigue.',C.blue],
 ['Kilter board','Superb for power, tension and dynamic movement, and its permanence makes your 7C+ benchmark a real long-term marker. But it concentrates finger load and teaches a narrow movement vocabulary. Cap it, and balance it with commercial walls and rock.',C.magenta],
 ['Adherence','A habit study following 96 people found a median of 66 days to automaticity, and that missing a single day did not measurably damage the process. So the rule is never miss twice, not never miss. That is why every session here has a minimum version.',C.green]
];
var TESTS=[['Max hang added load','kg · 20 mm, 7 s'],['Kilter benchmark','hardest sent'],
 ['Weighted pull-up','kg · 1–3RM'],['Pistol squat','stage / reps'],['Knee to wall','cm'],['Bodyweight','kg']];

/* ---------- dates ---------- */
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function startDate(){return new Date(S.start+'T00:00:00');}
function todayIdx(){var t=new Date();t.setHours(0,0,0,0);return Math.round((t-startDate())/86400000);}
function dateOf(i){var d=startDate();d.setDate(d.getDate()+i);return d;}
function fmt(d){return d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});}
