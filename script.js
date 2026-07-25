// ---- state ----
const state = {
  temp: 24.5, hum: 48, lux: 420, rssi: -58,
  history: [],
  packets: 0,
  startTime: Date.now()
};
const MAX_POINTS = 60;

function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
function drift(v, amount, min, max){ return clamp(v + (Math.random()-0.5)*amount, min, max); }

function fmtTime(d){
  return d.toTimeString().split(' ')[0];
}
function fmtUptime(ms){
  const s = Math.floor(ms/1000);
  const hh = String(Math.floor(s/3600)).padStart(2,'0');
  const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
  const ss = String(s%60).padStart(2,'0');
  return `${hh}:${mm}:${ss}`;
}

function setBar(id, val, min, max){
  const pct = clamp(((val-min)/(max-min))*100, 2, 100);
  document.getElementById(id).style.width = pct + '%';
}

function setTag(id, ok){
  const el = document.getElementById(id);
  el.textContent = ok ? 'OK' : 'WARN';
  el.className = 'tag ' + (ok ? 'ok' : 'warn');
}

function tick(){
  state.temp = drift(state.temp, 0.6, 16, 34);
  state.hum = drift(state.hum, 1.6, 22, 78);
  state.lux = clamp(state.lux + (Math.random()-0.5)*80, 0, 1000);
  state.rssi = clamp(state.rssi + (Math.random()-0.5)*3, -85, -40);
  state.packets++;

  document.getElementById('temp-val').innerHTML = state.temp.toFixed(1) + '<span class="unit">°C</span>';
  document.getElementById('hum-val').innerHTML = state.hum.toFixed(0) + '<span class="unit">%RH</span>';
  document.getElementById('lux-val').innerHTML = Math.round(state.lux) + '<span class="unit">lux</span>';
  document.getElementById('rssi-val').innerHTML = Math.round(state.rssi) + '<span class="unit">dBm</span>';

  setBar('temp-bar', state.temp, 18, 32);
  setBar('hum-bar', state.hum, 30, 70);
  setBar('lux-bar', state.lux, 0, 1000);
  setBar('rssi-bar', state.rssi, -85, -40);

  const tempOk = state.temp >= 18 && state.temp <= 32;
  const humOk = state.hum >= 30 && state.hum <= 70;
  const luxOk = true;
  setTag('temp-tag', tempOk);
  setTag('hum-tag', humOk);
  setTag('lux-tag', luxOk);

  document.getElementById('packets').textContent = state.packets.toLocaleString();
  document.getElementById('uptime').textContent = fmtUptime(Date.now() - state.startTime);

  const now = new Date();
  state.history.push({ t: now, temp: state.temp, hum: state.hum, lux: state.lux, ok: tempOk && humOk });
  if(state.history.length > MAX_POINTS) state.history.shift();

  renderChart();
  renderTable();
}

function renderChart(){
  const svg = document.getElementById('chart');
  const w = 1000, h = 260, pad = 20;
  let parts = '';

  for(let i=0;i<=4;i++){
    const y = pad + (h-2*pad) * i/4;
    parts += `<line class="grid-line" x1="${pad}" y1="${y}" x2="${w-pad}" y2="${y}" />`;
  }

  const pts = state.history;
  if(pts.length > 1){
    const tempPath = pts.map((p,i)=>{
      const x = pad + (w-2*pad) * i/(MAX_POINTS-1);
      const y = h - pad - ((p.temp-16)/(34-16))*(h-2*pad);
      return `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const humPath = pts.map((p,i)=>{
      const x = pad + (w-2*pad) * i/(MAX_POINTS-1);
      const y = h - pad - ((p.hum-20)/(80-20))*(h-2*pad);
      return `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    parts += `<path d="${tempPath}" fill="none" stroke="#7fff9e" stroke-width="2"/>`;
    parts += `<path d="${humPath}" fill="none" stroke="#5eeadd" stroke-width="2"/>`;
  }
  svg.innerHTML = parts;
}

function renderTable(){
  const body = document.getElementById('history-body');
  const rows = state.history.slice(-8).reverse().map(p => `
    <tr>
      <td>${fmtTime(p.t)}</td>
      <td>${p.temp.toFixed(1)}°C</td>
      <td>${p.hum.toFixed(0)}%RH</td>
      <td>${Math.round(p.lux)} lux</td>
      <td><span class="tag ${p.ok?'ok':'warn'}">${p.ok?'OK':'WARN'}</span></td>
    </tr>`).join('');
  body.innerHTML = rows;
}

tick();
setInterval(tick, 2000);