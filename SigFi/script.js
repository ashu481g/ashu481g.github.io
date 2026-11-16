// Lectures in weekday order: Monday first. To add or swap a video, edit this list.
// "id" is the Google Drive file ID (the part between /d/ and /view in a file's share link).
const LECTURES = [
  { day: "Mon", title: "Financial Reporting & Analysis", id: "1m8oEAbTxixkx7rYgGIOW9ELsR-rp31nM", size: "175 MB" },
  { day: "Tue", title: "Corporate Finance", id: "1XGGO14vbe_CnEo3lVGo7fnYVP6WxQo7O", size: "202 MB" },
  { day: "Wed", title: "Portfolio Management", id: "1b0naiocA2pkBT_MEItxHwacV5ObDmT9j", size: "160 MB" },
  { day: "Thu", title: "Derivatives", id: "1nCcfCBnCeor313swJ7EE7lmavSaHitzp", size: "127 MB" },
  { day: "Fri", title: "Valuations", id: "18rHHSnT3pYdjwBu0V3lVZPXnvsEjMt_M", size: "227 MB" },
  { day: "Sat", title: "Fixed Income", id: "1oxPRSCp52S9CqqP2UpPjgSz6MeLWmcRg", size: "212 MB" },
  { day: "Sun", title: "Markets", id: "1ceW8f3beaI9KY0CpgyGLvhFbWfao7c1k", size: "117 MB" }
];

const STORAGE_KEY = "sigfi-primers-watched";

// JavaScript counts Sunday as 0; shift so Monday is 0.
const todayIndex = (new Date().getDay() + 6) % 7;
let current = todayIndex;
let watched = loadWatched();

const el = {
  player: document.getElementById("player"),
  meta: document.getElementById("now-meta"),
  title: document.getElementById("now-title"),
  topics: document.getElementById("now-topics"),
  list: document.getElementById("lectures"),
  prev: document.getElementById("btn-prev"),
  next: document.getElementById("btn-next"),
  done: document.getElementById("btn-done"),
  today: document.getElementById("btn-today"),
  drive: document.getElementById("open-drive"),
  count: document.getElementById("progress-count"),
  fill: document.getElementById("progress-fill")
};

function loadWatched() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (err) {
    return [];
  }
}

function saveWatched() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watched));
  } catch (err) {
    // Storage unavailable: marks last only until the page is closed.
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function buildList() {
  LECTURES.forEach((lecture, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lecture-btn";
    btn.dataset.index = i;

    const day = document.createElement("span");
    day.className = "lecture-day";
    day.textContent = lecture.day;

    const text = document.createElement("span");
    const name = document.createElement("span");
    name.className = "lecture-name";
    name.textContent = lecture.title;
    if (i === todayIndex) {
      const tag = document.createElement("span");
      tag.className = "tag-today";
      tag.textContent = "today";
      name.appendChild(tag);
    }
    const sub = document.createElement("span");
    sub.className = "lecture-sub";
    sub.textContent = "Primer " + pad(i + 1) + " · " + lecture.size;
    text.append(name, sub);

    const check = document.createElement("span");
    check.className = "check";
    check.textContent = "✓";
    check.setAttribute("aria-hidden", "true");

    btn.append(day, text, check);
    btn.addEventListener("click", () => select(i));
    li.appendChild(btn);
    el.list.appendChild(li);
  });
}

function select(i) {
  current = i;
  const lecture = LECTURES[i];
  el.player.src = "https://drive.google.com/file/d/" + lecture.id + "/preview";
  el.drive.href = "https://drive.google.com/file/d/" + lecture.id + "/view";
  el.meta.textContent = "Primer " + pad(i + 1) + " of " + pad(LECTURES.length) + " · " + lecture.day +
    (i === todayIndex ? " · today's lecture" : "");
  el.title.textContent = lecture.title;
  el.topics.textContent = "SIGFi " + lecture.title + " primer, Hinglish lecture.";
  el.prev.disabled = i === 0;
  el.next.disabled = i === LECTURES.length - 1;
  refresh();
}

function refresh() {
  el.list.querySelectorAll(".lecture-btn").forEach((btn) => {
    const i = Number(btn.dataset.index);
    const isDone = watched.includes(LECTURES[i].id);
    btn.classList.toggle("is-done", isDone);
    if (i === current) {
      btn.setAttribute("aria-current", "true");
    } else {
      btn.removeAttribute("aria-current");
    }
    btn.setAttribute("aria-label", LECTURES[i].day + ", " + LECTURES[i].title + (isDone ? ", watched" : ""));
  });

  const currentDone = watched.includes(LECTURES[current].id);
  el.done.setAttribute("aria-pressed", String(currentDone));
  el.done.textContent = currentDone ? "Watched ✓ (undo)" : "Mark as watched";

  const doneCount = LECTURES.filter((l) => watched.includes(l.id)).length;
  el.count.textContent = doneCount + " / " + LECTURES.length;
  el.fill.style.width = (doneCount / LECTURES.length) * 100 + "%";
}

el.prev.addEventListener("click", () => { if (current > 0) select(current - 1); });
el.next.addEventListener("click", () => { if (current < LECTURES.length - 1) select(current + 1); });
el.today.addEventListener("click", () => select(todayIndex));
el.done.addEventListener("click", () => {
  const id = LECTURES[current].id;
  watched = watched.includes(id) ? watched.filter((w) => w !== id) : watched.concat(id);
  saveWatched();
  refresh();
});

buildList();
select(todayIndex);
