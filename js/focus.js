// js/focus.js
import { db } from './firebase.js';
import { requireAuth, generateId, setupModal } from './utils.js';
import { 
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

const MODES = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
  custom: 25 * 60
};

let currentMode = 'focus';
let timeRemaining = MODES[currentMode];
let timerInterval = null;
let isRunning = false;

const displayEl = document.getElementById('timer-display');
const toggleBtn = document.getElementById('btn-toggle-timer');
const resetBtn = document.getElementById('btn-reset-timer');
const modeButtons = document.querySelectorAll('.timer-mode');

async function init() {
  try {
    currentUser = await requireAuth();
    updateDisplay();
  } catch (err) {
    console.error("Auth error", err);
  }
}

function updateDisplay() {
  const m = Math.floor(timeRemaining / 60);
  const s = timeRemaining % 60;
  displayEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  document.title = `${displayEl.textContent} | Focus | LifeSync AI`;
}

function switchMode(mode) {
  if (isRunning) pauseTimer();
  currentMode = mode;
  
  const customPicker = document.getElementById('custom-picker');
  
  if (mode === 'custom') {
    displayEl.style.display = 'none';
    customPicker.style.display = 'flex';
    updateCustomTime();
  } else {
    displayEl.style.display = 'block';
    customPicker.style.display = 'none';
    timeRemaining = MODES[mode];
    updateDisplay();
  }
  
  modeButtons.forEach(btn => {
    if (btn.getAttribute('data-mode') === mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

modeButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    switchMode(e.target.getAttribute('data-mode'));
  });
});

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  toggleBtn.textContent = 'Pause';
  toggleBtn.classList.remove('btn-primary');
  toggleBtn.classList.add('btn-secondary');

  if (currentMode === 'custom') {
    document.getElementById('custom-picker').style.display = 'none';
    displayEl.style.display = 'block';
  }
  
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateDisplay();
    
    if (timeRemaining <= 0) {
      completeSession();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  toggleBtn.textContent = 'Resume';
  toggleBtn.classList.add('btn-primary');
  toggleBtn.classList.remove('btn-secondary');
}

toggleBtn.addEventListener('click', () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

// Fullscreen Logic
const btnFullscreen = document.getElementById('btn-fullscreen');
const timerContainer = document.getElementById('timer-container');

if (btnFullscreen && timerContainer) {
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      timerContainer.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      btnFullscreen.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`;
      btnFullscreen.title = "Exit Full Screen";
      
      // Restore dark mode preference if saved
      if (localStorage.getItem('focusTheme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (btnDarkMode) {
          btnDarkMode.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        }
      }
    } else {
      btnFullscreen.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
      btnFullscreen.title = "Full Screen";
      
      // Force light mode when exiting fullscreen
      document.documentElement.setAttribute('data-theme', 'light');
    }
  });
}

// Dark Mode Toggle Logic
const btnDarkMode = document.getElementById('btn-darkmode');

if (btnDarkMode) {
  btnDarkMode.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('focusTheme', 'light');
      btnDarkMode.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('focusTheme', 'dark');
      btnDarkMode.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }
  });
}

resetBtn.addEventListener('click', () => {
  if (currentMode === 'custom') {
    if (isRunning) pauseTimer();
    document.getElementById('custom-picker').style.display = 'flex';
    displayEl.style.display = 'none';
    updateCustomTime();
  } else {
    switchMode(currentMode);
  }
});

// Custom Input Logic
const inputMin = document.getElementById('input-min');
const inputSec = document.getElementById('input-sec');

function updateCustomTime() {
  if (!inputMin || !inputSec) return;
  const min = parseInt(inputMin.value) || 0;
  const sec = parseInt(inputSec.value) || 0;
  timeRemaining = (min * 60) + sec;
  updateDisplay();
}

if (inputMin && inputSec) {
  inputMin.addEventListener('input', updateCustomTime);
  inputSec.addEventListener('input', updateCustomTime);
  
  // Auto pad on blur for aesthetics
  inputMin.addEventListener('blur', () => {
    inputMin.value = String(parseInt(inputMin.value) || 0).padStart(2, '0');
  });
  inputSec.addEventListener('blur', () => {
    inputSec.value = String(parseInt(inputSec.value) || 0).padStart(2, '0');
  });
}

const { openModal: openCompletionModal } = setupModal('completion-modal', null, 'btn-close-modal');

async function completeSession() {
  pauseTimer();
  
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => console.log(err));
  }

  const completionTitle = document.getElementById('completion-title');
  if (completionTitle) {
    completionTitle.textContent = `${currentMode === 'focus' ? 'Focus' : 'Break'} Session Complete!`;
  }
  
  openCompletionModal();
  
  // Play sound if possible
  try {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
    audio.play().catch(e => console.log("Audio play prevented by browser"));
  } catch (e) { }

  if (!currentUser) return;
  
  if (currentMode === 'focus') {
    try {
      const sessionId = generateId();
      await setDoc(doc(db, "users", currentUser.uid, "focusSessions", sessionId), {
        duration: 25,
        mode: currentMode,
        completedAt: new Date().toISOString()
      });
      // Auto-switch to short break
      switchMode('short');
    } catch(err) {
      console.error("Failed to save session", err);
    }
  } else {
    // Auto-switch back to focus
    switchMode('focus');
  }
}

init();

