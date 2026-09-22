import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const COLS = 32, ROWS = 18;
const wallEl = document.querySelector("#wall");
const statusEl = document.querySelector("#status");

// Draw the empty grid once
for (let i = 0; i < COLS * ROWS; i++) {
  const cell = document.createElement("button");
  cell.dataset.index = i;
  cell.setAttribute("aria-label", "Square " + (i + 1));
  wallEl.append(cell);
}

// WRITE: one click, one square
wallEl.addEventListener("click", (event) => {
  const i = event.target.dataset.index;
  if (i === undefined) return;
  set(ref(db, "wall/" + i), document.querySelector("#colour").value);
});

// READ: runs now, and again on every change anyone makes
onValue(ref(db, "wall"), (snapshot) => {
  const pixels = snapshot.val() || {};
  for (const cell of wallEl.children) {
    cell.style.background = pixels[cell.dataset.index] || "";
  }
  statusEl.textContent = Object.keys(pixels).length + " squares coloured";
}, (error) => {
  statusEl.textContent = "Couldn't read the wall: " + error.message;
});
