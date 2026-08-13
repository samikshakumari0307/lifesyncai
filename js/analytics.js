// js/analytics.js
import { db } from './firebase.js';
import { requireAuth } from './utils.js';
import { 
  collection, 
  query, 
  where,
  orderBy,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

// Chart Instances
let moodChartInstance = null;
let taskChartInstance = null;
let studyChartInstance = null;

// Neo-brutalist Chart Defaults
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = "#1a1a1a";
Chart.defaults.scale.grid.color = "transparent"; // No inner grid lines

const chartColors = {
  peach: '#ffa07a',
  yellow: '#fde047',
  blue: '#93c5fd',
  green: '#6ee7b7',
  black: '#1a1a1a'
};

async function init() {
  try {
    currentUser = await requireAuth();
    initCharts();
    loadAnalytics();
  } catch (err) {
    console.error("Auth error", err);
  }
}

function initCharts() {
  // 1. Mood Trend (Line Chart)
  const ctxMood = document.getElementById('moodChart').getContext('2d');
  moodChartInstance = new Chart(ctxMood, {
    type: 'line',
    data: { labels: [], datasets: [{ 
      label: 'Mood Level', 
      data: [], 
      borderColor: chartColors.black,
      borderWidth: 4,
      backgroundColor: chartColors.peach,
      fill: true,
      tension: 0.4, // Smooth curves
      pointBackgroundColor: chartColors.yellow,
      pointBorderColor: chartColors.black,
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8
    }]},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          min: 1, max: 5,
          ticks: { stepSize: 1, callback: (val) => ["", "😢", "😟", "😐", "🙂", "😁"][val] }
        }
      },
      plugins: { legend: { display: false } }
    }
  });

  // 2. Task Priority (Doughnut)
  const ctxTask = document.getElementById('taskChart').getContext('2d');
  taskChartInstance = new Chart(ctxTask, {
    type: 'doughnut',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: [chartColors.peach, chartColors.yellow, chartColors.blue],
        borderColor: chartColors.black,
        borderWidth: 3,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: { legend: { position: 'bottom' } }
    }
  });

  // 3. Study Hours (Bar)
  const ctxStudy = document.getElementById('studyChart').getContext('2d');
  studyChartInstance = new Chart(ctxStudy, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Study Minutes',
        data: [],
        backgroundColor: chartColors.green,
        borderColor: chartColors.black,
        borderWidth: 3,
        borderRadius: 8, // Sketchy rounded top
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { drawBorder: true, color: 'rgba(0,0,0,0.1)' } }
      }
    }
  });
}

function loadAnalytics() {
  // 1. Tasks Stat & Chart
  const qTasks = query(collection(db, "users", currentUser.uid, "tasks"));
  onSnapshot(qTasks, (snapshot) => {
    let completed = 0;
    let total = 0;
    let priorities = { High: 0, Medium: 0, Low: 0 };

    snapshot.forEach(docSnap => {
      total++;
      const data = docSnap.data();
      if (data.completed) completed++;
      if (data.priority && priorities[data.priority] !== undefined) {
        priorities[data.priority]++;
      }
    });
    
    document.getElementById('stat-tasks').textContent = completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById('task-rate-text').textContent = `${rate}%`;
    document.getElementById('task-rate-bar').style.width = `${rate}%`;

    // Update Doughnut Chart
    if (taskChartInstance) {
      taskChartInstance.data.datasets[0].data = [priorities.High, priorities.Medium, priorities.Low];
      taskChartInstance.update();
    }
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

  // 3. Study Stat & Chart
  const qStudy = query(collection(db, "users", currentUser.uid, "studySessions"));
  onSnapshot(qStudy, (snapshot) => {
    let totalMins = 0;
    let subjects = {};

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.completed) {
        const dur = parseInt(data.duration || 0);
        totalMins += dur;
        const sub = data.subject || 'Other';
        subjects[sub] = (subjects[sub] || 0) + dur;
      }
    });
    
    const hours = Math.floor(totalMins / 60);
    document.getElementById('stat-study').textContent = `${hours}h`;

    // Update Bar Chart
    if (studyChartInstance) {
      studyChartInstance.data.labels = Object.keys(subjects);
      studyChartInstance.data.datasets[0].data = Object.values(subjects);
      studyChartInstance.update();
    }
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

  // 5. Mood Trend Chart
  const qMood = query(collection(db, "users", currentUser.uid, "moodLogs"), orderBy("createdAt", "desc"));
  onSnapshot(qMood, (snapshot) => {
    let logs = [];
    snapshot.forEach(docSnap => logs.push(docSnap.data()));
    
    // Take last 7, reverse for chronological order
    logs = logs.slice(0, 7).reverse();
    
    if (moodChartInstance) {
      moodChartInstance.data.labels = logs.map(l => new Date(l.createdAt).toLocaleDateString(undefined, {weekday:'short'}));
      moodChartInstance.data.datasets[0].data = logs.map(l => l.value);
      moodChartInstance.update();
    }
  });
}

init();

