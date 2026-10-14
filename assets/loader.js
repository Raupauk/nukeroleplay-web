/*
 * NukeRoleplay page loader
 *
 * Covers the page with a loading screen until all images (including CSS
 * backgrounds) are loaded, so they don't pop in one by one. Included in
 * <head> of every page. Without JavaScript the page simply loads as usual.
 */
(function () {
    "use strict";

    var MAX_WAIT = 6000;      // never block the page longer than this (ms)
    var MIN_FIRST = 1200;     // first page view of a session: always show the loader this long (ms)
    var MIN_NEXT = 0;         // later page views: only show it while content is still loading (ms)
    var FADE_MS = 400;
    var started = Date.now();

    var minShow = MIN_FIRST;
    try {
        if (sessionStorage.getItem("nr-loader-seen")) minShow = MIN_NEXT;
        sessionStorage.setItem("nr-loader-seen", "1");
    } catch (e) { /* storage blocked: treat every view as first */ }
    var root = document.documentElement;

    var css =
        "#nr-loader{position:fixed;inset:0;z-index:2147483647;display:flex;" +
        "flex-direction:column;align-items:center;justify-content:center;gap:22px;" +
        "background:#090a0a;transition:opacity " + FADE_MS + "ms ease,visibility " + FADE_MS + "ms ease;}" +
        "#nr-loader.nr-done{opacity:0;visibility:hidden;pointer-events:none;}" +
        "#nr-loader .nr-logo{font-family:Impact,'Arial Narrow',sans-serif;font-size:1.9rem;" +
        "letter-spacing:.5px;text-transform:uppercase;color:#f1f0eb;}" +
        "#nr-loader .nr-logo span{color:#91b83f;}" +
        "#nr-loader .nr-bar{width:140px;height:3px;background:rgba(255,255,255,.09);overflow:hidden;}" +
        "#nr-loader .nr-bar::after{content:'';display:block;width:40%;height:100%;background:#91b83f;" +
        "animation:nr-slide 1s ease-in-out infinite;}" +
        "@keyframes nr-slide{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}" +
        "@media (prefers-reduced-motion:reduce){#nr-loader .nr-bar::after{animation:none;width:100%;}}" +
        "html.nr-loading{overflow:hidden;}";

    var style = document.createElement("style");
    style.id = "nr-loader-style";
    style.textContent = css;

    var el = document.createElement("div");
    el.id = "nr-loader";
    el.setAttribute("role", "status");
    el.setAttribute("aria-label", "Loading");
    el.innerHTML = '<div class="nr-logo">Nuke<span>Roleplay</span></div><div class="nr-bar"></div>';

    root.classList.add("nr-loading");
    (document.head || root).appendChild(style);
    root.appendChild(el);

    var finished = false;

    function finish() {
        if (finished) return;
        finished = true;
        root.classList.remove("nr-loading");
        el.classList.add("nr-done");
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
            if (style.parentNode) style.parentNode.removeChild(style);
        }, FADE_MS + 50);
    }

    function finishAfterMin() {
        var wait = Math.max(0, minShow - (Date.now() - started));
        setTimeout(finish, wait);
    }

    if (document.readyState === "complete") {
        finishAfterMin();
    } else {
        window.addEventListener("load", finishAfterMin);
        setTimeout(finish, MAX_WAIT);
    }

    // Back/forward cache: never show a stale loader when restoring a page
    window.addEventListener("pageshow", function (e) {
        if (e.persisted) finish();
    });
})();
