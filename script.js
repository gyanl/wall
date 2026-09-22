import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getDatabase, ref, set, onValue }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
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

// WRITE: colour one square
function paint(i) {
  const colour = document.querySelector("#colour").value;
  wallEl.children[i].style.background = colour;
  set(ref(db, "wall/" + i), colour);
}

// Which square is under this point? (null if outside the wall)
function squareAt(x, y) {
  const box = wallEl.getBoundingClientRect();
  const col = Math.floor((x - box.left) / box.width * COLS);
  const row = Math.floor((y - box.top) / box.height * ROWS);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
  return { col, row };
}

// Press to paint, then drag to keep painting
let last = null;

wallEl.addEventListener("pointerdown", (event) => {
  last = squareAt(event.clientX, event.clientY);
  if (last) paint(last.row * COLS + last.col);
});

wallEl.addEventListener("pointermove", (event) => {
  if (!last) return;
  const here = squareAt(event.clientX, event.clientY);
  if (!here || (here.col === last.col && here.row === last.row)) return;
  // A fast drag can jump several squares, so fill in the ones in between
  const steps = Math.max(Math.abs(here.col - last.col), Math.abs(here.row - last.row));
  for (let s = 1; s <= steps; s++) {
    const col = Math.round(last.col + (here.col - last.col) * s / steps);
    const row = Math.round(last.row + (here.row - last.row) * s / steps);
    paint(row * COLS + col);
  }
  last = here;
});

window.addEventListener("pointerup", () => {
  last = null;
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
