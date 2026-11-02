/* =========================================================
   ui.js — dialogue, section panels, standard résumé,
   chiptune SFX, hash routing, and focus management.
   ========================================================= */

window.UI = (function () {

  const els = {};
  let DATA = null;
  let callbacks = {};
  let soundOn = false;
  let audioCtx = null;

  let dialogueOpen = false;
  let dialogueLines = [];
  let dialogueIndex = 0;
  let dialogueDone = null;
  let typing = false;
  let typeTimer = null;

  let panelOpen = false;
  let panelSection = null;
  let lastFocus = null;

  let resumeOpen = false;

  /* ───────────────────────── helpers ───────────────────────── */

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  function readStore(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function $(id) { return document.getElementById(id); }

  function focusGame() {
    if (els.game) {
      els.game.setAttribute("tabindex", "-1");
      try { els.game.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }

  /* ───────────────────────── sound ───────────────────────── */

  function ensureAudio() {
    if (!audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function beep(freq, dur, type, vol, delay) {
    if (!soundOn) return;
    const ac = ensureAudio();
    if (!ac) return;
    const t0 = ac.currentTime + (delay || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol || 0.03, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function sfx(name) {
    if (!soundOn) return;
    if (name === "confirm") {
      beep(660, 0.05, "square", 0.028);
      beep(880, 0.07, "square", 0.028, 0.055);
    } else if (name === "cancel") {
      beep(330, 0.07, "square", 0.028);
      beep(220, 0.09, "square", 0.028, 0.07);
    } else if (name === "door") {
      beep(440, 0.07, "triangle", 0.035);
      beep(220, 0.16, "triangle", 0.035, 0.07);
    } else if (name === "start") {
      [523, 659, 784, 1046].forEach(function (f, i) { beep(f, 0.09, "square", 0.032, i * 0.085); });
    } else if (name === "text") {
      beep(880, 0.02, "square", 0.012);
    }
  }

  function setSound(on) {
    soundOn = !!on;
    if (els.soundBtn) {
      els.soundBtn.textContent = soundOn ? "SOUND: ON" : "SOUND: OFF";
      els.soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    }
    store("devon-arcade-sound", soundOn ? "1" : "0");
    if (soundOn) {
      ensureAudio();
      sfx("confirm");
    }
  }

  function toggleSound() {
    setSound(!soundOn);
  }

  /* ───────────────────────── location + prompt ───────────────────────── */

  function setLocation(text) {
    if (!els.locationTag) return;
    els.locationTag.textContent = text || "";
    els.locationTag.hidden = !text;
  }

  function setPrompt(text) {
    if (!els.promptTag) return;
    els.promptTag.hidden = !text;
    if (text) els.promptTag.textContent = text;
  }

  /* ───────────────────────── title ───────────────────────── */

  function showTitle() {
    if (els.titleScreen) els.titleScreen.hidden = false;
    setLocation("");
    setPrompt(null);
    if (callbacks.onTitleShown) callbacks.onTitleShown();
    if (els.startBtn) {
      try { els.startBtn.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }

  function hideTitle() {
    if (els.titleScreen) els.titleScreen.hidden = true;
    focusGame();
    if (callbacks.onTitleHidden) callbacks.onTitleHidden();
  }

  /* ───────────────────────── fade ───────────────────────── */

  function fadeTransition(cb) {
    if (!els.fade) { cb(); return; }
    els.fade.classList.add("active");
    const out = reducedMotion() ? 10 : 300;
    const hold = reducedMotion() ? 10 : 45;
    window.setTimeout(function () {
      cb();
      window.setTimeout(function () { els.fade.classList.remove("active"); }, hold);
    }, out);
  }

  /* ───────────────────────── dialogue ───────────────────────── */

  function startTyping() {
    const text = dialogueLines[dialogueIndex] || "";
    clearInterval(typeTimer);
    els.dialogueText.textContent = "";
    typing = true;

    if (reducedMotion()) {
      els.dialogueText.textContent = text;
      typing = false;
      return;
    }

    let i = 0;
    typeTimer = setInterval(function () {
      i++;
      els.dialogueText.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(typeTimer);
        typing = false;
      }
    }, 16);
  }

  function advanceDialogue() {
    if (!dialogueOpen) return;

    if (typing) {
      clearInterval(typeTimer);
      els.dialogueText.textContent = dialogueLines[dialogueIndex] || "";
      typing = false;
      return;
    }

    dialogueIndex++;
    if (dialogueIndex >= dialogueLines.length) {
      finishDialogue();
    } else {
      sfx("text");
      startTyping();
    }
  }

  function finishDialogue(skipCallback) {
    if (!dialogueOpen) return;
    clearInterval(typeTimer);
    typing = false;
    dialogueOpen = false;
    els.dialogue.hidden = true;
    window.removeEventListener("keydown", onDialogueKey);

    const done = dialogueDone;
    dialogueDone = null;
    dialogueLines = [];
    dialogueIndex = 0;

    if (!skipCallback && done) done();
  }

  function onDialogueKey(e) {
    if (!dialogueOpen) return;
    if (e.key === "Enter" || e.key === " " || e.key === "z" || e.key === "Z") {
      e.preventDefault();
      advanceDialogue();
    } else if (e.key === "Escape" || e.key === "x" || e.key === "X" || e.key === "Backspace") {
      e.preventDefault();
      sfx("cancel");
      finishDialogue();
    } else if (e.key.indexOf("Arrow") === 0 || e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
    }
  }

  function dialogue(speaker, lines, onDone) {
    if (!els.dialogue) { if (onDone) onDone(); return; }

    if (dialogueOpen) finishDialogue(true);

    dialogueOpen = true;
    dialogueLines = Array.isArray(lines) ? lines.slice() : [String(lines)];
    dialogueIndex = 0;
    dialogueDone = onDone || null;

    els.dialogueName.textContent = speaker || "";
    els.dialogue.hidden = false;
    els.dialogue.setAttribute("tabindex", "-1");
    try { els.dialogue.focus({ preventScroll: true }); } catch (e) { /* ignore */ }

    window.addEventListener("keydown", onDialogueKey);
    sfx("text");
    startTyping();
  }

  /* ───────────────────────── panel rendering ───────────────────────── */

  function entryHTML(entry) {
    const metaBits = [];
    if (entry.org) metaBits.push(esc(entry.org));
    if (entry.meta) metaBits.push(esc(entry.meta));
    if (entry.dates) metaBits.push('<span class="dates">' + esc(entry.dates) + "</span>");

    let list = "";
    if (entry.bullets && entry.bullets.length) {
      list = "<ul>" + entry.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>";
    }

    return '<div class="entry"><h3>' + esc(entry.role || entry.title) + "</h3>" +
      (metaBits.length ? '<div class="meta">' + metaBits.join(" · ") + "</div>" : "") +
      (entry.desc ? "<p>" + esc(entry.desc) + "</p>" : "") +
      list + "</div>";
  }

  function projectHTML(p) {
    return '<div class="entry"><h3>' + esc(p.title) + ' <span class="pill">' + esc(p.tag) + "</span></h3>" +
      "<p>" + esc(p.desc) + "</p>" +
      '<p><a href="' + esc(p.link) + '" target="_blank" rel="noopener">VIEW ON GITHUB &gt;&gt;</a></p></div>';
  }

  function renderPanel(sectionId) {
    const s = DATA.sections[sectionId];
    if (!s) return "";

    if (sectionId === "about") {
      return '<div class="trainer-card">' +
          '<canvas class="trainer-avatar" width="16" height="16" aria-hidden="true"></canvas>' +
          '<div class="trainer-id">' +
            "<h3>" + esc(DATA.name) + ", " + esc(DATA.suffix) + "</h3>" +
            '<p class="trainer-role">' + esc(DATA.title) + "</p>" +
            '<p class="trainer-loc">' + esc(DATA.location) + "</p>" +
            '<ul class="contact-links">' +
              '<li><a href="mailto:' + esc(DATA.email) + '">EMAIL</a></li>' +
              '<li><a href="' + esc(DATA.linkedin) + '" target="_blank" rel="noopener">LINKEDIN</a></li>' +
              '<li><a href="' + esc(DATA.github) + '" target="_blank" rel="noopener">GITHUB</a></li>' +
            "</ul>" +
          "</div>" +
        "</div>" +
        '<p class="summary">' + esc(DATA.summary) + "</p>" +
        '<div class="entry"><h3>HIGHLIGHTS</h3><ul>' +
          DATA.highlights.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") +
        "</ul></div>" +
        '<div class="panel-actions"><a class="pixel-btn" href="#resume">OPEN STANDARD RÉSUMÉ</a></div>';
    }

    if (sectionId === "professional") {
      return DATA.experience.map(entryHTML).join("");
    }

    if (sectionId === "collegiate") {
      const c = DATA.collegiate;
      let html = "";

      html += '<div class="section-note">' + esc(c.note) + "</div>";

      html += '<div class="entry"><h3>DEGREES</h3>' +
        c.degrees.map(function (d) {
          return "<p><strong>" + esc(d.degree) + "</strong><br>" +
            '<span class="meta">' + esc(d.school) + " · " + esc(d.location) + " · " + esc(d.year) + "</span><br>" +
            esc(d.detail) + "</p>";
        }).join("") + "</div>";

      html += '<div class="entry"><h3>CERTIFICATIONS</h3><ul>' +
        c.certifications.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") +
        "</ul></div>";

      html += '<div class="entry"><h3>AWARDS &amp; HACKATHONS</h3><ul>' +
        c.awards.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") +
        "</ul></div>";

      if (c.projects && c.projects.length) {
        html += '<div class="entry"><h3>PROJECTS</h3>';
        c.projects.forEach(function (p) {
          if (typeof p === "string") {
            html += "<p>" + esc(p) + "</p>";
          } else {
            html += "<p><strong>" + esc(p.title || "") + "</strong>" +
              (p.desc ? "<br>" + esc(p.desc) : "") +
              (p.link ? '<br><a href="' + esc(p.link) + '" target="_blank" rel="noopener">VIEW &gt;&gt;</a>' : "") +
              "</p>";
          }
        });
        html += "</div>";
      }

      if (c.coursework && c.coursework.length) {
        html += '<div class="entry"><h3>COURSEWORK</h3><ul>' +
          c.coursework.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") +
          "</ul></div>";
      }

      if (c.activities && c.activities.length) {
        html += '<div class="entry"><h3>ACTIVITIES</h3><ul>' +
          c.activities.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") +
          "</ul></div>";
      }

      return html;
    }

    if (sectionId === "ai") {
      let html = '<p class="summary">' + esc(DATA.ai.summary) + "</p>";
      html += '<div class="pill-row">' +
        DATA.ai.stack.map(function (x) { return '<span class="pill">' + esc(x) + "</span>"; }).join("") +
        "</div>";
      html += DATA.ai.work.map(entryHTML).join("");
      html += '<div class="entry"><h3>SELECTED PROJECTS</h3></div>';
      html += DATA.projects.map(projectHTML).join("");
      return html;
    }

    if (sectionId === "life") {
      let html = '<p class="summary">When I am not building data platforms or LLM systems, this is where you will find me.</p>';
      html += '<div class="entry"><h3>OFF THE CLOCK</h3><ul>' +
        DATA.interests.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") +
        "</ul></div>";
      html += '<div class="entry"><h3>CURRENT SIDE QUEST</h3>' +
        "<p>A reinforcement-learning trading bot that I keep pushing further — my favorite excuse to think about how AI can learn to read markets.</p></div>";
      return html;
    }

    return "";
  }

  function openPanel(sectionId) {
    const s = DATA.sections[sectionId];
    if (!s || !els.panel) return;

    if (panelOpen) closePanel(false);

    panelOpen = true;
    panelSection = sectionId;
    lastFocus = document.activeElement;

    els.panelKicker.textContent = s.kicker || "";
    els.panelTitle.textContent = s.title || "";
    els.panelBody.innerHTML = renderPanel(sectionId);
    els.panelBody.scrollTop = 0;
    els.panel.hidden = false;
    els.panel.setAttribute("tabindex", "-1");

    const avatar = els.panelBody.querySelector(".trainer-avatar");
    if (avatar) Art.drawAvatar(avatar, null);

    window.addEventListener("keydown", onPanelKey);
    sfx("confirm");

    try { els.panelClose.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }

  function closePanel(notify) {
    if (!panelOpen) return;
    panelOpen = false;
    panelSection = null;
    if (els.panel) els.panel.hidden = true;
    window.removeEventListener("keydown", onPanelKey);

    if (lastFocus && document.contains(lastFocus)) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    } else {
      focusGame();
    }

    if (notify !== false && callbacks.onPanelClosed) callbacks.onPanelClosed();
  }

  function onPanelKey(e) {
    if (!panelOpen) return;
    if (e.key === "Escape" || e.key === "x" || e.key === "X" || e.key === "Backspace") {
      e.preventDefault();
      sfx("cancel");
      closePanel();
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "PageDown" || e.key === "PageUp") {
      const body = els.panelBody;
      if (body && body.scrollHeight > body.clientHeight) {
        e.preventDefault();
        const amount =
          e.key === "ArrowDown" ? 40 :
          e.key === "ArrowUp" ? -40 :
          e.key === "PageDown" ? body.clientHeight :
          -body.clientHeight;
        body.scrollBy(0, amount);
      }
    }
  }

  /* ───────────────────────── standard résumé ───────────────────────── */

  function resumeEntry(entry) {
    return '<div class="r-entry"><h3>' + esc(entry.role) + "</h3>" +
      '<div class="r-meta">' + [entry.org, entry.meta, entry.dates].filter(Boolean).map(esc).join(" · ") + "</div>" +
      "<ul>" + entry.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></div>";
  }

  function buildResume() {
    if (!els.resumeContent) return;

    let html = "";
    html += "<h1>" + esc(DATA.displayName) + "</h1>";
    html += '<p class="r-title">' + esc(DATA.title) + " — " + esc(DATA.tagline) + "</p>";
    html += '<p class="r-contact">' + esc(DATA.location) + " · " +
      '<a href="mailto:' + esc(DATA.email) + '">' + esc(DATA.email) + "</a> · " +
      '<a href="' + esc(DATA.linkedin) + '" target="_blank" rel="noopener">linkedin.com/in/devonrasch</a> · ' +
      '<a href="' + esc(DATA.github) + '" target="_blank" rel="noopener">github.com/zudevon</a></p>';

    html += "<h2>Summary</h2>";
    html += '<p class="r-summary">' + esc(DATA.summary) + "</p>";

    html += "<h2>Highlights</h2><ul>" +
      DATA.highlights.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul>";

    html += "<h2>Core Skills</h2><div class=\"r-skills\">";
    DATA.skills.forEach(function (s) {
      html += '<div class="r-skill-row"><strong>' + esc(s.group) + "</strong><span>" + esc(s.items) + "</span></div>";
    });
    html += "</div>";

    html += "<h2>Experience</h2>";
    DATA.experience.forEach(function (e) { html += resumeEntry(e); });

    html += "<h2>Education</h2>";
    DATA.education.forEach(function (e) {
      html += '<div class="r-entry"><h3>' + esc(e.degree) + "</h3>" +
        '<div class="r-meta">' + esc(e.school) + " · " + esc(e.location) + " · " + esc(e.year) + "</div></div>";
    });

    html += "<h2>Certifications</h2><ul>" +
      DATA.certifications.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>";

    html += "<h2>Awards &amp; Hackathons</h2><ul>" +
      DATA.awards.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>";

    html += "<h2>Selected Projects</h2>";
    DATA.projects.forEach(function (p) {
      html += '<div class="r-entry"><h3>' + esc(p.title) + "</h3>" +
        '<div class="r-meta">' + esc(p.tag) + " · " +
        '<a href="' + esc(p.link) + '" target="_blank" rel="noopener">GitHub</a></div>' +
        "<p>" + esc(p.desc) + "</p></div>";
    });

    if (DATA.collegiate && DATA.collegiate.projects && DATA.collegiate.projects.length) {
      html += "<h2>Collegiate Projects</h2>";
      DATA.collegiate.projects.forEach(function (p) {
        if (typeof p === "string") {
          html += "<p>" + esc(p) + "</p>";
          return;
        }
        html += '<div class="r-entry"><h3>' + esc(p.title || "") + "</h3>" +
          (p.link ? '<div class="r-meta"><a href="' + esc(p.link) + '" target="_blank" rel="noopener">Link</a></div>' : "") +
          (p.desc ? "<p>" + esc(p.desc) + "</p>" : "") + "</div>";
      });
    }

    if (DATA.collegiate && DATA.collegiate.coursework && DATA.collegiate.coursework.length) {
      html += "<h2>Relevant Coursework</h2><ul>" +
        DATA.collegiate.coursework.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    }

    if (DATA.collegiate && DATA.collegiate.activities && DATA.collegiate.activities.length) {
      html += "<h2>Campus Activities</h2><ul>" +
        DATA.collegiate.activities.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    }

    html += "<h2>Interests</h2><p>" + DATA.interests.map(esc).join(" ") + "</p>";

    els.resumeContent.innerHTML = html;
  }

  function showResume() {
    if (resumeOpen) return;
    if (panelOpen) closePanel(false);
    if (dialogueOpen) finishDialogue(true);

    resumeOpen = true;
    document.body.classList.add("resume-mode");
    els.standardResume.hidden = false;
    if (callbacks.onResumeOpen) callbacks.onResumeOpen();
    try { history.replaceState(null, "", "#resume"); } catch (e) { /* ignore */ }
    window.scrollTo(0, 0);
    try { els.backToArcade.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }

  function hideResume() {
    if (!resumeOpen) return;
    resumeOpen = false;
    document.body.classList.remove("resume-mode");
    els.standardResume.hidden = true;
    if (callbacks.onResumeClose) callbacks.onResumeClose();
    try { history.replaceState(null, "", "#/"); } catch (e) { /* ignore */ }
    window.scrollTo(0, 0);
    focusGame();
  }

  /* ───────────────────────── hash routing ───────────────────────── */

  function handleHash() {
    const h = (location.hash || "").replace(/^#\/?/, "");

    if (h === "resume") {
      showResume();
      return true;
    }
    if (h === "play" || h === "map") {
      if (callbacks.onStart) callbacks.onStart(true);
      return true;
    }

    const map = {
      about: "about",
      experience: "professional",
      ai: "ai",
      college: "collegiate",
      life: "life"
    };
    if (map[h]) {
      if (callbacks.onDeepLink) callbacks.onDeepLink(map[h]);
      return true;
    }
    return false;
  }

  /* ───────────────────────── init ───────────────────────── */

  function init(data, cb) {
    DATA = data;
    callbacks = cb || {};

    els.game = $("game");
    els.titleScreen = $("titleScreen");
    els.startBtn = $("startBtn");
    els.dialogue = $("dialogue");
    els.dialogueName = $("dialogueName");
    els.dialogueText = $("dialogueText");
    els.panel = $("panel");
    els.panelKicker = $("panelKicker");
    els.panelTitle = $("panelTitle");
    els.panelBody = $("panelBody");
    els.panelClose = $("panelClose");
    els.panelResumeBtn = $("panelResumeBtn");
    els.fade = $("fade");
    els.locationTag = $("locationTag");
    els.promptTag = $("promptTag");
    els.soundBtn = $("soundBtn");
    els.standardResume = $("standardResume");
    els.resumeContent = $("resumeContent");
    els.backToArcade = $("backToArcade");
    els.printBtn = $("printBtn");

    setSound(readStore("devon-arcade-sound") === "1");
    buildResume();

    if (els.startBtn) {
      els.startBtn.addEventListener("click", function () {
        if (callbacks.onStart) callbacks.onStart(false);
      });
    }

    if (els.soundBtn) {
      els.soundBtn.addEventListener("click", toggleSound);
    }

    if (els.panelClose) {
      els.panelClose.addEventListener("click", function () { closePanel(); });
    }

    if (els.panelResumeBtn) {
      els.panelResumeBtn.addEventListener("click", function () { showResume(); });
    }

    if (els.dialogue) {
      els.dialogue.addEventListener("click", function () { advanceDialogue(); });
    }

    if (els.backToArcade) {
      els.backToArcade.addEventListener("click", function (e) {
        e.preventDefault();
        hideResume();
      });
    }

    if (els.printBtn) {
      els.printBtn.addEventListener("click", function () { window.print(); });
    }

    window.addEventListener("hashchange", function () { handleHash(); });

    window.addEventListener("keydown", function (e) {
      if (resumeOpen && (e.key === "Escape" || e.key === "x" || e.key === "X" || e.key === "Backspace")) {
        e.preventDefault();
        hideResume();
        return;
      }
      if (e.key === "m" || e.key === "M") {
        const tag = (e.target && e.target.tagName || "").toLowerCase();
        if (tag !== "input" && tag !== "textarea") toggleSound();
      }
    });
  }

  return {
    init,
    showTitle, hideTitle,
    setLocation, setPrompt,
    dialogue,
    advanceDialogue,
    closeDialogue: finishDialogue,
    openPanel, closePanel,
    showResume, hideResume,
    fadeTransition,
    sfx, toggleSound, setSound,
    handleHash,
    isResumeOpen: function () { return resumeOpen; },
    isPanelOpen: function () { return panelOpen; },
    isDialogueOpen: function () { return dialogueOpen; }
  };
})();
