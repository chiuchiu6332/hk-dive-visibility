// script.js — update clocks for selected time zones
const defaultZones = [
  'Local',
  'UTC',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Europe/London',
  'America/New_York',
  'Australia/Sydney'
];

const tzSelect = document.getElementById('tz-select');
const addBtn = document.getElementById('add-btn');
const addLocalBtn = document.getElementById('add-local');
const clocksContainer = document.getElementById('clocks');

// Try to populate timezone list from Intl if available
function getAllTimezones(){
  try{
    if (typeof Intl === 'object' && typeof Intl.supportedValuesOf === 'function'){
      return Intl.supportedValuesOf('timeZone');
    }
  }catch(e){/* ignore */}
  // Fallback: use a curated smaller list
  return [
    'UTC','Europe/London','Europe/Paris','Europe/Berlin','Asia/Hong_Kong','Asia/Tokyo','Asia/Singapore',
    'Asia/Shanghai','Asia/Kuala_Lumpur','Australia/Sydney','Pacific/Auckland','America/New_York','America/Los_Angeles'
  ];
}

const allZones = getAllTimezones();

function populateSelect(){
  // Add default list first
  defaultZones.forEach(tz => {
    const opt = document.createElement('option');
    opt.value = tz;
    opt.textContent = tz;
    tzSelect.appendChild(opt);
  });
  // Divider
  const divider = document.createElement('option');
  divider.disabled = true;
  divider.textContent = '─────────';
  tzSelect.appendChild(divider);
  // Add all zones alphabetically
  const uniq = Array.from(new Set(allZones)).sort();
  uniq.forEach(tz => {
    const opt = document.createElement('option');
    opt.value = tz;
    opt.textContent = tz;
    tzSelect.appendChild(opt);
  });
}

populateSelect();

let clocks = []; // {id, tz, el}
let nextId = 1;

function formatTimeForZone(date, tz){
  if (tz === 'Local'){
    return date.toLocaleTimeString();
  }
  try{
    return new Intl.DateTimeFormat(undefined, {timeStyle:'medium', hour12:false, timeZone: tz}).format(date);
  }catch(e){
    return 'Invalid TZ';
  }
}

function formatDateForZone(date, tz){
  if (tz === 'Local'){
    return date.toLocaleDateString();
  }
  try{
    return new Intl.DateTimeFormat(undefined,{dateStyle:'medium', timeZone:tz}).format(date);
  }catch(e){
    return '';
  }
}

function renderClock({id,tz}){
  const card = document.createElement('article');
  card.className = 'clock';
  card.dataset.id = id;

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';

  const title = document.createElement('h2');
  title.textContent = tz;

  const remove = document.createElement('button');
  remove.className = 'remove';
  remove.title = 'Remove clock';
  remove.textContent = '✕';
  remove.addEventListener('click', ()=> removeClock(id));

  header.appendChild(title);
  header.appendChild(remove);

  const timeEl = document.createElement('div');
  timeEl.className = 'time';
  timeEl.textContent = '';

  const tzEl = document.createElement('div');
  tzEl.className = 'tz';
  tzEl.textContent = '';

  card.appendChild(header);
  card.appendChild(timeEl);
  card.appendChild(tzEl);

  clocksContainer.appendChild(card);

  return {el:card, timeEl, tzEl};
}

function addClock(tz){
  if (!tz) return;
  // Prevent duplicates for same tz
  if (clocks.some(c => c.tz === tz)) return;
  const id = nextId++;
  const nodes = renderClock({id,tz});
  clocks.push({id,tz,el:nodes.el, timeEl:nodes.timeEl, tzEl:nodes.tzEl});
  updateClockNow(id);
}

function removeClock(id){
  const i = clocks.findIndex(c=>c.id===id);
  if (i===-1) return;
  const c = clocks[i];
  c.el.remove();
  clocks.splice(i,1);
}

function updateClockNow(id){
  const c = clocks.find(x=>x.id===id);
  if (!c) return;
  const now = new Date();
  c.timeEl.textContent = formatTimeForZone(now, c.tz);
  c.tzEl.textContent = formatDateForZone(now, c.tz) + (c.tz === 'Local' ? ` • ${Intl.DateTimeFormat().resolvedOptions().timeZone}` : ` • ${c.tz}`);
}

function updateAll(){
  const now = new Date();
  clocks.forEach(c=>{
    c.timeEl.textContent = formatTimeForZone(now, c.tz);
    c.tzEl.textContent = formatDateForZone(now, c.tz) + (c.tz === 'Local' ? ` • ${Intl.DateTimeFormat().resolvedOptions().timeZone}` : ` • ${c.tz}`);
  });
}

// Tick every second
setInterval(updateAll, 1000);

addBtn.addEventListener('click', ()=>{
  const tz = tzSelect.value;
  if (!tz) return;
  addClock(tz);
});

addLocalBtn.addEventListener('click', ()=> addClock('Local'));

// Add a few defaults
['Local','UTC','Asia/Hong_Kong','America/New_York','Europe/London'].forEach(tz=>addClock(tz));

// Save/restore simple state in localStorage
function saveState(){
  const data = clocks.map(c=>c.tz);
  localStorage.setItem('clocks', JSON.stringify(data));
}

function loadState(){
  try{
    const raw = localStorage.getItem('clocks');
    if (!raw) return false;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return false;
    // clear default clocks
    clocks.slice().forEach(c=>removeClock(c.id));
    arr.forEach(tz=>addClock(tz));
    return true;
  }catch(e){return false}
}

window.addEventListener('beforeunload', saveState);

// Try to load persisted clocks; if none, keep the default ones added
loadState();
