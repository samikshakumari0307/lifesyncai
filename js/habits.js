// js/habits.js
import { db } from './firebase.js';
import { requireAuth, setupModal, generateId } from './utils.js';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
const habitsListEl = document.getElementById('habits-list');
let currentEditingHabitId = null;

// Setup Modal
const { openModal, closeModal } = setupModal('habit-modal', 'btn-add-habit', 'btn-close-modal');

document.getElementById('btn-add-habit').addEventListener('click', () => {
  currentEditingHabitId = null;
  habitForm.reset();
  document.querySelector('#habit-modal .modal-title').textContent = 'New Habit';
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
});

// --- Form UX Upgrades ---
const freqChips = document.querySelectorAll('#habit-freq-chips .chip-btn');
const freqInput = document.getElementById('habit-freq');

freqChips.forEach(chip => {
  chip.addEventListener('click', (e) => {
    freqChips.forEach(c => {
      c.classList.remove('active');
      c.style.background = '';
      c.style.color = '';
    });
    const value = e.target.getAttribute('data-value');
    e.target.classList.add('active');
    e.target.style.background = '#1a1a1a';
    e.target.style.color = '#fff';
    freqInput.value = value;
  });
});

async function init() {
  try {
    currentUser = await requireAuth();
    loadHabits();
  } catch (err) {
    console.error("Auth error", err);
  }
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadHabits() {
  const q = query(
    collection(db, "users", currentUser.uid, "habits"), 
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    habitsListEl.innerHTML = '';
    
    if (snapshot.empty) {
      habitsListEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
          <p>No habits tracked yet. Start building good habits!</p>
        </div>
      `;
      return;
    }

    const today = getTodayString();
    const yesterday = getYesterdayString();

    snapshot.forEach((docSnap) => {
      const habit = docSnap.data();
      let streak = habit.currentStreak || 0;
      let completedToday = (habit.lastCompletedDate === today);
      
      // Reset streak if missed yesterday (and not completed today)
      if (!completedToday && habit.lastCompletedDate !== yesterday && habit.lastCompletedDate) {
        streak = 0; 
        // We should theoretically save this to DB, but doing it on-read is safer to avoid recursive writes.
      }

      renderHabit(habit, docSnap.id, streak, completedToday);
    });
  });
}

function renderHabit(habit, id, streak, completedToday) {
  const div = document.createElement('div');
  div.className = 'card habit-card';
  div.innerHTML = `
    <div class="habit-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div class="habit-title">${habit.name}</div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-edit-habit" data-id="${id}" title="Edit" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer; padding:0.25rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-delete-habit" data-id="${id}" title="Delete" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer; padding:0.25rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
    <div style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.85rem;">${habit.frequency}</div>
    <div class="habit-streak">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
      ${streak} Day Streak
    </div>
    <div class="habit-actions">
      <button class="btn btn-check-habit ${completedToday ? 'btn-secondary' : 'btn-primary'}" data-id="${id}" data-streak="${streak}" data-completed="${completedToday}" data-longest-streak="${habit.longestStreak || 0}">
        ${completedToday ? 'Completed Today ✓' : 'Complete Habit'}
      </button>
    </div>
  `;
  habitsListEl.appendChild(div);

  // Check Habit
  div.querySelector('.btn-check-habit').addEventListener('click', async (e) => {
    const habitId = e.currentTarget.getAttribute('data-id');
    const isCompleted = e.currentTarget.getAttribute('data-completed') === 'true';
    const currentStreak = parseInt(e.currentTarget.getAttribute('data-streak'));
    const longestStreak = parseInt(e.currentTarget.getAttribute('data-longest-streak') || 0);
    
    const today = getTodayString();
    
    let newStreak = isCompleted ? Math.max(0, currentStreak - 1) : currentStreak + 1;
    let newDate = isCompleted ? null : today;
    
    await updateDoc(doc(db, "users", currentUser.uid, "habits", habitId), {
      currentStreak: newStreak,
      lastCompletedDate: newDate,
      longestStreak: Math.max(newStreak, longestStreak)
    });
  });

  // Delete Habit
  div.querySelector('.btn-delete-habit').addEventListener('click', async (e) => {
    const habitId = e.currentTarget.getAttribute('data-id');
    if (confirm("Delete this habit?")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "habits", habitId));
    }
  });

  // Edit Habit
  div.querySelector('.btn-edit-habit').addEventListener('click', (e) => {
    const habitId = e.currentTarget.getAttribute('data-id');
    currentEditingHabitId = habitId;
    
    document.querySelector('#habit-modal .modal-title').textContent = 'Edit Habit';
    document.getElementById('habit-name').value = habit.name;
    document.getElementById('habit-freq').value = habit.frequency;
    
    // Set frequency chips
    freqChips.forEach(c => {
      c.classList.remove('active');
      c.style.background = '';
      c.style.color = '';
      if (c.getAttribute('data-value') === habit.frequency) {
        c.classList.add('active');
        c.style.background = '#1a1a1a';
        c.style.color = '#fff';
      }
    });
    
    openModal();
  });
}

// Form Submit
const habitForm = document.getElementById('habit-form');
habitForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('habit-name').value;
  const frequency = document.getElementById('habit-freq').value;
  const btn = document.getElementById('btn-save-habit');
  
  try {
    btn.textContent = 'Saving...';
    btn.disabled = true;
    if (currentEditingHabitId) {
      await updateDoc(doc(db, "users", currentUser.uid, "habits", currentEditingHabitId), {
        name,
        frequency,
        updatedAt: new Date().toISOString()
      });
    } else {
      const habitId = generateId();
      await setDoc(doc(db, "users", currentUser.uid, "habits", habitId), {
        name,
        frequency,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        createdAt: new Date().toISOString()
      });
    }
    
    closeModal();
    habitForm.reset();
    
    // Reset chips to Daily
    freqChips.forEach(c => {
      c.classList.remove('active');
      c.style.background = '';
      c.style.color = '';
    });
    const dailyChip = document.querySelector('#habit-freq-chips .chip-btn[data-value="Daily"]');
    if (dailyChip) {
      dailyChip.classList.add('active');
      dailyChip.style.background = '#1a1a1a';
      dailyChip.style.color = '#fff';
      freqInput.value = 'Daily';
    }
  } catch(err) {
    console.error(err);
    alert("Error creating habit");
  } finally {
    btn.textContent = 'Save Habit';
    btn.disabled = false;
  }
});

init();

