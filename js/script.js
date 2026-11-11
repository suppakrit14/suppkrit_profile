/* ==========================================================================
   Suppkrit Karawa — พอร์ตโฟลิโอ (Dashboard layout)
   Vanilla JavaScript ไม่มี dependency และไม่มีขั้นตอน build

   1.  Sidebar drawer (มือถือ / แท็บเล็ต)
   2.  สถานะ top bar ตอนเลื่อนหน้า
   3.  ไฮไลต์เมนูที่ active + เปลี่ยนหัวข้อ top bar
   4.  Scroll reveal
   5.  Typing animation ในเทอร์มินัล
   6.  ปี พ.ศ. ใน footer
   ========================================================================== */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DRAWER_BREAKPOINT = 1024;

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ==========================================================================
     1. SIDEBAR DRAWER
     ========================================================================== */
  function initDrawer() {
    var sidebar = $("#sidebar");
    var menuBtn = $("#menuBtn");
    var backdrop = $("#sidebarBackdrop");
    if (!sidebar || !menuBtn || !backdrop) return;

    function isOpen() {
      return sidebar.classList.contains("is-open");
    }

    function setOpen(open) {
      sidebar.classList.toggle("is-open", open);
      document.body.classList.toggle("drawer-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "ปิดเมนู" : "เปิดเมนู");
      backdrop.hidden = !open;
    }

    menuBtn.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    backdrop.addEventListener("click", function () {
      setOpen(false);
    });

    // เลือกเมนูแล้วปิด drawer
    $$(".side-link", sidebar).forEach(function (link) {
      link.addEventListener("click", function () {
        if (isOpen()) setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        menuBtn.focus();
      }
    });

    // กลับสู่จอใหญ่ = ปิด drawer
    window.addEventListener("resize", function () {
      if (window.innerWidth > DRAWER_BREAKPOINT && isOpen()) setOpen(false);
    });
  }

  /* ==========================================================================
     2. TOP BAR STATE
     ========================================================================== */
  function initTopbarState() {
    var topbar = $("#topbar");
    if (!topbar) return;

    function update() {
      topbar.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ==========================================================================
     3. ACTIVE MENU + TOP BAR TITLE
     ========================================================================== */
  function initActiveSection() {
    var links = $$(".side-link");
    if (!links.length) return;

    var title = $("#pageTitle");
    var sub = $("#pageSub");

    // จับคู่เมนูกับ section ปลายทาง
    var sections = links
      .map(function (link) {
        var href = link.getAttribute("href");
        if (!href || href.charAt(0) !== "#") return null;
        var section = document.getElementById(href.slice(1));
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    var currentLink = null;

    function update() {
      var topbarH = $("#topbar") ? $("#topbar").offsetHeight : 76;
      var probe = window.scrollY + topbarH + 80;
      var current = sections[0];

      sections.forEach(function (entry) {
        if (entry.section.offsetTop <= probe) current = entry;
      });

      // อยู่ล่างสุดของหน้า ให้ไฮไลต์ section สุดท้าย
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
        current = sections[sections.length - 1];
      }

      if (current.link === currentLink) return;
      currentLink = current.link;

      links.forEach(function (link) {
        var active = link === current.link;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      // เปลี่ยนหัวข้อ top bar ตาม section ที่เปิดอยู่
      if (title) {
        var nextTitle = current.section.getAttribute("data-title");
        if (nextTitle) title.textContent = nextTitle;
      }
      if (sub) {
        var nextSub = current.section.getAttribute("data-sub");
        if (nextSub) sub.textContent = nextSub;
      }
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ==========================================================================
     4. SCROLL REVEAL
     ========================================================================== */
  function initScrollReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

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
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  /* ==========================================================================
     5. TERMINAL TYPING
     ========================================================================== */
  var TERMINAL_SCRIPT = [
    { type: "cmd", text: "whoami" },
    { type: "out", text: "Suppkrit Karawa" },
    { type: "cmd", text: "role" },
    { type: "out", text: "นักศึกษาเทคโนโลยีสารสนเทศ" },
    { type: "cmd", text: "interests" },
    { type: "out", text: "ระบบคอมพิวเตอร์, เทคโนโลยี, หนังสือ" },
    { type: "cmd", text: "status" },
    { type: "out", text: "กำลังเรียนรู้และสร้างผลงาน..." }
  ];

  function initTerminal() {
    var body = $("#terminalBody");
    if (!body) return;

    // ปิด animation: ใช้ข้อความ static ที่มีอยู่ใน HTML
    if (prefersReducedMotion) return;

    var PROMPT = "$";

    function sleep(ms) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, ms);
      });
    }

    /* พิมพ์ข้อความลง element ทีละตัวอักษร */
    function typeInto(element, text) {
      return new Promise(function (resolve) {
        var index = 0;
        (function step() {
          if (index >= text.length) return resolve();
          element.textContent += text.charAt(index++);
          window.setTimeout(step, 45 + Math.random() * 40);
        })();
      });
    }

    function createCommandLine() {
      var line = document.createElement("p");
      line.className = "term-line";

      var prompt = document.createElement("span");
      prompt.className = "term-prompt";
      prompt.textContent = PROMPT;

      var command = document.createElement("span");
      command.className = "term-cmd";

      line.appendChild(prompt);
      line.appendChild(document.createTextNode(" "));
      line.appendChild(command);

      return { line: line, command: command };
    }

    function run() {
      var sequence = Promise.resolve();

      TERMINAL_SCRIPT.forEach(function (entry) {
        sequence = sequence.then(function () {
          if (entry.type === "cmd") {
            var parts = createCommandLine();
            body.appendChild(parts.line);
            return typeInto(parts.command, entry.text).then(function () {
              return sleep(280);
            });
          }

          var output = document.createElement("p");
          output.className = "term-line term-out";
          output.textContent = entry.text;
          body.appendChild(output);
          return sleep(220);
        });
      });

      // บรรทัดสุดท้ายพร้อมเคอร์เซอร์กระพริบ
      sequence = sequence.then(function () {
        var idle = document.createElement("p");
        idle.className = "term-line term-idle";

        var prompt = document.createElement("span");
        prompt.className = "term-prompt";
        prompt.textContent = PROMPT;

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
        { threshold: 0.2 }
      );
      observer.observe(body);
    } else {
      start();
    }
  }

  /* ==========================================================================
     6. FOOTER YEAR (พ.ศ.)
     ========================================================================== */
  function initFooterYear() {
    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear() + 543);
  }

  /* Bootstrap --------------------------------------------------------------- */
  function init() {
    initDrawer();
    initTopbarState();
    initActiveSection();
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
