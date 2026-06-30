/* Progressive enhancement only — the site is fully readable without JS.
   Three small behaviors: mobile nav toggle, scroll-reveal, active nav link. */
(function () {
  "use strict";

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Close the menu after following an in-page link (mobile).
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Scroll reveal ---- */
  var revealTargets = document.querySelectorAll(
    ".section-head, .card, .case, .timeline-item, .skill-group, .title-block"
  );

  if (reduceMotion || !("IntersectionObserver" in window)) {
    // No animation: just show everything.
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add("reveal");
    });
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---- Active nav link on scroll ---- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav-menu a[href^='#']")
  );
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) {
              l.classList.toggle(
                "is-active",
                l.getAttribute("href") === "#" + entry.target.id
              );
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) {
      navObserver.observe(s);
    });
  }
})();
