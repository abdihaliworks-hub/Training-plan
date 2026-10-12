// ─── NAV ───
function showSec(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + id).classList.add('active');
  btn.classList.add('active');
}

// ─── STRENGTH TOGGLE ───
function showStr(which) {
  document.getElementById('str-a').style.display = which === 'a' ? 'block' : 'none';
  document.getElementById('str-b').style.display = which === 'b' ? 'block' : 'none';
  document.getElementById('sta-a').classList.toggle('active', which === 'a');
  document.getElementById('sta-b').classList.toggle('active', which === 'b');
}

// ─── DAY ACCORDION ───
function toggleDay(el) {
  const body = el.nextElementSibling;
  const arr  = el.querySelector('.day-arr');
  const open = body.classList.contains('open');
  body.classList.toggle('open', !open);
  arr.classList.toggle('open', !open);
}

// ─── WEEK DATA ───
const weeks = [
  {
    num:1, lbl:'VOLUME', col:'blue',
    note:'High volume, moderate intensity. Build load tolerance and re-establish movement patterns. 40–50 climbing problems across sessions. Strength at full volume. You won\'t feel your best — that\'s expected. You\'re making deposits.',
    days:[
      {d:'MON', t:'Wall Volume', bc:'b-blue', badge:'CLIMBING', body:`
        <p><span class="hl">Focus:</span> Movement quality and volume. Not about grade today.</p>
        <p><span class="hl">Session:</span> 6c–7b on the wall. Footwork drills — silent feet, precise placements. 40–50 problems across the session. Stop if finger tendons feel loaded, not when you feel cardiovascularly tired. 90 min.</p>
        <p><span class="hl">Before:</span> Collagen + vitamin C 45 min pre-session. 15 min easy traversing warm-up.</p>`},
      {d:'TUE', t:'Strength A — Push + Legs', bc:'b-purple', badge:'STRENGTH', body:`
        <p><span class="hl">Session A in full.</span> See Strength tab for all exercises and loading.</p>
        <p><span class="hl">Goal this week:</span> Establish your working weights. Don't go too heavy in week 1 — find a load that's challenging for the last 2 reps but not a grind. These are your cycle baselines to build from.</p>
        <p><span class="hl">Duration:</span> 60–70 min including warm-up.</p>`},
      {d:'WED', t:'Board Volume + Sauna', bc:'b-blue', badge:'CLIMBING', body:`
        <p><span class="hl">Focus:</span> Board climbing, volume-oriented. Kilter at moderate angle.</p>
        <p><span class="hl">Session:</span> 7a–7c problems. 35–45 moves. Not failure — pick problems you can do in 2–3 attempts. 80–90 min.</p>
        <p><span class="hl">After:</span> Sauna 15–20 min. Hydrate well first. This is your mid-week recovery accelerator.</p>`},
      {d:'THU', t:'Mobility Session', bc:'b-green', badge:'MOBILITY', body:`
        <p><span class="hl">Full mobility routine.</span> See Mobility tab for the complete sequence. ~45 min.</p>
        <p>Thursday is the breathing room between Wednesday and Friday climbing sessions. Don't rush it. Light walk or easy bike for 20 min afterward if you feel like moving.</p>`},
      {d:'FRI', t:'Mixed Wall / Board', bc:'b-blue', badge:'CLIMBING', body:`
        <p><span class="hl">Focus:</span> Mixed session. Reading problems, executing cleanly.</p>
        <p><span class="hl">Session:</span> 6c–7b wall, then 7a–7c board. 80 min total. Still a volume day — don't chase limit problems. Probe slightly above your comfortable range to map your ceiling for the intensity phase ahead.</p>
        <p><span class="hl">Cycle 1 only:</span> Keep ceiling at 6c–7a. Connective tissue is still loading up.</p>`},
      {d:'SAT', t:'Strength B + Sauna', bc:'b-purple', badge:'STRENGTH', body:`
        <p><span class="hl">Session B in full.</span> See Strength tab for exercises and loading.</p>
        <p><span class="hl">Same principle as Tuesday:</span> Establish working weights, full sets and reps.</p>
        <p><span class="hl">After:</span> Sauna. First full week done — you've earned it. Two rounds if feeling good, cold shower between.</p>`},
      {d:'SUN', t:'Full Rest', bc:'b-gray', badge:'REST', rest:true}
    ]
  },
  {
    num:2, lbl:'VOLUME+', col:'blue',
    note:'Volume increases ~10% from week 1. Same structure, slightly more problems per session. Add sub-max repeaters to Wednesday as part of the warm-up. Body is loaded — sleep and nutrition matter more than ever this week.',
    days:[
      {d:'MON', t:'Wall Volume +10%', bc:'b-blue', badge:'CLIMBING', body:`
        <p><span class="hl">Push to 45–55 problems.</span> Nudge toward 7b–7b+ if feeling good. Add some longer traverses or link two problems together without rest to add load.</p>
        <p><span class="hl">Key:</span> If fingers feel tender from week 1, maintain volume rather than adding. Tendons lag — they tell you the truth. 90–100 min.</p>`},
      {d:'TUE', t:'Strength A (+5% load)', bc:'b-purple', badge:'STRENGTH', body:`
        <p><span class="hl">Increase load slightly</span> from week 1 working weights. Squat +2.5–5kg, OHP +1.25–2.5kg. This is where the linear strength base begins to build.</p>
        <p><span class="hl">Full volume:</span> 4 sets on all main lifts, accessory work unchanged.</p>`},
      {d:'WED', t:'Board + Repeaters + Sauna', bc:'b-blue', badge:'CLIMBING', body:`
        <p><span class="hl">Add sub-max repeaters:</span> 7s on / 3s off × 6 reps × 3 sets at ~65% max load, open hand. Do these after warm-up, before bouldering. This is the first structured finger loading of the cycle.</p>
        <p><span class="hl">Board climbing:</span> 7a–7c, 35–45 moves as before. Sauna post. ~100 min total.</p>`},
      {d:'THU', t:'Mobility Session', bc:'b-green', badge:'MOBILITY', body:`
        <p><span class="hl">Full routine as week 1 Thursday.</span> Body is more loaded this week — take extra time on hip and hamstring work. If anything feels tighter than last week, add a second round on that stretch.</p>`},
      {d:'FRI', t:'Ceiling Probe', bc:'b-blue', badge:'CLIMBING', body:`
        <p><span class="hl">Focus:</span> Map your current ceiling. Not all-out limit attempts — find where your execution starts to break down.</p>
        <p><span class="hl">Session:</span> Thorough warm-up, then try 3–4 problems at 7c–8a. 5+ min rests. Observe what fails first: fingers, technique, power, contact strength? This directly informs your intensity phase targeting.</p>
        <p><span class="hl">Cycle 1 only:</span> Keep ceiling at 7b–7c. Don't push higher this cycle.</p>`},
      {d:'SAT', t:'Strength B (+5% load) + Sauna', bc:'b-purple', badge:'STRENGTH', body:`
        <p><span class="hl">Increase load from week 1.</span> Barbell row +2.5–5kg. If you hit 12+ pull-up reps on any set, add weight next cycle.</p>
        <p>Two full loading weeks in — the sauna earns its keep tonight. Let it do its work.</p>`},
      {d:'SUN', t:'Full Rest', bc:'b-gray', badge:'REST', rest:true}
    ]
  },
  {
    num:3, lbl:'INTENSITY', col:'orange',
    note:'Volume drops ~30%. Load goes up. Introduce max hangs for the first time this cycle. Limit bouldering with full rest between attempts. Strength maintained at fewer sets, same or heavier load. You should start feeling sharper by mid-week.',
    days:[
      {d:'MON', t:'Max Hangs + Limit Boulder', bc:'b-orange', badge:'CLIMBING', body:`
        <p><span class="hl">Max hangs:</span> 10s hang / 3 min rest × 5 sets. Half crimp primary. Start at ~75–80% of estimated max load — you'll calibrate and push load in week 4. Log the number.</p>
        <p><span class="hl">Limit bouldering:</span> 3–5 problems near your ceiling. 5+ min rest between attempts. Stop when execution quality drops noticeably. This is about quality of movement under load, not racking up problems.</p>
        <p><span class="hl">Duration:</span> 90 min — more rest means fewer problems. That's correct.</p>`},
      {d:'TUE', t:'Strength A (3 sets)', bc:'b-purple', badge:'STRENGTH', body:`
        <p><span class="hl">Drop to 3 sets</span> on all main lifts. Keep load at week 2 levels or go slightly heavier if it felt easy.</p>
        <p><span class="hl">Accessory stays at full volume.</span> Face pulls and wrist work are light and don't contribute meaningfully to systemic fatigue.</p>`},
      {d:'WED', t:'Board Intensity + Sauna', bc:'b-orange', badge:'CLIMBING', body:`
        <p><span class="hl">Harder grades, less volume.</span> Quality over quantity.</p>
        <p><span class="hl">Session:</span> 7c–8a on board. 15–20 problems maximum. Long rests. No hangboard this session — let Monday's hangs recover. Sauna post.</p>
        <p><span class="hl">Cycle 1 only:</span> 7b–7c ceiling. Campus board still excluded.</p>`},
      {d:'THU', t:'Mobility — Extended', bc:'b-green', badge:'MOBILITY', body:`
        <p><span class="hl">Full routine + extra time</span> on whatever felt tight Monday and Wednesday. Intensity weeks accumulate more targeted fatigue — use Thursday to address it directly.</p>
        <p>Optional: 20 min easy walk or light bike after. Keep blood moving without adding training load.</p>`},
      {d:'FRI', t:'Project Session', bc:'b-orange', badge:'CLIMBING', body:`
        <p><span class="hl">Focus:</span> Specific moves, specific sequences. Work actual projects.</p>
        <p><span class="hl">Session:</span> Pick 1–2 problems at your current limit. Break them into sections. Work the crux. 8–12 quality attempts total across the session. 75 min max. This is intentional low volume — you're not here to accumulate, you're here to learn the moves.</p>`},
      {d:'SAT', t:'Strength B (3 sets) + Sauna', bc:'b-purple', badge:'STRENGTH', body:`
        <p><span class="hl">3 sets on main lifts.</span> Same principle as Tuesday — heavy, short, efficient. Same load as week 2 or slightly more if recovery is good.</p>
        <p>End of first intensity week. The adaptation is running — let the sauna and Sunday rest finish the job.</p>`},
      {d:'SUN', t:'Full Rest', bc:'b-gray', badge:'REST', rest:true}
    ]
  },
  {
    num:4, lbl:'INTENSITY+', col:'orange',
    note:'Peak load week. Highest intensity of the cycle. Max hang loads go up from week 3. Limit bouldering at absolute ceiling. Campus board introduced in cycle 2+. Strength maintained. If you\'re not sleeping well this week, prioritise that above everything.',
    days:[
      {d:'MON', t:'Heavy Max Hangs + Limit', bc:'b-orange', badge:'CLIMBING', body:`
        <p><span class="hl">Max hangs:</span> Push load up from week 3. 10s / 4 min rest × 5 sets. Work toward a weight where 10s is genuinely the limit — that's your training max. Log it. This number should go up each cycle.</p>
        <p><span class="hl">Limit bouldering:</span> 3–5 attempts at absolute ceiling. 6–8 min rest between. Highest intensity climbing session of the cycle. Stop when power drops perceptibly — don't grind through bad attempts.</p>
        <p><span class="hl">Cycle 2+ only:</span> Add campus board (1-3-5 laddering, 3 sets × 3 reps) between hangs and bouldering.</p>`},
      {d:'TUE', t:'Strength A — Heavy', bc:'b-purple', badge:'STRENGTH', body:`
        <p><span class="hl">3 sets, heaviest of the cycle.</span> This is your peak strength stimulus. Push for a small personal best on squat and OHP if the warm-up sets feel strong. Don't grind through form breakdown — leave something for Friday.</p>`},
      {d:'WED', t:'Board Intensity + Sauna', bc:'b-orange', badge:'CLIMBING', body:`
        <p><span class="hl">Push grade ceiling on board.</span> 8a–8a+ territory if you're there. 12–18 problems, very long rests. This is about expressing power, not endurance. Sauna post.</p>
        <p><span class="hl">Cycle 2+:</span> Optionally add campus doubles (1-4, 1-5, 3 sets) at the start before the bouldering.</p>`},
      {d:'THU', t:'Mobility Session', bc:'b-green', badge:'MOBILITY', body:`
        <p><span class="hl">Full routine.</span> Peak load week — body is working hard at adaptation. Prioritise shoulder and hip work. Go slow and breathe into the stretches — parasympathetic activation here actively supports Friday's recovery.</p>`},
      {d:'FRI', t:'Projects + RFD Work', bc:'b-orange', badge:'CLIMBING', body:`
        <p><span class="hl">Focus:</span> Projects and explosive single moves.</p>
        <p><span class="hl">Session:</span> Go at your target problems with full intention. Supplement with 5–8 explosive single moves — dynamic reaches, big dynos — to train Rate of Force Development. 75–90 min. This is the peak climbing effort of the entire cycle.</p>`},
      {d:'SAT', t:'Strength B + Sauna', bc:'b-purple', badge:'STRENGTH', body:`
        <p><span class="hl">3 sets, same load as Tuesday or slightly lighter</span> if legs feel loaded from heavy squatting. Pull-up numbers should feel strong this week.</p>
        <p>End of the heaviest week. Next week is peak. The adaptation is happening now, while you rest.</p>`},
      {d:'SUN', t:'Full Rest', bc:'b-gray', badge:'REST', rest:true}
    ]
  },
  {
    num:5, lbl:'PEAK', col:'gold',
    note:'You are stronger than you feel — accumulated fatigue is masking it. Volume drops 40–50%. One light strength session. 2–3 sharp climbing sessions. CNS and connective tissue get full recovery. Go at your limits and see what four weeks of work built.',
    days:[
      {d:'MON', t:'Sharp Board Session', bc:'b-gold', badge:'CLIMBING', body:`
        <p><span class="hl">Warm up thoroughly</span> — 20 min easy, get blood into the fingers before touching anything hard.</p>
        <p><span class="hl">3–5 limit problems.</span> Long rests. Feel the shift from week 2 — it should be noticeable. Stop after 60 min maximum. Leave feeling sharp, not empty. No hangboard today.</p>`},
      {d:'TUE', t:'Light Combined Strength', bc:'b-purple', badge:'STRENGTH', body:`
        <p><span class="hl">One combined A+B session.</span> 60% of working loads. Squat 3×5, OHP 3×5, Barbell Row 3×5, Pull-ups 2×8. Skip Bulgarian and RDL — keep it short and non-fatiguing.</p>
        <p><span class="hl">Purpose:</span> Maintain neuromuscular readiness without adding fatigue. 45 min max. In and out.</p>`},
      {d:'WED', t:'Project Day', bc:'b-gold', badge:'CLIMBING', body:`
        <p><span class="hl">This is it.</span> Go at your actual target problems with full send mentality. Warm up well, then attack what you've been building toward.</p>
        <p><span class="hl">8+ min rests between serious attempts.</span> Quality of effort over quantity. Outdoor session today if at all possible — real rock often produces breakthroughs the gym doesn't.</p>
        <p><span class="hl">Sauna optional</span> — skip if you have another session planned tomorrow.</p>`},
      {d:'THU', t:'Full Rest', bc:'b-gray', badge:'REST', rest:true},
      {d:'FRI', t:'Optional — Maintenance', bc:'b-gold', badge:'CLIMBING', body:`
        <p><span class="hl">Only if feeling flat or stale.</span> If you feel sharp and fresh, skip this entirely — that's the right call.</p>
        <p><span class="hl">If you go:</span> 7a–7b, easy movement, nothing near limit. 45–60 min. Prime the CNS without loading it.</p>`},
      {d:'SAT', t:'Rest or Outdoor', bc:'b-gray', badge:'REST', body:`
        <p><span class="hl">Outdoor session if weather permits</span> — treat it like Wednesday. Warm up, long rests, go at your projects on real rock.</p>
        <p>Otherwise rest. Reflect on the cycle: what landed, what lagged, what to adjust going into cycle 2.</p>`},
      {d:'SUN', t:'Full Rest', bc:'b-gray', badge:'REST', rest:true}
    ]
  }
];

// ─── BUILD SCHEDULE ───
(function buildSchedule() {
  const sel = document.getElementById('wsel');
  const con = document.getElementById('wcontent');

  weeks.forEach((w, i) => {
    // selector button
    const btn = document.createElement('button');
    btn.className = 'wbtn';
    btn.id = 'wb' + i;
    btn.innerHTML = `<div class="wn">W${w.num}</div><div class="wl">${w.lbl}</div>`;
    btn.onclick = () => switchWeek(i);
    sel.appendChild(btn);

    // week container
    const div = document.createElement('div');
    div.id = 'wc' + i;
    div.style.display = 'none';

    let html = `<div class="week-note">${w.note}</div>`;

    w.days.forEach(day => {
      if (day.rest && day.d === 'SUN') {
        html += `<div class="rest-row"><div class="rest-dot"></div><span class="rest-t"><strong style="color:var(--text)">${day.d}</strong> — Full rest. Adaptation happens here, not in the gym.</span></div>`;
      } else if (day.rest) {
        html += `<div class="rest-row"><div class="rest-dot"></div><span class="rest-t"><strong style="color:var(--text)">${day.d}</strong> — ${day.t}</span></div>`;
      } else {
        html += `<div class="day-card">
          <div class="day-head" onclick="toggleDay(this)">
            <div class="day-left">
              <span class="day-d">${day.d}</span>
              <span class="badge ${day.bc}">${day.badge}</span>
              <span class="day-t">${day.t}</span>
            </div>
            <span class="day-arr">▼</span>
          </div>
          <div class="day-body">${day.body || ''}</div>
        </div>`;
      }
    });

    div.innerHTML = html;
    con.appendChild(div);
  });

  switchWeek(0);
})();

function switchWeek(i) {
  const colorMap = ['blue','blue','orange','orange','gold'];
  weeks.forEach((w, j) => {
    const btn = document.getElementById('wb' + j);
    const con = document.getElementById('wc' + j);
    btn.className = 'wbtn' + (j === i ? ' on-' + colorMap[j] : '');
    con.style.display = j === i ? 'block' : 'none';
  });
}

// ─── INSTALLABLE APP (service worker for offline use) ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker registration failed:', err));
  });
}

// ─── INSTALL BUTTON ───
// Chrome fires this only when the site qualifies as an installable app.
// Clicking the button opens Chrome's real "Install app" dialog.
let installPrompt = null;
const installBtn = document.getElementById('install-btn');
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => { installBtn.hidden = true; });
