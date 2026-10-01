/* Kumar Ashwini — portfolio scripts (used by index.html) */

/* Hide the photo frame if img/kapp.jpg is missing */
(function () {
  const img = document.querySelector(".portrait");
  if (!img) return;
  const drop = () => img.remove();
  if (img.complete && img.naturalWidth === 0) drop();
  else img.addEventListener("error", drop);
})();

/* ===== Contact details: edit here only. Kept in script (not in the page text)
   so they are not shown until a visitor clicks, and are harder for bots to scrape. ===== */
const CONTACT = {
  name: "Kumar Ashwini",
  personal: ["ashu481", "live.com"],
  college:  ["pgp41426", "iiml.ac.in"],
  phone:    ["+91", "9833974115"],
  linkedin: "https://www.linkedin.com/in/krashwn",
  waText:   "Hi Kumar, I saw your portfolio."
};

(function () {
  const email = k => CONTACT[k].join("@");
  const phoneRaw = CONTACT.phone.join("");
  const phoneNice = CONTACT.phone[0] + " " + CONTACT.phone[1].replace(/(\d{5})(\d{5})/, "$1 $2");
  const isPhone = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  const reveal = (btn, note, value) => {
    const box = document.getElementById("creveal");
    box.innerHTML = "";
    const p = document.createElement("p"); p.textContent = note;
    const v = document.createElement("span"); v.className = "val"; v.textContent = value;
    const c = document.createElement("button"); c.type = "button"; c.textContent = "Copy";
    c.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(value); c.textContent = "Copied"; }
      catch (e) { c.textContent = "Select and copy"; }
    });
    box.append(p, v, c);
    box.hidden = false;
  };

  const actions = {
    "email-personal": btn => openMail(btn, email("personal")),
    "email-college":  btn => openMail(btn, email("college")),
    "phone": btn => {
      if (isPhone) { window.location.href = "tel:" + phoneRaw; }
      else { reveal(btn, "Call me on:", phoneNice); }
    },
    "whatsapp": () => {
      document.getElementById("creveal").hidden = true;
      const url = "https://wa.me/" + phoneRaw.replace("+", "") + "?text=" + encodeURIComponent(CONTACT.waText);
      window.open(url, "_blank", "noopener");
    },
    "linkedin": () => {
      document.getElementById("creveal").hidden = true;
      window.open(CONTACT.linkedin, "_blank", "noopener");
    }
  };

  function openMail(btn, addr) {
    const to = encodeURIComponent(CONTACT.name) + "%20%3C" + addr + "%3E";   // Kumar Ashwini <address>
    window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent("Hello from your portfolio");
    // If no email app is set up (common on office/shared computers), nothing opens,
    // so also show the address with a Copy button as a fallback.
    reveal(btn, "If your email app didn't open, write to:", addr);
  }

  document.querySelectorAll(".ctile[data-action]").forEach(btn =>
    btn.addEventListener("click", () => actions[btn.dataset.action](btn)));
})();

/* Highlight the menu item for the section currently on screen */
(function () {
  const links = [...document.querySelectorAll('.side a[href^="#"]')];
  const byId = Object.fromEntries(links.map(a => [a.getAttribute('href').slice(1), a]));
  const targets = Object.keys(byId).map(id => document.getElementById(id)).filter(Boolean);
  const setActive = id => links.forEach(a => {
    const on = a === byId[id];
    a.setAttribute('aria-current', on ? 'true' : 'false');
    if (on && window.matchMedia('(max-width: 1080px)').matches) {
      a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  });
  const update = () => {
    // Last section whose top has passed 35% of the screen height
    const line = window.innerHeight * 0.35;
    let current = targets[0].id;
    for (const t of targets) if (t.getBoundingClientRect().top <= line) current = t.id;
    // At the very bottom, the last section is the active one
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      current = targets[targets.length - 1].id;
    }
    setActive(current);
    document.body.classList.toggle('nav-on', window.scrollY > 80);
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
