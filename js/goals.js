// js/goals.js
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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
const goalsListEl = document.getElementById('goals-list');
let currentEditingGoalId = null;

// Setup Modal
const { openModal, closeModal } = setupModal('goal-modal', 'btn-add-goal', 'btn-close-modal');

document.getElementById('btn-add-goal').addEventListener('click', () => {
  currentEditingGoalId = null;
  goalForm.reset();
  document.querySelector('#goal-modal .modal-title').textContent = 'Set a New Goal';
  datePicker.setDate(new Date());
});

// Smart Default for Date with Flatpickr
const datePicker = flatpickr("#goal-deadline", {
  defaultDate: "today",
  dateFormat: "Y-m-d",
  altInput: true,
  altFormat: "F j, Y",
  disableMobile: true
});

async function init() {
  try {
    currentUser = await requireAuth();
    loadGoals();
  } catch (err) {
    console.error("Auth error", err);
  }
}

function loadGoals() {
  const q = query(
    collection(db, "users", currentUser.uid, "goals"), 
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    goalsListEl.innerHTML = ''; 
    
    if (snapshot.empty) {
      goalsListEl.innerHTML = `
        <div class="col-span-12 empty-state">
          <p>No goals set yet. Aim high and create one!</p>
        </div>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const goal = docSnap.data();
      renderGoal(goal, docSnap.id);
    });
  });
}

function renderGoal(goal, id) {
  const current = parseInt(goal.current || 0);
  const target = parseInt(goal.target);
  const percentage = Math.min(100, Math.max(0, (current / target) * 100)).toFixed(1);
  const isCompleted = current >= target;
  
  const div = document.createElement('div');
  const styles = ['paper-style-yellow', 'paper-style-blue', 'paper-style-white', 'paper-style-grid'];
  
  let selectedStyle = '';
  if (goal.paperStyle && styles.includes(goal.paperStyle)) {
    selectedStyle = goal.paperStyle;
  } else {
    // Fallback to random assignment
    const styleIndex = id.charCodeAt(id.length - 1) % styles.length;
    selectedStyle = styles[styleIndex];
  }
  
  div.className = `col-span-6 goal-card ${selectedStyle}`;
  div.innerHTML = `
    <div class="goal-header">
      <div>
        <h3 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${goal.title}</h3>
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Deadline: ${goal.deadline}</span>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
        <button class="btn-edit-goal" data-id="${id}" title="Edit" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer; padding:0.25rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-delete-goal" data-id="${id}" title="Delete" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer; padding:0.25rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
    
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: ${percentage}%;"></div>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
      <span style="font-weight: 500; color: ${isCompleted ? 'var(--accent-success)' : 'var(--text-primary)'};">${percentage}% Completed</span>
      <span style="color: var(--text-secondary);">${current} / ${target} ${goal.unit}</span>
    </div>
    
    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
      <button class="btn btn-secondary btn-update-progress" data-id="${id}" data-current="${current}" data-target="${target}" data-change="1" style="flex:1; padding: 0.5rem;">+1 ${goal.unit}</button>
      <button class="btn btn-outline btn-update-progress" data-id="${id}" data-current="${current}" data-target="${target}" data-change="5" style="flex:1; padding: 0.5rem;">+5 ${goal.unit}</button>
    </div>
  `;

  goalsListEl.appendChild(div);

  // Handle Progress Update
  const updateBtns = div.querySelectorAll('.btn-update-progress');
  updateBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const el = e.currentTarget;
      const goalId = el.getAttribute('data-id');
      const cur = parseInt(el.getAttribute('data-current'));
      const targetVal = parseInt(el.getAttribute('data-target'));
      const change = parseInt(el.getAttribute('data-change'));
      
      const newCur = Math.min(targetVal, cur + change); // cap at target
      
      await updateDoc(doc(db, "users", currentUser.uid, "goals", goalId), {
        current: newCur
      });
    });
  });

  // Delete Handle
  div.querySelector('.btn-delete-goal').addEventListener('click', async (e) => {
    const goalId = e.currentTarget.getAttribute('data-id');
    if (confirm("Delete this goal?")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "goals", goalId));
    }
  });

  // Edit Handle
  div.querySelector('.btn-edit-goal').addEventListener('click', (e) => {
    const goalId = e.currentTarget.getAttribute('data-id');
    currentEditingGoalId = goalId;
    
    document.querySelector('#goal-modal .modal-title').textContent = 'Edit Goal';
    document.getElementById('goal-title').value = goal.title;
    document.getElementById('goal-target').value = goal.target;
    document.getElementById('goal-unit').value = goal.unit;
    if (document.getElementById('goal-style') && goal.paperStyle) {
      document.getElementById('goal-style').value = goal.paperStyle;
    }
    datePicker.setDate(goal.deadline);
    
    openModal();
  });
}

// Handle Form Submit
const goalForm = document.getElementById('goal-form');
goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('goal-title').value;
  const target = parseInt(document.getElementById('goal-target').value);
  const unit = document.getElementById('goal-unit').value;
  const deadline = document.getElementById('goal-deadline').value;
  let paperStyle = document.getElementById('goal-style') ? document.getElementById('goal-style').value : 'random';
  const btn = document.getElementById('btn-save-goal');
  
  try {
    btn.textContent = 'Saving...';
    btn.disabled = true;
    
    const goalData = {
      title,
      target,
      unit,
      deadline,
      current: 0,
      createdAt: new Date().toISOString()
    };
    
    if (paperStyle !== 'random') {
      goalData.paperStyle = paperStyle;
    }
    
    if (currentEditingGoalId) {
      goalData.updatedAt = new Date().toISOString();
      await updateDoc(doc(db, "users", currentUser.uid, "goals", currentEditingGoalId), goalData);
    } else {
      goalData.current = 0;
      goalData.createdAt = new Date().toISOString();
      const goalId = generateId();
      await setDoc(doc(db, "users", currentUser.uid, "goals", goalId), goalData);
    }
    
    closeModal();
    goalForm.reset();
    datePicker.setDate(new Date());
  } catch(err) {
    console.error("Error saving goal: ", err);
    alert("Failed to save goal.");
  } finally {
    btn.textContent = 'Save Goal';
    btn.disabled = false;
  }
});

init();

