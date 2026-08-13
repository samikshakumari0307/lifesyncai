// js/study.js
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
const studyListEl = document.getElementById('study-list');
const statStudyHours = document.getElementById('stat-study-hours');
const statUpcoming = document.getElementById('stat-upcoming');

// Setup Modal
const { openModal, closeModal } = setupModal('session-modal', 'btn-add-session', 'btn-close-modal');

// Smart Default for Date with Flatpickr
const datePicker = flatpickr("#session-date", {
  defaultDate: "today",
  dateFormat: "Y-m-d",
  altInput: true,
  altFormat: "F j, Y",
  disableMobile: true
});

// Init
async function init() {
  try {
    currentUser = await requireAuth();
    loadSessions();
  } catch (err) {
    console.error("Auth error", err);
  }
}

// Load Study Sessions with Realtime Listener
function loadSessions() {
  const q = query(
    collection(db, "users", currentUser.uid, "studySessions"), 
    orderBy("date", "asc") // Order by date
  );

  onSnapshot(q, (snapshot) => {
    studyListEl.innerHTML = ''; // Clear list
    
    let totalMinutes = 0;
    let upcomingCount = 0;

    if (snapshot.empty) {
      studyListEl.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <p>No study sessions scheduled. Add one to begin!</p>
        </div>
      `;
      statStudyHours.textContent = '0h 0m';
      statUpcoming.textContent = '0';
      return;
    }

    const todayStr = getTodayString();

    snapshot.forEach((docSnap) => {
      const session = docSnap.data();
      
      // Calculate stats
      if (session.completed) {
        totalMinutes += parseInt(session.duration || 0);
      } else {
        if (session.date >= todayStr) {
          upcomingCount++;
        }
      }

      renderSession(session, docSnap.id);
    });

    // Update Stats UI
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    statStudyHours.textContent = `${hours}h ${mins}m`;
    statUpcoming.textContent = upcomingCount;
  });
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderSession(session, id) {
  const isCompleted = session.completed;
  
  const div = document.createElement('div');
  div.className = `list-item ${isCompleted ? 'completed' : ''}`;
  div.innerHTML = `
    <div class="item-left">
      <div class="checkbox ${isCompleted ? 'checked' : ''}" data-id="${id}" data-completed="${isCompleted}"></div>
      <div class="item-details">
        <h4>${session.subject}: ${session.topic}</h4>
        <p>${session.date} • ${session.duration} mins</p>
      </div>
    </div>
    <div class="item-right" style="display:flex; align-items:center; gap: 1rem;">
      <button class="btn-delete" data-id="${id}" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </div>
  `;

  studyListEl.appendChild(div);

  // Toggle Completion
  div.querySelector('.checkbox').addEventListener('click', async (e) => {
    const sessionId = e.target.getAttribute('data-id');
    const currentlyCompleted = e.target.getAttribute('data-completed') === 'true';
    await updateDoc(doc(db, "users", currentUser.uid, "studySessions", sessionId), {
      completed: !currentlyCompleted
    });
  });

  // Delete Session
  div.querySelector('.btn-delete').addEventListener('click', async (e) => {
    const sessionId = e.currentTarget.getAttribute('data-id');
    if (confirm("Are you sure you want to delete this session?")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "studySessions", sessionId));
    }
  });
}

// AI Topic Suggestion
const btnSuggest = document.getElementById('btn-suggest-topic');
const subjectInput = document.getElementById('session-subject');
const topicInput = document.getElementById('session-topic');

btnSuggest.addEventListener('click', async () => {
  const subject = subjectInput.value.trim();
  
  if (!subject) {
    alert("Please enter a Subject first so I know what to suggest!");
    subjectInput.focus();
    return;
  }
  
  try {
    btnSuggest.textContent = "✨ Thinking...";
    btnSuggest.disabled = true;
    
    const prompt = `You are an AI study assistant. The user wants to study "${subject}". Suggest a highly specific, actionable, and common topic for them to study. Return ONLY the topic name, nothing else. Do not use quotes or formatting. Example: If subject is "Class 10th Maths", return "Trigonometry Basics".`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': 'YOUR_GEMINI_API_KEY'
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0].content) {
      let suggestion = data.candidates[0].content.parts[0].text.trim();
      // Clean up quotes if AI accidentally adds them
      suggestion = suggestion.replace(/^["']|["']$/g, '');
      topicInput.value = suggestion;
    } else {
      alert("Oops, my AI brain couldn't think of a topic. Try again!");
    }
    
  } catch (err) {
    console.error("AI Suggestion error:", err);
    alert("Failed to get suggestion. Check connection.");
  } finally {
    btnSuggest.textContent = "✨ Auto-Suggest";
    btnSuggest.disabled = false;
  }
});

// Handle Form Submit
const sessionForm = document.getElementById('session-form');
sessionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const subject = document.getElementById('session-subject').value;
  const topic = document.getElementById('session-topic').value;
  const date = document.getElementById('session-date').value;
  const duration = parseInt(document.getElementById('session-duration').value);
  const btn = document.getElementById('btn-save-session');
  
  try {
    btn.textContent = 'Scheduling...';
    btn.disabled = true;
    
    const sessionId = generateId();
    await setDoc(doc(db, "users", currentUser.uid, "studySessions", sessionId), {
      subject,
      topic,
      date,
      duration,
      completed: false,
      createdAt: new Date().toISOString()
    });
    
    closeModal();
    sessionForm.reset();
    datePicker.setDate(new Date());
  } catch (err) {
    console.error("Error scheduling session: ", err);
    alert("Failed to schedule session.");
  } finally {
    btn.textContent = 'Schedule';
    btn.disabled = false;
  }
});

init();

