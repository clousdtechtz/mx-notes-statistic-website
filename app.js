// app.js — autosave, status updates, import/export kept if needed
const STORAGE_KEY = 'mx-notes-notepad-v1';
const textarea = document.getElementById('notepad');
const statusText = document.getElementById('statusText');

function loadSave() {
  const saved = localStorage.getItem(STORAGE_KEY) || '';
  textarea.value = saved;
  updateStatus();
}

let saveTimer = null;
function autoSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, textarea.value);
    saveTimer = null;
  }, 300);
}

function getCursorStats() {
  const text = textarea.value || '';
  const start = textarea.selectionStart || 0;
  const before = text.slice(0, start);
  const line = before.split('\n').length;
  const lastLine = before.split('\n').pop() || '';
  const column = lastLine.length + 1;
  return { line, column };
}

function updateStatus() {
  const { line, column } = getCursorStats();
  statusText.textContent = `Line ${line}, Column ${column}`;
}

// wire events
textarea.addEventListener('input', () => { autoSave(); updateStatus(); });
textarea.addEventListener('click', updateStatus);
textarea.addEventListener('keyup', updateStatus);
textarea.addEventListener('select', updateStatus);

// initial load
loadSave();
