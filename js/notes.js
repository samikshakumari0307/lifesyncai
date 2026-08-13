// js/notes.js
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
let currentEditingNoteId = null;
const notesListEl = document.getElementById('notes-list');

// Setup Modal
const { openModal, closeModal } = setupModal('note-modal', 'btn-add-note', 'btn-close-modal');

document.getElementById('btn-add-note').addEventListener('click', () => {
  currentEditingNoteId = null;
  noteForm.reset();
  document.querySelector('#note-modal .modal-title').textContent = 'Create a Note';
});

async function init() {
  try {
    currentUser = await requireAuth();
    loadNotes();
  } catch (err) {
    console.error("Auth error", err);
  }
}

function loadNotes() {
  const q = query(
    collection(db, "users", currentUser.uid, "notes"), 
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {
    notesListEl.innerHTML = ''; 
    
    if (snapshot.empty) {
      notesListEl.innerHTML = `
        <div class="col-span-12 empty-state">
          <p>No notes written yet. Jot down some thoughts!</p>
        </div>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const note = docSnap.data();
      renderNote(note, docSnap.id);
    });
  });
}

function renderNote(note, id) {
  const div = document.createElement('div');
  const styles = ['paper-style-yellow', 'paper-style-blue', 'paper-style-white', 'paper-style-grid'];
  
  let selectedStyle = '';
  if (note.paperStyle && styles.includes(note.paperStyle)) {
    selectedStyle = note.paperStyle;
  } else {
    // Fallback to random assignment
    const styleIndex = id.charCodeAt(id.length - 1) % styles.length;
    selectedStyle = styles[styleIndex];
  }
  
  div.className = `note-card ${selectedStyle}`;
  
  const displayTitle = note.title ? `<h3 style="font-size: 1.1rem;">${note.title}</h3>` : '';
  
  div.innerHTML = `
    <div class="note-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
      <div style="flex-grow: 1;">${displayTitle}</div>
      <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
        <button class="btn-edit-note" data-id="${id}" title="Edit" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer; padding:0.25rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-delete-note" data-id="${id}" title="Delete" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer; padding:0.25rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
    <div class="note-content">${note.content}</div>
    <div class="note-date">${new Date(note.createdAt).toLocaleDateString()}</div>
  `;

  notesListEl.appendChild(div);

  // Handle Delete
  div.querySelector('.btn-delete-note').addEventListener('click', async (e) => {
    const noteId = e.currentTarget.getAttribute('data-id');
    if (confirm("Delete this note?")) {
      await deleteDoc(doc(db, "users", currentUser.uid, "notes", noteId));
    }
  });

  // Handle Edit
  div.querySelector('.btn-edit-note').addEventListener('click', (e) => {
    const noteId = e.currentTarget.getAttribute('data-id');
    currentEditingNoteId = noteId;
    
    document.querySelector('#note-modal .modal-title').textContent = 'Edit Note';
    document.getElementById('note-title').value = note.title || '';
    document.getElementById('note-content').value = note.content || '';
    if (document.getElementById('note-style') && note.paperStyle) {
      document.getElementById('note-style').value = note.paperStyle;
    }
    
    openModal();
  });
}

// Handle Form Submit
const noteForm = document.getElementById('note-form');
noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('note-title').value;
  const content = document.getElementById('note-content').value;
  let paperStyle = document.getElementById('note-style') ? document.getElementById('note-style').value : 'random';
  const btn = document.getElementById('btn-save-note');
  
  try {
    btn.textContent = 'Saving...';
    btn.disabled = true;
    
    const noteData = {
      title: title || '',
      content
    };
    
    if (paperStyle !== 'random') {
      noteData.paperStyle = paperStyle;
    }
    
    if (currentEditingNoteId) {
      noteData.updatedAt = new Date().toISOString();
      await updateDoc(doc(db, "users", currentUser.uid, "notes", currentEditingNoteId), noteData);
    } else {
      noteData.createdAt = new Date().toISOString();
      const noteId = generateId();
      await setDoc(doc(db, "users", currentUser.uid, "notes", noteId), noteData);
    }
    
    closeModal();
    noteForm.reset();
  } catch (err) {
    console.error("Error saving note: ", err);
    alert("Failed to save note.");
  } finally {
    btn.textContent = 'Save Note';
    btn.disabled = false;
  }
});

init();

