let quiz = [];
let current = 0;
let score = 0;
let answered = false;
let reviewLog = [];

const startScreen = document.getElementById('startScreen');
const quizScreen = document.getElementById('quizScreen');
const resultScreen = document.getElementById('resultScreen');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const qtext = document.getElementById('qtext');
const qimg = document.getElementById('qimg');
const optionsEl = document.getElementById('options');
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('scoreText');
const progressFill = document.getElementById('progressFill');

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuiz() {
  const picked = shuffle(ALL_QUESTIONS).slice(0, 20);
  quiz = picked.map(item => {
    const order = shuffle([0, 1, 2]);
    return {
      qnum: item.q,
      question: item.question,
      img: item.img,
      options: order.map(i => item.options[i]),
      correctIndex: order.indexOf(item.answer)
    };
  });
  current = 0;
  score = 0;
  reviewLog = [];
}

function startQuiz() {
  buildQuiz();
  startScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  renderQuestion();
}

function renderQuestion() {
  answered = false;
  nextBtn.disabled = true;
  nextBtn.textContent = current === quiz.length - 1 ? 'Finish' : 'Next';
  const q = quiz[current];
  progressText.textContent = `Question ${current + 1} of ${quiz.length}`;
  scoreText.textContent = `Score: ${score}`;
  progressFill.style.width = `${((current) / quiz.length) * 100 + 5}%`;
  qtext.textContent = q.question;
  if (q.img) {
    qimg.src = q.img;
    qimg.classList.remove('hidden');
  } else {
    qimg.classList.add('hidden');
  }
  optionsEl.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.textContent = opt;
    btn.addEventListener('click', () => selectOption(idx));
    optionsEl.appendChild(btn);
  });
}

function selectOption(idx) {
  if (answered) return;
  answered = true;
  const q = quiz[current];
  const opts = Array.from(optionsEl.children);
  const isCorrect = idx === q.correctIndex;
  if (isCorrect) {
    score++;
    opts[idx].classList.add('selected-correct');
  } else {
    opts[idx].classList.add('selected-wrong');
    opts[q.correctIndex].classList.add('reveal-correct');
  }
  opts.forEach(o => o.classList.add('locked'));
  scoreText.textContent = `Score: ${score}`;
  nextBtn.disabled = false;

  reviewLog.push({
    qnum: q.qnum,
    question: q.question,
    chosen: q.options[idx],
    correctAnswer: q.options[q.correctIndex],
    isCorrect
  });
}

function nextQuestion() {
  if (current < quiz.length - 1) {
    current++;
    renderQuestion();
  } else {
    showResults();
  }
}

function answerLine(label, text, cls) {
  const line = document.createElement('div');
  const tag = document.createElement('span');
  line.textContent = label;
  tag.className = cls;
  tag.textContent = text;
  line.appendChild(tag);
  return line;
}

function showResults() {
  quizScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');
  document.getElementById('finalScore').textContent = `${score} / ${quiz.length}`;
  const pct = Math.round((score / quiz.length) * 100);
  document.getElementById('finalPct').textContent = `${pct}% correct`;

  const reviewList = document.getElementById('reviewList');
  reviewList.innerHTML = '';
  reviewLog.forEach(r => {
    const div = document.createElement('div');
    div.className = `review-item ${r.isCorrect ? 'correct' : 'wrong'}`;
    const rq = document.createElement('div');
    rq.className = 'rq';
    rq.textContent = `Q${r.qnum}. ${r.question}`;
    div.appendChild(rq);
    div.appendChild(answerLine('Your answer: ', r.chosen, r.isCorrect ? 'tag-correct' : 'tag-wrong'));
    if (!r.isCorrect) div.appendChild(answerLine('Correct answer: ', r.correctAnswer, 'tag-correct'));
    reviewList.appendChild(div);
  });
}

startBtn.addEventListener('click', startQuiz);
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', startQuiz);
