/* =========================================================
   main.js — boot the engine and wire the UI together.
   ========================================================= */

(function () {

  const DATA = window.RESUME_DATA;
  let gameStarted = false;

  const NPC_KIND = {
    about: "mom",
    professional: "guild",
    collegiate: "rival",
    ai: "professor",
    life: "friend"
  };

  DATA.world.buildings.forEach(function (b) {
    b.npcKind = NPC_KIND[b.section] || "professor";
  });

  const INTRO = [
    "Hello there! Welcome to DEVON'S RÉSUMÉ.",
    "This little town holds a decade of data and AI work. Every building is a chapter.",
    "Walk with the ARROW KEYS or WASD. Press ENTER to interact.",
    "Start at your house. When you're ready, the rest of the town is yours."
  ];

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  function startGame(skipIntro) {
    if (gameStarted) {
      UI.hideTitle();
      return;
    }

    gameStarted = true;
    UI.hideTitle();
    Engine.startOverworld();
    UI.setLocation(DATA.world.townName);
    UI.sfx("start");

    const seen = safeGet("devon-arcade-seen-intro") === "1";
    if (!skipIntro && !seen) {
      Engine.setPaused(true);
      UI.dialogue("PROFESSOR", INTRO, function () {
        safeSet("devon-arcade-seen-intro", "1");
        Engine.setPaused(false);
        Engine.setActive(true);
        UI.setLocation(DATA.world.townName);
      });
    } else {
      Engine.setPaused(false);
      Engine.setActive(true);
    }
  }

  function deepLink(section) {
    if (!gameStarted) {
      gameStarted = true;
      UI.hideTitle();
      Engine.startOverworld();
    }

    const building = DATA.world.buildings.filter(function (b) {
      return b.section === section;
    })[0];

    if (!building) return;

    Engine.enterInterior(building);
    Engine.setActive(true);
    Engine.setPaused(true);
    UI.setLocation(building.name);
    UI.openPanel(section);
  }

  /* ───────────────────────── engine hooks ───────────────────────── */

  Engine.init(document.getElementById("game"), DATA, {
    onLocation: function (name) { UI.setLocation(name); },
    onPrompt: function (text) { UI.setPrompt(text); },

    onDoor: function (building) {
      Engine.setPaused(true);
      UI.sfx("door");
      UI.fadeTransition(function () {
        Engine.enterInterior(building);
        UI.setLocation(building.name);
        Engine.setActive(true);
        Engine.setPaused(false);
      });
    },

    onExit: function () {
      Engine.setPaused(true);
      UI.sfx("door");
      UI.fadeTransition(function () {
        Engine.exitInterior();
        UI.setLocation(DATA.world.townName);
        Engine.setActive(true);
        Engine.setPaused(false);
      });
    },

    onInteract: function (payload) {
      Engine.setPaused(true);

      if (payload.type === "sign") {
        UI.dialogue("SIGN", payload.text.split("\n"), function () {
          Engine.setPaused(false);
        });
        return;
      }

      if (payload.type === "npc") {
        UI.dialogue(payload.npc.name, payload.npc.lines, function () {
          UI.openPanel(payload.section);
        });
        return;
      }

      UI.openPanel(payload.section);
    }
  });

  /* ───────────────────────── UI callbacks ───────────────────────── */

  UI.init(DATA, {
    onStart: startGame,
    onDeepLink: deepLink,

    onPanelClosed: function () {
      Engine.setPaused(false);
    },

    onResumeOpen: function () {
      Engine.setActive(false);
      Engine.setPaused(true);
    },

    onResumeClose: function () {
      if (gameStarted) {
        Engine.setActive(true);
        Engine.setPaused(false);
      } else {
        Engine.setActive(false);
        UI.showTitle();
      }
    },

    onTitleShown: function () {
      Engine.setActive(false);
    },

    onTitleHidden: function () { /* startGame handles the transition */ }
  });

  /* ───────────────────────── touch controls ───────────────────────── */

  const touch = document.getElementById("touch");
  if (touch) {
    touch.querySelectorAll("[data-dir]").forEach(function (btn) {
      const dir = btn.getAttribute("data-dir");
      const down = function (e) {
        e.preventDefault();
        btn.classList.add("active");
        Engine.pressDir(dir);
      };
      const up = function (e) {
        e.preventDefault();
        btn.classList.remove("active");
        Engine.releaseDir(dir);
      };
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointerleave", up);
      btn.addEventListener("pointercancel", up);
    });

    touch.querySelectorAll("[data-action]").forEach(function (btn) {
      const act = btn.getAttribute("data-action");
      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        btn.classList.add("active");

        if (act === "a") {
          if (UI.isDialogueOpen()) UI.advanceDialogue();
          else if (!UI.isPanelOpen() && !UI.isResumeOpen()) Engine.pressAction();
        } else {
          if (UI.isDialogueOpen()) UI.closeDialogue();
          else if (UI.isPanelOpen()) UI.closePanel();
          else if (!UI.isResumeOpen()) Engine.pressCancel();
        }
      });

      const up = function (e) {
        e.preventDefault();
        btn.classList.remove("active");
      };
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointerleave", up);
      btn.addEventListener("pointercancel", up);
    });
  }

  /* ───────────────────────── boot view ───────────────────────── */

  const handled = UI.handleHash();
  if (!handled) UI.showTitle();

})();
