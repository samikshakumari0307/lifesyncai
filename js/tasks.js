// js/tasks.js
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
let currentEditingTaskId = null;
const taskListEl = document.getElementById('task-list');

// Setup Modal
const { openModal, closeModal } = setupModal('task-modal', 'btn-add-task', 'btn-close-modal');

document.getElementById('btn-add-task').addEventListener('click', () => {
  currentEditingTaskId = null;
  taskForm.reset();
  document.querySelector('#task-modal .modal-title').textContent = 'New Task';
  datePicker.setDate(new Date());
  
  priorityChips.forEach(c => c.classList.remove('active', 'active-high', 'active-medium', 'active-low'));
  const mediumChip = document.querySelector('#task-priority-chips .chip-btn[data-value="Medium"]');
  if (mediumChip) {
    mediumChip.classList.add('active', 'active-medium');
    priorityInput.value = 'Medium';
  }
});

// --- Form UX Upgrades ---
// 1. Smart Default for Date with Flatpickr
const datePicker = flatpickr("#task-date", {
  defaultDate: "today",
  dateFormat: "Y-m-d",
  altInput: true,
  altFormat: "F j, Y",
  disableMobile: true // Uses our custom themed calendar even on mobile
});

// 2. Chip Selection Logic
const priorityChips = document.querySelectorAll('#task-priority-chips .chip-btn');
const priorityInput = document.getElementById('task-priority');

priorityChips.forEach(chip => {
  chip.addEventListener('click', (e) => {
    // Remove active class from all
    priorityChips.forEach(c => {
      c.classList.remove('active', 'active-high', 'active-medium', 'active-low');
    });
    // Add active class to clicked
    const value = e.target.getAttribute('data-value');
    e.target.classList.add('active', `active-${value.toLowerCase()}`);
    // Set hidden input
    priorityInput.value = value;
  });
});

// Init
async function init() {
  try {
    currentUser = await requireAuth();
    loadTasks();
  } catch (err) {
    console.error("Auth error", err);
  }
}

// Load Tasks with Realtime Listener
function loadTasks() {
  const q = query(
    collection(db, "users", currentUser.uid, "tasks"), 
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    taskListEl.innerHTML = ''; // Clear list
    
    if (snapshot.empty) {
      taskListEl.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <p>No tasks yet. Create one to get started!</p>
        </div>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const task = docSnap.data();
      renderTask(task, docSnap.id);
    });
  });
}

function renderTask(task, id) {
  const isCompleted = task.completed;
  const badgeClass = task.priority === 'High' ? 'badge-high' : task.priority === 'Medium' ? 'badge-medium' : 'badge-low';
  
  const div = document.createElement('div');
  div.className = `list-item ${isCompleted ? 'completed' : ''}`;
  div.innerHTML = `
    <div class="item-left">
      <div class="checkbox ${isCompleted ? 'checked' : ''}" data-id="${id}" data-completed="${isCompleted}"></div>
      <div class="item-details">
        <h4>${task.title}</h4>
        <p>${task.dueDate} • ${task.description || 'No description'}</p>
      </div>
    </div>
    <div class="item-right" style="display:flex; align-items:center; gap: 0.5rem;">
      <span class="badge ${badgeClass}">${task.priority}</span>
      <button class="btn-edit" data-id="${id}" title="Edit" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer; padding:0.25rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
      <button class="btn-delete" data-id="${id}" title="Delete" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer; padding:0.25rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </div>
  `;

  taskListEl.appendChild(div);

  // Toggle Completion
  div.querySelector('.checkbox').addEventListener('click', async (e) => {
    const taskId = e.target.getAttribute('data-id');
    const currentlyCompleted = e.target.getAttribute('data-completed') === 'true';
    await updateDoc(doc(db, "users", currentUser.uid, "tasks", taskId), {
      completed: !currentlyCompleted
    });
  });

  // Delete Task
  div.querySelector('.btn-delete').addEventListener('click', async (e) => {
    const taskId = e.currentTarget.getAttribute('data-id');
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "tasks", taskId));
    }
  });

  // Edit Task
  div.querySelector('.btn-edit').addEventListener('click', (e) => {
    const taskId = e.currentTarget.getAttribute('data-id');
    currentEditingTaskId = taskId;
    
    document.querySelector('#task-modal .modal-title').textContent = 'Edit Task';
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-desc').value = task.description || '';
    
    datePicker.setDate(task.dueDate);
    
    // Set priority chip
    priorityInput.value = task.priority;
    priorityChips.forEach(c => c.classList.remove('active', 'active-high', 'active-medium', 'active-low'));
    const targetChip = document.querySelector(`#task-priority-chips .chip-btn[data-value="${task.priority}"]`);
    if (targetChip) {
      targetChip.classList.add('active', `active-${task.priority.toLowerCase()}`);
    }
    
    openModal();
  });
}

// Handle Form Submit
const taskForm = document.getElementById('task-form');
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('task-title').value;
  const desc = document.getElementById('task-desc').value;
  const priority = document.getElementById('task-priority').value;
  const dueDate = document.getElementById('task-date').value;
  const btn = document.getElementById('btn-save-task');
  
  try {
    btn.textContent = 'Saving...';
    btn.disabled = true;
    
    if (currentEditingTaskId) {
      await updateDoc(doc(db, "users", currentUser.uid, "tasks", currentEditingTaskId), {
        title,
        description: desc,
        priority,
        dueDate,
        updatedAt: new Date().toISOString()
      });
    } else {
      const taskId = generateId();
      await setDoc(doc(db, "users", currentUser.uid, "tasks", taskId), {
        title,
        description: desc,
        priority,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString()
      });
    }
    
    closeModal();
    taskForm.reset();
    datePicker.setDate(new Date()); // Reset smart default
    
    // Reset chips to Medium
    priorityChips.forEach(c => c.classList.remove('active', 'active-high', 'active-medium', 'active-low'));
    const mediumChip = document.querySelector('#task-priority-chips .chip-btn[data-value="Medium"]');
    if (mediumChip) {
      mediumChip.classList.add('active', 'active-medium');
      priorityInput.value = 'Medium';
    }
  } catch (err) {
    console.error("Error adding task: ", err);
    alert("Failed to save task.");
  } finally {
    btn.textContent = 'Save Task';
    btn.disabled = false;
  }
});

init();

