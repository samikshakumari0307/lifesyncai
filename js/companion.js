// js/companion.js
import { db } from './firebase.js';
import { requireAuth } from './utils.js';
import { 
  collection, query, orderBy, onSnapshot, addDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const apiKey = "YOUR_GEMINI_API_KEY";

class CompanionCat {
  constructor() {
    this.container = null;
    this.bubble = null;
    this.modal = null;
    this.chatMessages = null;
    this.chatInput = null;
    this.sendBtn = null;
    this.currentUser = null;
    
    this.quotes = [
      "Meow! Ready to crush some goals?",
      "Need help planning your day?",
      "You've got this! 🐾",
      "Tap me for some study tips!",
      "Purr-fect day for deep work."
    ];
    
    this.repositionInterval = null;
    
    this.init();
  }

  async init() {
    try {
      this.currentUser = await requireAuth();
    } catch (e) {
      console.error("Auth error", e);
    }
    this.createDOM();
    this.setupListeners();
    this.startRoutine();
    
    if (this.currentUser) {
      this.loadChats();
    }
  }

  loadChats() {
    const q = query(
      collection(db, "users", this.currentUser.uid, "coachChats"), 
      orderBy("createdAt", "asc")
    );

    this.chatMessages.innerHTML = ''; // Clear once on load

    onSnapshot(q, (snapshot) => {
      if (snapshot.empty && this.chatMessages.children.length === 0) {
        this.appendMessage('bot', "Meow! I'm your personal productivity cat. How can I help you today?");
        return;
      }

      let hasNewMessages = false;
      const isNearBottom = this.chatMessages.scrollHeight - this.chatMessages.scrollTop - this.chatMessages.clientHeight < 50;

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const chat = change.doc.data();
          this.appendMessage(chat.sender, chat.text, false);
          hasNewMessages = true;
        }
      });
      
      if (hasNewMessages && isNearBottom) {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      }
    });
  }

  createDOM() {
    // 1. Create Cat Container
    this.container = document.createElement('div');
    this.container.id = 'ai-companion';
    
    // Load saved position from localStorage if it exists
    const savedPos = JSON.parse(localStorage.getItem('companionPosition') || 'null');
    if (savedPos) {
      this.container.style.left = savedPos.left;
      this.container.style.top = savedPos.top;
      this.container.style.bottom = savedPos.bottom;
      this.container.style.right = savedPos.right;
    } else {
      this.container.style.bottom = '20px';
      this.container.style.right = '40px';
    }
    
    this.bubble = document.createElement('div');
    this.bubble.className = 'companion-bubble';
    this.bubble.innerText = "Meow!";
    
    const avatar = document.createElement('div');
    avatar.className = 'companion-avatar';
    
    // Custom Cute Animated SVG Cat
    avatar.innerHTML = `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="cute-cat-svg" width="100" height="100">
        <defs>
          <radialGradient id="eyeGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#fff" />
            <stop offset="15%" stop-color="#3d2110" />
            <stop offset="100%" stop-color="#1c0f07" />
          </radialGradient>
        </defs>
        
        <!-- Tail (Animates) -->
        <g class="cat-tail-group" transform-origin="150 160">
          <path d="M 140 160 Q 180 180 170 120 Q 165 90 150 100 Q 140 110 150 140" fill="#db9b67" stroke="#3d2110" stroke-width="3" stroke-linecap="round" />
          <path d="M 155 110 Q 165 95 160 125" stroke="#7a4627" stroke-width="4" fill="none" stroke-linecap="round"/>
        </g>
        
        <!-- Body -->
        <path d="M 50 180 C 40 120 70 90 100 90 C 130 90 160 120 150 180 Z" fill="#f8e5d1" stroke="#3d2110" stroke-width="3" />
        
        <!-- Body Stripes -->
        <path d="M 50 140 Q 70 145 75 130" stroke="#db9b67" stroke-width="5" fill="none" stroke-linecap="round" />
        <path d="M 150 140 Q 130 145 125 130" stroke="#db9b67" stroke-width="5" fill="none" stroke-linecap="round" />
        <path d="M 47 160 Q 65 165 70 150" stroke="#db9b67" stroke-width="5" fill="none" stroke-linecap="round" />
        <path d="M 153 160 Q 135 165 130 150" stroke="#db9b67" stroke-width="5" fill="none" stroke-linecap="round" />

        <!-- Head Group (Animates tilt) -->
        <g class="cat-head-group" transform-origin="100 120">
          <!-- Ears -->
          <path d="M 60 70 L 40 20 L 90 40 Z" fill="#db9b67" stroke="#3d2110" stroke-width="3" stroke-linejoin="round" />
          <path d="M 140 70 L 160 20 L 110 40 Z" fill="#db9b67" stroke="#3d2110" stroke-width="3" stroke-linejoin="round" />
          <path d="M 50 35 L 55 60 L 75 45 Z" fill="#f4a5af" />
          <path d="M 150 35 L 145 60 L 125 45 Z" fill="#f4a5af" />
          
          <!-- Head Base -->
          <ellipse cx="100" cy="80" rx="60" ry="50" fill="#f8e5d1" stroke="#3d2110" stroke-width="3" />
          
          <!-- Orange Patches on Head -->
          <path d="M 40 80 C 40 40 70 30 100 30 C 105 30 110 32 115 35 C 90 50 80 80 80 100 C 60 100 40 95 40 80 Z" fill="#db9b67" />
          <path d="M 160 80 C 160 40 130 30 100 30 C 95 30 90 32 85 35 C 110 50 120 80 120 100 C 140 100 160 95 160 80 Z" fill="#db9b67" />
          
          <!-- Head Stripes -->
          <path d="M 100 30 L 100 50" stroke="#7a4627" stroke-width="4" stroke-linecap="round" />
          <path d="M 85 35 L 90 55" stroke="#7a4627" stroke-width="4" stroke-linecap="round" />
          <path d="M 115 35 L 110 55" stroke="#7a4627" stroke-width="4" stroke-linecap="round" />

          <!-- Big Cute Eyes (Animates Blink) -->
          <g class="cat-eyes-group">
            <ellipse cx="70" cy="85" rx="14" ry="18" fill="url(#eyeGradient)" />
            <circle cx="65" cy="78" r="4" fill="#fff" />
            <circle cx="73" cy="88" r="2" fill="#fff" />
            
            <ellipse cx="130" cy="85" rx="14" ry="18" fill="url(#eyeGradient)" />
            <circle cx="125" cy="78" r="4" fill="#fff" />
            <circle cx="133" cy="88" r="2" fill="#fff" />
          </g>
          
          <!-- Nose and Mouth -->
          <path d="M 97 100 Q 100 105 103 100 Z" fill="#f4a5af" stroke="#f4a5af" stroke-width="2" stroke-linejoin="round" />
          <path d="M 100 103 C 100 115 85 110 85 105" stroke="#3d2110" stroke-width="2" fill="none" stroke-linecap="round" />
          <path d="M 100 103 C 100 115 115 110 115 105" stroke="#3d2110" stroke-width="2" fill="none" stroke-linecap="round" />
          
          <!-- Whiskers -->
          <path d="M 50 95 L 20 90" stroke="#3d2110" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
          <path d="M 50 105 L 25 110" stroke="#3d2110" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
          <path d="M 150 95 L 180 90" stroke="#3d2110" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
          <path d="M 150 105 L 175 110" stroke="#3d2110" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        </g>
        
        <!-- Paws -->
        <path d="M 70 180 Q 75 190 85 180 Z" fill="#fff" stroke="#3d2110" stroke-width="3" stroke-linejoin="round" />
        <path d="M 115 180 Q 125 190 130 180 Z" fill="#fff" stroke="#3d2110" stroke-width="3" stroke-linejoin="round" />
      </svg>
    `;
    
    this.container.appendChild(this.bubble);
    this.container.appendChild(avatar);
    document.body.appendChild(this.container);

    // 2. Create Chat Modal
    this.modal = document.createElement('div');
    this.modal.id = 'companion-chat-modal';
    this.modal.innerHTML = `
      <div class="chat-header">
        <h3>🐈‍⬛ AI Coach</h3>
        <button class="chat-close" id="comp-close">&times;</button>
      </div>
      <div class="chat-messages" id="comp-msgs">
        <!-- Messages loaded from Firestore -->
      </div>
      <div class="chat-input-area">
        <input type="text" id="comp-input" placeholder="Ask me anything..." autocomplete="off">
        <button id="comp-send"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg></button>
      </div>
    `;
    document.body.appendChild(this.modal);

    // Elements
    this.chatMessages = document.getElementById('comp-msgs');
    this.chatInput = document.getElementById('comp-input');
    this.sendBtn = document.getElementById('comp-send');
    this.closeBtn = document.getElementById('comp-close');
  }

  setupListeners() {
    // Dragging Logic
    let isDragging = false;
    let dragMoved = false;
    let offsetX, offsetY;

    this.container.addEventListener('mousedown', (e) => {
      // Don't drag if clicking the bubble
      if (e.target.closest('.companion-bubble')) return;
      
      isDragging = true;
      dragMoved = false;
      offsetX = e.clientX - this.container.getBoundingClientRect().left;
      offsetY = e.clientY - this.container.getBoundingClientRect().top;
      this.container.style.transition = 'none'; // Disable transition for smooth dragging
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      dragMoved = true;
      
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      
      this.container.style.left = `${newX}px`;
      this.container.style.top = `${newY}px`;
      this.container.style.bottom = 'auto';
      this.container.style.right = 'auto';
      
      // Stop automatic repositioning once user takes control
      if (this.repositionInterval) clearInterval(this.repositionInterval);
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      this.container.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      
      // Save custom position to localStorage
      localStorage.setItem('companionPosition', JSON.stringify({
        left: this.container.style.left,
        top: this.container.style.top,
        bottom: 'auto',
        right: 'auto',
        isCustomDragged: true
      }));
      
      // Update modal position dynamically based on cat's new manually dragged position
      const rect = this.container.getBoundingClientRect();
      const centerX = window.innerWidth / 2;
      
      // Modal should appear on the side with more space
      if (rect.left < centerX) {
        this.modal.style.left = `${rect.left + 120}px`;
        this.modal.style.right = 'auto';
        this.modal.style.transformOrigin = 'bottom left';
      } else {
        this.modal.style.right = `${window.innerWidth - rect.right + 120}px`;
        this.modal.style.left = 'auto';
        this.modal.style.transformOrigin = 'bottom right';
      }
      
      // Adjust vertical position of modal
      if (rect.top > 500) {
        this.modal.style.bottom = `${window.innerHeight - rect.bottom}px`;
        this.modal.style.top = 'auto';
      } else {
        this.modal.style.top = `${rect.top}px`;
        this.modal.style.bottom = 'auto';
      }
    });

    // Open/Close Modal by clicking the cat
    this.container.addEventListener('click', (e) => {
      if (dragMoved) return; // Prevent clicking if they just dragged it
      if (this.modal.classList.contains('open')) {
        this.closeModal();
      } else {
        this.openModal();
      }
    });

    // Close Modal by clicking the X button
    this.closeBtn.addEventListener('click', () => {
      this.closeModal();
    });

    // Send Message
    this.sendBtn.addEventListener('click', () => this.handleSend());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSend();
    });
  }

  openModal() {
    this.modal.classList.add('open');
    this.bubble.classList.remove('show');
    document.body.style.overflow = 'hidden'; // Lock background scrolling
  }

  closeModal() {
    this.modal.classList.remove('open');
    document.body.style.overflow = ''; // Restore background scrolling
  }

  startRoutine() {
    // Check if user manually placed the cat before
    const savedPos = JSON.parse(localStorage.getItem('companionPosition') || 'null');
    
    // Show a random speech bubble every 15 seconds
    setInterval(() => {
      if (!this.modal.classList.contains('open')) {
        this.sayRandom();
      }
    }, 15000);

    // Only start auto-reposition if the user hasn't dragged it manually
    if (!savedPos || !savedPos.isCustomDragged) {
      this.repositionInterval = setInterval(() => {
        if (!this.modal.classList.contains('open')) {
          this.reposition();
        }
      }, 25000);
    }
    
    setTimeout(() => this.sayRandom(), 3000);
  }

  sayRandom() {
    const text = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    this.bubble.innerText = text;
    this.bubble.classList.add('show');
    setTimeout(() => {
      this.bubble.classList.remove('show');
    }, 5000);
  }

  reposition() {
    // Fade out
    this.container.style.opacity = '0';
    this.container.style.transition = 'opacity 0.5s ease, transform 0.3s ease';
    
    setTimeout(() => {
      // Move cat around adaptively on the edges
      const positions = [
        { bottom: '20px', right: '40px', left: 'auto', top: 'auto', transform: 'scaleX(1)' }, // Default bottom right
        { bottom: '20px', left: '40px', right: 'auto', top: 'auto', transform: 'scaleX(-1)' },  // Bottom left (flipped)
        { bottom: '50%', right: '20px', left: 'auto', top: 'auto', transform: 'scaleX(1)' },    // Middle right
        { top: '80px', right: '40px', left: 'auto', bottom: 'auto', transform: 'scaleX(1)' },   // Top right
        { bottom: '20px', right: '40%', left: 'auto', top: 'auto', transform: 'scaleX(1)' }     // Bottom center-ish
      ];
      
      const pos = positions[Math.floor(Math.random() * positions.length)];
      
      this.container.style.bottom = pos.bottom;
      this.container.style.right = pos.right;
      this.container.style.left = pos.left;
      this.container.style.top = pos.top;
      
      // Save auto position to localStorage
      localStorage.setItem('companionPosition', JSON.stringify({
        left: pos.left,
        top: pos.top,
        bottom: pos.bottom,
        right: pos.right,
        isCustomDragged: false
      }));
      
      // Flip the cat based on position so it looks inwards
      const avatar = this.container.querySelector('.companion-avatar');
      if (avatar) avatar.style.transform = pos.transform;
      
      // Modal should always pop up towards the center based on cat's position
      if (pos.left !== 'auto') {
        this.modal.style.right = 'auto';
        this.modal.style.left = '40px';
        this.modal.style.transformOrigin = 'bottom left';
      } else {
        this.modal.style.left = 'auto';
        this.modal.style.right = '40px';
        this.modal.style.transformOrigin = 'bottom right';
      }
      
      if (pos.top !== 'auto') {
        this.modal.style.bottom = 'auto';
        this.modal.style.top = '140px';
        this.modal.style.transformOrigin = 'top right';
      } else {
        this.modal.style.top = 'auto';
        this.modal.style.bottom = '100px';
      }

      // Fade back in
      this.container.style.opacity = '1';
    }, 500);
  }

  appendMessage(role, text, autoScroll = true) {
    const isNearBottom = this.chatMessages.scrollHeight - this.chatMessages.scrollTop - this.chatMessages.clientHeight < 50;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${role}`;
    
    // Simple markdown to HTML formatting
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    msgDiv.innerHTML = formattedText;
    
    // Insert before typing indicator if it exists
    const typingIndicator = this.chatMessages.querySelector('.typing-indicator');
    if (typingIndicator) {
      this.chatMessages.insertBefore(msgDiv, typingIndicator);
    } else {
      this.chatMessages.appendChild(msgDiv);
    }
    
    if (autoScroll && (isNearBottom || role === 'user')) {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
  }

  async handleSend() {
    const text = this.chatInput.value.trim();
    if (!text) return;

    this.chatInput.value = '';
    
    if (this.currentUser) {
      // onSnapshot will instantly update the UI with this message
      await addDoc(collection(db, "users", this.currentUser.uid, "coachChats"), {
        text: text,
        sender: 'user',
        createdAt: new Date().toISOString()
      });
    } else {
      this.appendMessage('user', text);
    }
    
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-msg bot typing-indicator';
    loadingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    this.chatMessages.appendChild(loadingDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    
    try {
      // Build Conversation History for Gemini (last 6 messages)
      let history = "";
      const messages = Array.from(this.chatMessages.querySelectorAll('.chat-msg')).slice(-6);
      messages.forEach(msg => {
        // Skip the loading indicator
        if (msg === loadingDiv) return;
        const role = msg.classList.contains('user') ? "User" : "Cat";
        history += `${role}: ${msg.textContent}\n\n`;
      });
      
      const systemInstruction = "You are a cute, helpful AI companion cat for a student productivity app called LifeSync AI. Keep your answers brief, encouraging, and occasionally use cat puns (meow, purr, paws).";
      const fullPrompt = systemInstruction + "\n\nRecent Conversation:\n" + history + "Cat:";
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': 'YOUR_GEMINI_API_KEY'
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: fullPrompt }]
          }]
        })
      });

      const data = await response.json();
      
      if (this.chatMessages.contains(loadingDiv)) {
        this.chatMessages.removeChild(loadingDiv);
      }
      
      let botResponseText = "";
      if (data.candidates && data.candidates[0].content) {
        botResponseText = data.candidates[0].content.parts[0].text;
      } else {
        botResponseText = "Meow? I'm having trouble connecting to my brain right now.";
      }
      
      if (this.currentUser) {
        await addDoc(collection(db, "users", this.currentUser.uid, "coachChats"), {
          text: botResponseText,
          sender: 'bot',
          createdAt: new Date().toISOString()
        });
      } else {
        this.appendMessage('bot', botResponseText);
      }
      
    } catch (error) {
      console.error(error);
      if (this.chatMessages.contains(loadingDiv)) {
        this.chatMessages.removeChild(loadingDiv);
      }
      this.appendMessage('bot', "Hiss! Something went wrong.");
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.aiCompanion = new CompanionCat();
});

