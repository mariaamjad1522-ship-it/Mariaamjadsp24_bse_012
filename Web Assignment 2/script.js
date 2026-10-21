// ---------- Question bank (10 questions, 5 are picked randomly each time) ----------
const BANK = [
  { q: "Which HTML tag is used for the largest heading?", o: ["<h6>", "<h1>", "<head>", "<heading>"], a: 1 },
  { q: "Which CSS property changes the text colour?", o: ["font-color", "text-style", "color", "background"], a: 2 },
  { q: "Which keyword declares a block-scoped variable in JavaScript?", o: ["var", "let", "int", "dim"], a: 1 },
  { q: "Which Bootstrap class makes a responsive container?", o: [".container", ".box", ".wrapper", ".layout"], a: 0 },
  { q: "Which tag is used to link an external CSS file?", o: ["<style>", "<script>", "<link>", "<css>"], a: 2 },
  { q: "What does DOM stand for?", o: ["Data Object Model", "Document Object Model", "Display Object Mode", "Document Order Map"], a: 1 },
  { q: "Which method selects an element by its id?", o: ["getElementById()", "querySelectorAll()", "getElementsByTag()", "selectId()"], a: 0 },
  { q: "Which CSS layout system uses rows and columns together?", o: ["float", "inline", "grid", "table-cell"], a: 2 },
  { q: "Which symbol is used for an id selector in CSS?", o: [".", "#", "*", "&"], a: 1 },
  { q: "Which event fires when a button is clicked?", o: ["onhover", "onload", "onclick", "onchange"], a: 2 }
];

const TOTAL = 5;
const TIME_PER_Q = 15;
const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6"];

// ---------- Helpers ----------
const $ = id => document.getElementById(id);
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

let questions = [], index = 0, score = 0, timeLeft = TIME_PER_Q, timerId = null, locked = false;
let results = [];
let playerName = "";

// ---------- Theme ----------
function applyTheme(t) {
  document.documentElement.setAttribute("data-bs-theme", t);
  $("themeBtn").textContent = t === "dark" ? "Light mode" : "Dark mode";
  try { localStorage.setItem("quiz-theme", t); } catch (e) {}
}
$("themeBtn").onclick = () =>
  applyTheme(document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark");
try { applyTheme(localStorage.getItem("quiz-theme") || "light"); } catch (e) {}

// ---------- Start ----------
$("startBtn").onclick = startQuiz;
$("restartBtn").onclick = () => {
  $("resultScreen").classList.add("d-none");
  $("startScreen").classList.remove("d-none");
};

function startQuiz() {
  playerName = $("nameInput").value.trim() || "Student";
  // random questions, and random option order inside each question
  questions = shuffle(BANK).slice(0, TOTAL).map(item => {
    const correctText = item.o[item.a];
    const opts = shuffle(item.o);
    return { q: item.q, options: opts, answer: opts.indexOf(correctText) };
  });
  index = 0; score = 0; results = [];
  buildSegments();
  $("startScreen").classList.add("d-none");
  $("resultScreen").classList.add("d-none");
  $("quizScreen").classList.remove("d-none");
  showQuestion();
}

// ---------- Segmented progress bar ----------
function buildSegments() {
  const box = $("segments");
  box.innerHTML = "";
  for (let i = 0; i < TOTAL; i++) {
    const s = document.createElement("div");
    s.className = "segment";
    s.style.setProperty("--c", COLORS[i % COLORS.length]);
    box.appendChild(s);
  }
}
function updateSegments() {
  [...$("segments").children].forEach((s, i) => {
    s.classList.toggle("done", i < index);
    s.classList.toggle("current", i === index);
  });
}

// ---------- Question ----------
function showQuestion() {
  locked = false;
  const item = questions[index];
  updateSegments();
  $("counter").textContent = `Question ${index + 1} of ${TOTAL}`;
  $("question").textContent = item.q;
  $("feedback").textContent = "";
  const box = $("options");
  box.innerHTML = "";
  item.options.forEach((text, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "option-btn";
    b.textContent = text;
    b.onclick = () => choose(i);
    box.appendChild(b);
  });
  startTimer();
}

function startTimer() {
  clearInterval(timerId);
  timeLeft = TIME_PER_Q;
  renderTimer();
  timerId = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) { clearInterval(timerId); choose(-1); } // time is up
  }, 1000);
}
function renderTimer() {
  const t = $("timer");
  t.textContent = timeLeft + "s";
  t.classList.toggle("low", timeLeft <= 5);
}

function choose(picked) {
  if (locked) return;
  locked = true;
  clearInterval(timerId);
  const item = questions[index];
  const btns = [...$("options").children];
  btns.forEach(b => (b.disabled = true));
  btns[item.answer].classList.add("correct");

  const correct = picked === item.answer;
  if (correct) {
    score++;
    $("feedback").textContent = "Correct!";
  } else if (picked === -1) {
    $("feedback").textContent = "Time is up. The correct answer is highlighted.";
  } else {
    btns[picked].classList.add("wrong");
    $("feedback").textContent = "Wrong answer.";
  }
  results.push({
    q: item.q,
    yours: picked === -1 ? "No answer (time up)" : item.options[picked],
    right: item.options[item.answer],
    correct
  });

  setTimeout(() => {
    index++;
    index < TOTAL ? showQuestion() : finish();
  }, 1500);
}

// ---------- Result ----------
function finish() {
  updateSegments();
  $("quizScreen").classList.add("d-none");
  $("resultScreen").classList.remove("d-none");
  $("scoreText").textContent = `${score} / ${TOTAL}`;
  $("scoreMsg").textContent =
    score === TOTAL ? "Perfect score!" : score >= 3 ? "Good job, keep going." : "Keep practising and try again.";
}

// ---------- PDF download ----------
$("pdfBtn").onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(18);
  doc.text("Web Quiz Result", 14, y); y += 10;
  doc.setFontSize(12);
  doc.text(`Name: ${playerName}`, 14, y); y += 7;
  doc.text(`Date: ${new Date().toLocaleString()}`, 14, y); y += 7;
  doc.text(`Score: ${score} / ${TOTAL}`, 14, y); y += 12;

  results.forEach((r, i) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont(undefined, "bold");
    const qLines = doc.splitTextToSize(`${i + 1}. ${r.q}`, 180);
    doc.text(qLines, 14, y); y += qLines.length * 6;
    doc.setFont(undefined, "normal");
    doc.text(`Your answer: ${r.yours}  (${r.correct ? "Correct" : "Wrong"})`, 18, y); y += 6;
    if (!r.correct) { doc.text(`Correct answer: ${r.right}`, 18, y); y += 6; }
    y += 4;
  });
  doc.save("quiz-result.pdf");
};