// js/dashboard.js
import { db } from './firebase.js';
import { requireAuth } from './utils.js';
import { logoutUser } from './auth.js';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Set current date & greeting
  const dateElement = document.getElementById('current-date');
  const greetingEl = document.getElementById('greeting');
  const d = new Date();
  
  if (dateElement) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = d.toLocaleDateString('en-US', options);
  }
  
  if (greetingEl) {
    const hour = d.getHours();
    let greeting = "Good Evening";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 18) greeting = "Good Afternoon";
    greetingEl.textContent = greeting;
  }

  // Logout Button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  try {
    currentUser = await requireAuth();
    if (greetingEl) greetingEl.textContent += `, ${currentUser.displayName || currentUser.email.split('@')[0]}`;
    
    // Check if we are actually on the dashboard page before setting up listeners
    if (document.getElementById('stat-tasks')) {
      setupRealtimeListeners();
    }
  } catch (err) {
    console.log("Not on dashboard or auth failed");
  }
});

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function setupRealtimeListeners() {
  const todayStr = getTodayString();
  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);
  
  // Elements
  const statTasks = document.getElementById('stat-tasks');
  const statFocus = document.getElementById('stat-focus');
  const statHabits = document.getElementById('stat-habits');
  const widgetTasks = document.getElementById('widget-tasks');
  const widgetHabits = document.getElementById('widget-habits');
  const widgetNotes = document.getElementById('widget-notes');

  // 1. Listen to Tasks
  const tasksQ = query(collection(db, "users", currentUser.uid, "tasks"));
  onSnapshot(tasksQ, (snapshot) => {
    let completedToday = 0;
    let importantTasks = [];
    let priorityCounts = { High: 0, Medium: 0, Low: 0 };
    
    snapshot.forEach(docSnap => {
      const t = docSnap.data();
      
      if (!t.completed) {
        if (t.priority in priorityCounts) {
          priorityCounts[t.priority]++;
        }
      }
      if (t.completed) {
        if (t.dueDate === todayStr) completedToday++;
      } else {
        if (t.priority === 'High' || t.dueDate === todayStr) {
          importantTasks.push(t);
        }
      }
    });

    statTasks.textContent = completedToday;
    
    widgetTasks.innerHTML = importantTasks.length === 0 
      ? '<p style="color:var(--text-secondary); padding: 1rem 0;">No high priority tasks today.</p>' 
      : importantTasks.slice(0, 5).map(t => `
        <div class="mini-list-item">
          <div>
            <div style="font-weight: 500;">${t.title}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${t.dueDate}</div>
          </div>
          <span class="badge ${t.priority === 'High' ? 'badge-high' : 'badge-medium'}">${t.priority}</span>
        </div>
      `).join('');
      
    updateTasksChart(priorityCounts);
  });

  // 2. Listen to Habits
  const habitsQ = query(collection(db, "users", currentUser.uid, "habits"));
  onSnapshot(habitsQ, (snapshot) => {
    let habitsChecked = 0;
    let habitsHtml = '';
    
    if (snapshot.empty) {
      habitsHtml = '<p style="color:var(--text-secondary); padding: 1rem 0;">No habits tracked.</p>';
    } else {
      snapshot.forEach(docSnap => {
        const h = docSnap.data();
        const isChecked = h.lastCompletedDate === todayStr;
        if (isChecked) habitsChecked++;
        
        habitsHtml += `
          <div class="mini-list-item">
            <span>${h.name}</span>
            <span style="color: ${isChecked ? 'var(--accent-success)' : 'var(--text-tertiary)'}; font-weight: bold;">
              ${isChecked ? '✓' : '○'}
            </span>
          </div>
        `;
      });
    }
    
    statHabits.textContent = `${habitsChecked} / ${snapshot.size}`;
    widgetHabits.innerHTML = habitsHtml;
  });

  // 3. Listen to Focus Sessions
  const focusQ = query(collection(db, "users", currentUser.uid, "focusSessions"));
  onSnapshot(focusQ, (snapshot) => {
    let totalFocusMins = 0;
    
    // For chart
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    const focusByDate = {};
    last7Days.forEach(d => focusByDate[d] = 0);

    snapshot.forEach(docSnap => {
      const f = docSnap.data();
      if (!f.completedAt) return;
      
      const fDate = new Date(f.completedAt);
      if (isNaN(fDate.getTime())) return;
      
      const dateStr = fDate.toISOString().split('T')[0];
      
      if (fDate >= startOfDay) {
        totalFocusMins += f.duration;
      }
      
      if (focusByDate[dateStr] !== undefined) {
        focusByDate[dateStr] += f.duration;
      }
    });
    statFocus.textContent = `${totalFocusMins}m`;
    updateFocusChart(last7Days, Object.values(focusByDate));
  });

  // 4. Listen to Notes (Recent 3)
  const notesQ = query(
    collection(db, "users", currentUser.uid, "notes"), 
    orderBy("createdAt", "desc"),
    limit(3)
  );
  onSnapshot(notesQ, (snapshot) => {
    if (snapshot.empty) {
      widgetNotes.innerHTML = '<p style="color:var(--text-secondary); padding: 1rem 0;">No notes written yet.</p>';
      return;
    }
    
    let notesHtml = '';
    snapshot.forEach((docSnap) => {
      const note = docSnap.data();
      const title = note.title ? `<h3 style="font-size: 1.1rem;">${note.title}</h3>` : '';
      const snippet = note.content.length > 80 ? note.content.substring(0, 80) + '...' : note.content;
      const dateStr = note.createdAt ? new Date(note.createdAt).toLocaleDateString() : '';
      const styles = ['paper-style-yellow', 'paper-style-blue', 'paper-style-white', 'paper-style-grid'];
      let selectedStyle = '';
      if (note.paperStyle && styles.includes(note.paperStyle)) {
        selectedStyle = note.paperStyle;
      } else {
        const styleIndex = docSnap.id.charCodeAt(docSnap.id.length - 1) % styles.length;
        selectedStyle = styles[styleIndex];
      }
      
      notesHtml += `
        <div class="note-card ${selectedStyle}" style="flex: 1; min-width: 200px;">
          <div class="note-header">
            ${title}
          </div>
          <div class="note-content" style="font-size: 0.95rem;">${snippet}</div>
          <div class="note-date">${dateStr}</div>
        </div>
      `;
    });
    widgetNotes.innerHTML = notesHtml;
  });

  // 5. Load GitHub Heatmap
  const widgetGithub = document.getElementById('widget-github');
  if (widgetGithub) {
    getDoc(doc(db, "users", currentUser.uid)).then(userDoc => {
      if (userDoc.exists() && userDoc.data().githubUsername) {
        let username = userDoc.data().githubUsername;
        
        // Failsafe: If the database contains a full URL, extract the username on the fly
        if (username.includes('github.com/')) {
          username = username.split('github.com/')[1].replace('/', '').split('?')[0];
        }
        
        // Using ghchart.rshah.org as a lightweight proxy to generate the SVG heatmap
        widgetGithub.innerHTML = `
          <div style="width: 100%; overflow-x: auto;">
            <img src="https://ghchart.rshah.org/409cff/${username}" alt="${username}'s Github Chart" style="width: 100%; min-width: 700px; display: block; filter: hue-rotate(100deg);" />
          </div>
        `;
      } else {
        widgetGithub.innerHTML = `
          <div style="text-align: center; color: var(--text-secondary);">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 0.5rem;"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            <p>Connect your GitHub account in <a href="settings.html" style="color: var(--text-primary); text-decoration: underline;">Settings</a> to view your contribution heatmap.</p>
          </div>
        `;
      }
    });
  }
}

// Chart Instances
let focusChartInstance = null;
let tasksChartInstance = null;

function getChartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    text: isDark ? '#e5e7eb' : '#4b5563',
    grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    primary: isDark ? '#60a5fa' : '#2563eb', // Blue
    primaryAlpha: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.2)',
    high: '#ef4444', // Red
    medium: '#f59e0b', // Yellow
    low: '#10b981'  // Green
  };
}

function updateFocusChart(labels, data) {
  const ctx = document.getElementById('focusChart');
  if (!ctx) return;
  
  if (focusChartInstance) {
    focusChartInstance.data.labels = labels;
    focusChartInstance.data.datasets[0].data = data;
    focusChartInstance.update();
    return;
  }
  
  Chart.defaults.font.family = "'Inter', sans-serif";
  
  focusChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Focus Minutes',
        data: data,
        borderColor: '#1a1a1a',
        backgroundColor: '#93c5fd', // Pastel blue
        borderWidth: 4,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#fde047', // Yellow points
        pointBorderColor: '#1a1a1a',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw} mins`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'transparent' }, // No grid lines
          ticks: { color: '#1a1a1a', font: { weight: 'bold' } }
        },
        x: {
          grid: { display: false },
          ticks: {
            color: '#1a1a1a',
            font: { weight: 'bold' },
            callback: function(val, index) {
              const dateStr = this.getLabelForValue(val);
              return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
            }
          }
        }
      }
    }
  });
}

function updateTasksChart(counts) {
  const ctx = document.getElementById('tasksChart');
  if (!ctx) return;
  
  const data = [counts.High, counts.Medium, counts.Low];
  
  if (data.every(val => val === 0)) {
    data[0] = 0.1;
  }
  
  if (tasksChartInstance) {
    tasksChartInstance.data.datasets[0].data = data;
    tasksChartInstance.update();
    return;
  }
  
  tasksChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        data: data,
        backgroundColor: ['#ffa07a', '#fde047', '#93c5fd'],
        borderColor: '#1a1a1a',
        borderWidth: 3,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#1a1a1a',
            font: { weight: 'bold' }
          }
        }
      }
    }
  });
}

