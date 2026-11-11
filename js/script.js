/* ==========================================================================
   Suppkrit Karawa — Portfolio
   Vanilla JavaScript. No dependencies, no build step.

   Modules
   1.  Mobile navigation
   2.  Sticky header state
   3.  Active navigation highlighting
   4.  Scroll reveal animations
   5.  Terminal typing animation
   6.  Footer year
   ========================================================================== */

(function () {
  "use strict";

  /* Shared helpers ---------------------------------------------------------- */

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* Reads the real header height so anchored sections are not hidden behind it. */
  function getHeaderHeight() {
    var header = $("#siteHeader");
    return header ? header.offsetHeight : 72;
  }

  /* ==========================================================================
     1. MOBILE NAVIGATION
     ========================================================================== */
  function initMobileNav() {
    var toggle = $("#navToggle");
    var nav = $("#primaryNav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    function isOpen() {
      return nav.classList.contains("is-open");
    }

    toggle.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    // Close the panel after choosing a destination
    $$(".nav-link", nav).forEach(function (link) {
      link.addEventListener("click", function () {
        if (isOpen()) setOpen(false);
      });
    });

    // Escape closes the menu and returns focus to the toggle
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Clicking outside the panel closes it
    document.addEventListener("click", function (event) {
      if (!isOpen()) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    // Leaving mobile widths resets the panel
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && isOpen()) setOpen(false);
    });
  }

  /* ==========================================================================
     2. STICKY HEADER STATE
     ========================================================================== */
  function initHeaderState() {
    var header = $("#siteHeader");
    if (!header) return;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ==========================================================================
     3. ACTIVE NAVIGATION HIGHLIGHTING
     ========================================================================== */
  function initActiveNav() {
    var links = $$(".nav-link");
    if (!links.length) return;

    // Pair each navigation link with the section it points to
    var sections = links
      .map(function (link) {
        var id = link.getAttribute("href");
        if (!id || id.charAt(0) !== "#") return null;
        var section = document.getElementById(id.slice(1));
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    function setActive(activeLink) {
      links.forEach(function (link) {
        var isActive = link === activeLink;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    function update() {
      var probe = window.scrollY + getHeaderHeight() + 90;
      var current = sections[0];

      sections.forEach(function (entry) {
        if (entry.section.offsetTop <= probe) current = entry;
      });

      // At the very bottom of the page, always highlight the last section
      var atBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 4;
      if (atBottom) current = sections[sections.length - 1];

      setActive(current.link);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ==========================================================================
     4. SCROLL REVEAL ANIMATIONS
     ========================================================================== */
  function initScrollReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    // Without IntersectionObserver (or with reduced motion) show everything
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  /* ==========================================================================
     5. TERMINAL TYPING ANIMATION
     ========================================================================== */
  var TERMINAL_SCRIPT = [
    { type: "cmd", text: "whoami" },
    { type: "out", text: "Suppkrit Karawa" },
    { type: "cmd", text: "role" },
    { type: "out", text: "Information Technology Student" },
    { type: "cmd", text: "interests" },
    { type: "out", text: "Computer Systems, Technology, Books" },
    { type: "cmd", text: "status" },
    { type: "out", text: "Learning & Building..." }
  ];

  function initTerminal() {
    var body = $("#terminalBody");
    if (!body) return;

    // Reduced motion: keep the static markup already in the HTML
    if (prefersReducedMotion) return;

    var promptText = "$";

    function sleep(ms) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, ms);
      });
    }

    function createPromptLine() {
      var line = document.createElement("p");
      line.className = "term-line";

      var prompt = document.createElement("span");
      prompt.className = "term-prompt";
      prompt.textContent = promptText;

      var command = document.createElement("span");
      command.className = "term-cmd";

      line.appendChild(prompt);
      line.appendChild(document.createTextNode(" "));
      line.appendChild(command);

      return { line: line, command: command };
    }

    /* Types a command string into the given element, one character at a time. */
    function typeCommand(element, text) {
      return new Promise(function (resolve) {
        var index = 0;
        (function step() {
          if (index >= text.length) return resolve();
          element.textContent += text.charAt(index++);
          window.setTimeout(step, 52 + Math.random() * 40);
        })();
      });
    }

    function run() {
      var sequence = Promise.resolve();

      TERMINAL_SCRIPT.forEach(function (entry) {
        sequence = sequence.then(function () {
          if (entry.type === "cmd") {
            var parts = createPromptLine();
            body.appendChild(parts.line);
            return typeCommand(parts.command, entry.text).then(function () {
              return sleep(300);
            });
          }

          var output = document.createElement("p");
          output.className = "term-line term-out";
          output.textContent = entry.text;
          body.appendChild(output);
          return sleep(240);
        });
      });

      // Final idle prompt with a blinking cursor
      sequence = sequence.then(function () {
        var idle = document.createElement("p");
        idle.className = "term-line term-idle";

        var prompt = document.createElement("span");
        prompt.className = "term-prompt";
        prompt.textContent = promptText;

        var cursor = document.createElement("span");
        cursor.className = "terminal-cursor";
        cursor.setAttribute("aria-hidden", "true");

        idle.appendChild(prompt);
        idle.appendChild(document.createTextNode(" "));
        idle.appendChild(cursor);
        body.appendChild(idle);
      });

      return sequence;
    }

    // Start only once the terminal is in view, and only once.
    var started = false;
    function start() {
      if (started) return;
      started = true;
      body.innerHTML = "";
      run();
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              start();
              observer.disconnect();
            }
          });
        },
        { threshold: 0.25 }
      );
      observer.observe(body);
    } else {
      start();
    }
  }

  /* ==========================================================================
     6. FOOTER YEAR
     ========================================================================== */
  function initFooterYear() {
    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* Bootstrap --------------------------------------------------------------- */
  function init() {
    initMobileNav();
    initHeaderState();
    initActiveNav();
    initScrollReveal();
    initTerminal();
    initFooterYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
