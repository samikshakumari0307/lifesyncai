// js/analytics.js
import { db } from './firebase.js';
import { requireAuth } from './utils.js';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

async function init() {
  try {
    currentUser = await requireAuth();
    loadAnalytics();
  } catch (err) {
    console.error("Auth error", err);
  }
}

function loadAnalytics() {
  // 1. Tasks Stat
  const qTasks = query(collection(db, "users", currentUser.uid, "tasks"));
  onSnapshot(qTasks, (snapshot) => {
    let completed = 0;
    let total = 0;
    snapshot.forEach(docSnap => {
      total++;
      if (docSnap.data().completed) completed++;
    });
    
    document.getElementById('stat-tasks').textContent = completed;
    
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById('task-rate-text').textContent = `${rate}%`;
    document.getElementById('task-rate-bar').style.width = `${rate}%`;
  });

  // 2. Habits Stat
  const qHabits = query(collection(db, "users", currentUser.uid, "habits"));
  onSnapshot(qHabits, (snapshot) => {
    let activeStreaks = 0;
    snapshot.forEach(docSnap => {
      if (docSnap.data().currentStreak > 0) activeStreaks++;
    });
    document.getElementById('stat-habits').textContent = activeStreaks;
  });

  // 3. Study Stat
  const qStudy = query(collection(db, "users", currentUser.uid, "studySessions"));
  onSnapshot(qStudy, (snapshot) => {
    let totalMins = 0;
    snapshot.forEach(docSnap => {
      if (docSnap.data().completed) {
        totalMins += parseInt(docSnap.data().duration || 0);
      }
    });
    const hours = Math.floor(totalMins / 60);
    document.getElementById('stat-study').textContent = `${hours}h`;
  });

  // 4. Goals Stat
  const qGoals = query(collection(db, "users", currentUser.uid, "goals"));
  onSnapshot(qGoals, (snapshot) => {
    let totalPercentage = 0;
    let totalGoals = 0;
    snapshot.forEach(docSnap => {
      const g = docSnap.data();
      const p = Math.min(100, (g.current / g.target) * 100);
      totalPercentage += p;
      totalGoals++;
    });
    
    const avg = totalGoals === 0 ? 0 : Math.round(totalPercentage / totalGoals);
    document.getElementById('goal-rate-text').textContent = `${avg}%`;
    document.getElementById('goal-rate-bar').style.width = `${avg}%`;
  });
}

init();
