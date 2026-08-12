// js/mood.js
import { db } from './firebase.js';
import { requireAuth, generateId } from './utils.js';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
const moodHistoryEl = document.getElementById('mood-history');
const moodBtns = document.querySelectorAll('.mood-btn');
const selectedMoodInput = document.getElementById('selected-mood');
const selectedEmojiInput = document.getElementById('selected-emoji');

async function init() {
  try {
    currentUser = await requireAuth();
    loadMoods();
  } catch (err) {
    console.error("Auth error", err);
  }
}

// Mood Selection
moodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    moodBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMoodInput.value = btn.getAttribute('data-value');
    selectedEmojiInput.value = btn.getAttribute('data-emoji');
  });
});

function loadMoods() {
  const q = query(
    collection(db, "users", currentUser.uid, "moodLogs"), 
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    moodHistoryEl.innerHTML = ''; 
    
    if (snapshot.empty) {
      moodHistoryEl.innerHTML = `
        <div class="empty-state">
          <p>No mood logs yet.</p>
        </div>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const log = docSnap.data();
      renderMoodLog(log, docSnap.id);
    });
  });
}

function renderMoodLog(log, id) {
  const div = document.createElement('div');
  div.className = 'card log-card';
  
  const labels = ["", "Terrible", "Bad", "Okay", "Good", "Great"];
  const label = labels[log.value] || "Unknown";
  
  div.innerHTML = `
    <div class="log-emoji">${log.emoji}</div>
    <div class="log-details">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h3 style="font-size: 1.1rem;">Feeling ${label}</h3>
          <span style="font-size: 0.85rem; color: var(--text-tertiary);">${new Date(log.createdAt).toLocaleString()}</span>
        </div>
        <button class="btn-delete-mood" data-id="${id}" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
      ${log.note ? `<p style="margin-top: 0.5rem; color: var(--text-secondary);">${log.note}</p>` : ''}
    </div>
  `;

  moodHistoryEl.appendChild(div);

  // Handle Delete
  div.querySelector('.btn-delete-mood').addEventListener('click', async (e) => {
    const logId = e.currentTarget.getAttribute('data-id');
    if (confirm("Delete this log?")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "moodLogs", logId));
    }
  });
}

// Handle Form Submit
const moodForm = document.getElementById('mood-form');
moodForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const value = selectedMoodInput.value;
  const emoji = selectedEmojiInput.value;
  const note = document.getElementById('mood-note').value;
  const btn = document.getElementById('btn-save-mood');
  
  if (!value) {
    alert("Please select a mood first!");
    return;
  }
  
  try {
    btn.textContent = 'Logging...';
    btn.disabled = true;
    
    const logId = generateId();
    await setDoc(doc(db, "users", currentUser.uid, "moodLogs", logId), {
      value: parseInt(value),
      emoji,
      note,
      createdAt: new Date().toISOString()
    });
    
    moodForm.reset();
    moodBtns.forEach(b => b.classList.remove('selected'));
    selectedMoodInput.value = '';
    selectedEmojiInput.value = '';
  } catch (err) {
    console.error("Error saving mood: ", err);
    alert("Failed to save mood.");
  } finally {
    btn.textContent = 'Log Mood';
    btn.disabled = false;
  }
});

init();
