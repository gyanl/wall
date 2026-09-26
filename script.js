import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getDatabase, ref, set, onValue }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const COLS = 20, ROWS = 24;
const wallEl = document.querySelector("#wall");
const statusEl = document.querySelector("#status");
const boardEl = document.querySelector("#leaderboard");
const joinEl = document.querySelector("#join");
const nameInput = document.querySelector("#name");
const colourInput = document.querySelector("#colour");
const meEl = document.querySelector("#me");

// WHO YOU ARE: kept in localStorage, so you only have to pick once
let player = null;
try {
  player = JSON.parse(localStorage.getItem("wall-player"));
} catch {}

function showPlayer() {
  document.querySelector("#me-name").textContent = player.name;
  document.querySelector("#me-swatch").style.background = player.colour;
  meEl.hidden = false;
}

function askForPlayer() {
  if (player) {
    nameInput.value = player.name;
    colourInput.value = player.colour;
  }
  joinEl.showModal();
}

document.querySelector("#join-form").addEventListener("submit", () => {
  player = { name: nameInput.value.trim() || "Anonymous", colour: colourInput.value };
  localStorage.setItem("wall-player", JSON.stringify(player));
  showPlayer();
});

// You can't close the dialog without picking, the first time
joinEl.addEventListener("cancel", (event) => {
  if (!player) event.preventDefault();
});

meEl.addEventListener("click", askForPlayer);

if (player) showPlayer();
else askForPlayer();

// Draw the empty grid once
for (let i = 0; i < COLS * ROWS; i++) {
  const cell = document.createElement("button");
  cell.dataset.index = i;
  cell.setAttribute("aria-label", "Square " + (i + 1));
  wallEl.append(cell);
}

// WRITE: colour one square, and say who coloured it
function paint(i) {
  if (!player) return;
  wallEl.children[i].style.background = player.colour;
  set(ref(db, "wall/" + i), { colour: player.colour, name: player.name });
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

// LEADERBOARD: count who owns the most squares right now
function showLeaderboard(squares) {
  const scores = {};
  for (const square of squares) {
    if (!scores[square.name]) scores[square.name] = { name: square.name, colour: square.colour, count: 0 };
    scores[square.name].count++;
  }
  const top = Object.values(scores).sort((a, b) => b.count - a.count).slice(0, 10);

  boardEl.replaceChildren(...top.map((entry) => {
    const li = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = entry.colour;
    const name = document.createElement("span");
    name.className = "board-name";
    name.textContent = entry.name;  // textContent, so nobody can inject HTML with their name
    const count = document.createElement("span");
    count.className = "board-count";
    count.textContent = entry.count;
    li.append(swatch, name, count);
    if (player && entry.name === player.name) li.classList.add("is-me");
    return li;
  }));
}

// READ: runs now, and again on every change anyone makes
onValue(ref(db, "wall"), (snapshot) => {
  const pixels = snapshot.val() || {};
  const squares = [];
  for (const cell of wallEl.children) {
    let square = pixels[cell.dataset.index];
    // Squares painted before names existed are just a colour
    if (typeof square === "string") square = { colour: square, name: "Anonymous" };
    cell.style.background = square ? square.colour : "";
    cell.title = square ? square.name : "";
    if (square) squares.push(square);
  }
  showLeaderboard(squares);
  statusEl.textContent = squares.length + " of " + COLS * ROWS + " squares coloured";
}, (error) => {
  statusEl.textContent = "Couldn't read the wall: " + error.message;
});
