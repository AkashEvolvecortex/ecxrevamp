/* =========================================================
   PROCESS TIMELINE — GLOW LOOP
   Cycles an "is-active" glow through the process cards.
   Hovering a card highlights it and pauses the loop.
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    var timeline = document.querySelector(".process-timeline");
    if (!timeline) return;

    var steps = timeline.querySelectorAll(".process-step");
    if (!steps.length) return;

    var INTERVAL = 1800;
    var current = 0;
    var timer = null;

    function activate(index) {
        steps.forEach(function (step, i) {
            step.classList.toggle("is-active", i === index);
        });
        current = index;
    }

    function start() {
        stop();
        timer = setInterval(function () {
            activate((current + 1) % steps.length);
        }, INTERVAL);
    }

    function stop() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    steps.forEach(function (step, i) {
        step.addEventListener("mouseenter", function () {
            stop();
            activate(i);
        });
        step.addEventListener("mouseleave", start);
    });

    // Only run the loop while the section is on screen
    if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) start();
                else stop();
            });
        }, { threshold: 0.2 }).observe(timeline);
    } else {
        start();
    }

    activate(0);
});
