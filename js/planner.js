// js/planner.js
import { db } from './firebase.js';
import { requireAuth } from './utils.js';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
const plannerTasks = document.getElementById('planner-tasks');
const plannerHabits = document.getElementById('planner-habits');
const plannerStudy = document.getElementById('planner-study');

async function init() {
  try {
    currentUser = await requireAuth();
    loadPlannerData();
  } catch (err) {
    console.error("Auth error", err);
  }
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadPlannerData() {
  const todayStr = getTodayString();

  // 1. Load Tasks
  const qTasks = query(collection(db, "users", currentUser.uid, "tasks"));
  onSnapshot(qTasks, (snapshot) => {
    let html = '';
    let hasItems = false;
    snapshot.forEach(docSnap => {
      const t = docSnap.data();
      if (t.dueDate === todayStr || (t.priority === 'High' && !t.completed)) {
        hasItems = true;
        html += renderCheckboxItem(docSnap.id, "tasks", t.title, t.completed);
      }
    });
    plannerTasks.innerHTML = hasItems ? html : '<p style="color:var(--text-secondary); padding: 1rem;">No tasks due today.</p>';
    attachListeners(plannerTasks, "tasks");
  });

  // 2. Load Habits
  const qHabits = query(collection(db, "users", currentUser.uid, "habits"));
  onSnapshot(qHabits, (snapshot) => {
    let html = '';
    let hasItems = false;
    snapshot.forEach(docSnap => {
      const h = docSnap.data();
      const isCompleted = h.lastCompletedDate === todayStr;
      hasItems = true;
      html += renderCheckboxItem(docSnap.id, "habits", h.name, isCompleted, h.currentStreak || 0, h.longestStreak || 0);
    });
    plannerHabits.innerHTML = hasItems ? html : '<p style="color:var(--text-secondary); padding: 1rem;">No habits tracked.</p>';
    attachListeners(plannerHabits, "habits");
  });

  // 3. Load Study Sessions
  const qStudy = query(collection(db, "users", currentUser.uid, "studySessions"), where("date", "==", todayStr));
  onSnapshot(qStudy, (snapshot) => {
    let html = '';
    let hasItems = false;
    snapshot.forEach(docSnap => {
      const s = docSnap.data();
      hasItems = true;
      html += renderCheckboxItem(docSnap.id, "studySessions", `${s.subject}: ${s.topic}`, s.completed);
    });
    plannerStudy.innerHTML = hasItems ? html : '<p style="color:var(--text-secondary); padding: 1rem;">No study sessions today.</p>';
    attachListeners(plannerStudy, "studySessions");
  });
}

function renderCheckboxItem(id, collectionName, label, isCompleted, currentStreak = 0, longestStreak = 0) {
  return `
    <div class="list-item ${isCompleted ? 'completed' : ''}" style="padding: 1rem;">
      <div class="item-left">
        <div class="checkbox ${isCompleted ? 'checked' : ''} planner-checkbox" 
             data-id="${id}" 
             data-collection="${collectionName}" 
             data-completed="${isCompleted}"
             data-streak="${currentStreak}"
             data-longest-streak="${longestStreak}">
        </div>
        <div class="item-details">
          <h4 style="font-size: 1rem; margin: 0;">${label}</h4>
        </div>
      </div>
    </div>
  `;
}

function attachListeners(container, collectionName) {
  const checkboxes = container.querySelectorAll('.planner-checkbox');
  checkboxes.forEach(cb => {
    cb.addEventListener('click', async (e) => {
      const el = e.target;
      const id = el.getAttribute('data-id');
      const isCompleted = el.getAttribute('data-completed') === 'true';
      const today = getTodayString();
      
      const updateData = {};
      
      if (collectionName === "habits") {
        const currentStreak = parseInt(el.getAttribute('data-streak') || 0);
        const longestStreak = parseInt(el.getAttribute('data-longest-streak') || 0);
        
        let newStreak = isCompleted ? Math.max(0, currentStreak - 1) : currentStreak + 1;
        updateData.currentStreak = newStreak;
        updateData.lastCompletedDate = isCompleted ? null : today;
        updateData.longestStreak = Math.max(newStreak, longestStreak);
      } else {
        updateData.completed = !isCompleted;
      }
      
      await updateDoc(doc(db, collectionName, id), updateData);
    });
  });
}

init();

