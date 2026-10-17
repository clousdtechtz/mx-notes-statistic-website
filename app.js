// app.js — simple notebook: auto-save, parse lines, show frequency stats, export/import
const STORAGE_KEY = 'mx-notes-lines-v1';

const textarea = document.getElementById('lines');
const totalEl = document.getElementById('total');
const uniqueEl = document.getElementById('unique');
const freqList = document.getElementById('freqList');
const clearBtn = document.getElementById('clear');
const exportJsonBtn = document.getElementById('export-json');
const exportCsvBtn = document.getElementById('export-csv');
const fileImport = document.getElementById('fileImport');

function load() {
  const raw = localStorage.getItem(STORAGE_KEY) || '';
  textarea.value = raw;
  updateStatsFromText(raw);
}

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, textarea.value);
    updateStatsFromText(textarea.value);
    saveTimer = null;
  }, 450); // debounce auto-save
}

textarea.addEventListener('input', scheduleSave);

// Update stats: split lines, trim, ignore empty lines, count occurrences
function updateStatsFromText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const total = lines.length;
  const freq = {};
  for (const l of lines) {
    const key = l;
    freq[key] = (freq[key] || 0) + 1;
  }
  const uniques = Object.keys(freq).length;
  totalEl.textContent = total;
  uniqueEl.textContent = uniques;
  renderFreqList(freq);
}

function renderFreqList(freq) {
  freqList.innerHTML = '';
  // Convert to array, sort by count desc then name
  const items = Object.entries(freq).sort((a,b)=>{
    if (b[1] !== a[1]) return b[1]-a[1];
    return a[0].localeCompare(b[0]);
  });
  for (const [name,count] of items) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="name">${escapeHtml(name)}</span><span class="count">${count}</span>`;
    freqList.appendChild(li);
  }
}

function escapeHtml(s){
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

clearBtn.addEventListener('click', ()=>{
  if (!confirm('Clear all notes? This cannot be undone.')) return;
  textarea.value = '';
  localStorage.removeItem(STORAGE_KEY);
  updateStatsFromText('');
});

exportJsonBtn.addEventListener('click', ()=>{
  const text = textarea.value;
  const blob = new Blob([JSON.stringify({lines: text.split(/\r?\n/)}, null, 2)], {type:'application/json'});
  downloadBlob(blob, 'mx-notes.json');
});

exportCsvBtn.addEventListener('click', ()=>{
  const lines = textarea.value.split(/\r?\n/).filter(Boolean);
  const csv = lines.map(l => `"${String(l).replace(/"/g,'""')}"`).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  downloadBlob(blob, 'mx-notes.csv');
});

fileImport.addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const txt = await f.text();
  // Try parse as JSON with { lines: [...] } or raw text
  try {
    const parsed = JSON.parse(txt);
    if (Array.isArray(parsed.lines)) {
      textarea.value = parsed.lines.join('\n');
    } else {
      // fallback: store the whole string
      textarea.value = String(parsed);
    }
  } catch(err) {
    // not JSON — treat as csv or text: replace commas with newlines only if looks CSV
    if (txt.includes('\n')) {
      textarea.value = txt;
    } else if (txt.includes(',')) {
      textarea.value = txt.split(',').map(s=>s.trim()).join('\n');
    } else {
      textarea.value = txt;
    }
  }
  scheduleSave();
  // clear the file input so same file can be imported again if needed
  e.target.value = '';
});

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

// Initialize
load();
