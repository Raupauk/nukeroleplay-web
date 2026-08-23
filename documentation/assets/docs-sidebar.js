// Must be captured synchronously - document.currentScript is only
// valid while this script is executing, not inside later callbacks.
var DOCS_SCRIPT_EL = document.currentScript;

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       MOBILE SIDEBAR TOGGLE
    ========================================================= */

    var toggle = document.querySelector(".docs-menu-toggle");
    var sidebar = document.querySelector(".docs-sidebar");

    if (toggle && sidebar) {

        toggle.addEventListener("click", function () {

            sidebar.classList.toggle("open");

        });

    }


    /* =========================================================
       HIGHLIGHT THE ACTIVE SIDEBAR LINK
    ========================================================= */

    var here = window.location.pathname.replace(/index\.html$/, "");

    if (!here.endsWith("/")) {
        here += "/";
    }

    document.querySelectorAll(".docs-nav-link").forEach(function (link) {

        var linkPath = new URL(
            link.getAttribute("href"),
            window.location.href
        ).pathname;

        if (!linkPath.endsWith("/")) {
            linkPath += "/";
        }

        if (linkPath === here) {
            link.classList.add("active");
        }

    });


    /* =========================================================
       FULL-CONTENT SEARCH
    ========================================================= */

    var search = document.querySelector(".docs-search input");
    var searchBox = document.querySelector(".docs-search");
    var navList = document.querySelector(".docs-nav");
    var navLabel = document.querySelector(".docs-nav-label");
    var emptyMsg = document.querySelector(".docs-nav-empty");
    var index = window.DOCS_SEARCH_INDEX || [];

    // Resolve the documentation root regardless of how deep the
    // current page is nested (index.html vs jobs/index.html etc),
    // using the location of this very script as the anchor.
    var scriptEl = DOCS_SCRIPT_EL;
    var docsRoot = scriptEl
        ? new URL("../", scriptEl.src)
        : new URL("./", window.location.href);

    function resolvePath(path) {
        return new URL(path, docsRoot).href;
    }

    function highlight(text, query) {
        if (!query) return text;
        var i = text.toLowerCase().indexOf(query.toLowerCase());
        if (i === -1) return text;
        return (
            text.slice(0, i) +
            "<mark>" + text.slice(i, i + query.length) + "</mark>" +
            text.slice(i + query.length)
        );
    }

    function excerptAround(text, query) {
        var lower = text.toLowerCase();
        var pos = lower.indexOf(query.toLowerCase());

        if (pos === -1) {
            return text.slice(0, 160);
        }

        var start = Math.max(0, pos - 70);
        var end = Math.min(text.length, pos + query.length + 90);

        var excerpt = text.slice(start, end);
        if (start > 0) excerpt = "\u2026" + excerpt;
        if (end < text.length) excerpt = excerpt + "\u2026";

        return excerpt;
    }

    function renderResults(query) {

        var lower = query.toLowerCase();

        var scored = index
            .map(function (entry) {
                var haystack = (entry.title + " " + entry.text).toLowerCase();
                var pos = haystack.indexOf(lower);
                if (pos === -1) return null;

                // Rank title matches above body matches.
                var score = entry.title.toLowerCase().indexOf(lower) !== -1 ? 0 : 1;
                return { entry: entry, score: score, pos: pos };
            })
            .filter(Boolean)
            .sort(function (a, b) { return a.score - b.score; })
            .slice(0, 20);

        var results = document.querySelector(".docs-search-results");

        if (!results) {
            results = document.createElement("div");
            results.className = "docs-search-results";
            searchBox.appendChild(results);
        }

        results.innerHTML = "";

        if (!scored.length) {
            var none = document.createElement("div");
            none.className = "docs-search-no-results";
            none.textContent = "No results for \u201c" + query + "\u201d";
            results.appendChild(none);
            results.classList.add("open");
            return;
        }

        scored.forEach(function (item) {
            var entry = item.entry;
            var snippetSource = entry.text || entry.snippet || "";
            var snippetText = excerptAround(snippetSource, query);

            var a = document.createElement("a");
            a.className = "docs-search-result";
            a.href = resolvePath(entry.path);

            var cat = document.createElement("div");
            cat.className = "docs-search-result-cat";
            cat.textContent = entry.category;

            var title = document.createElement("div");
            title.className = "docs-search-result-title";
            title.innerHTML = highlight(entry.title || entry.category, query);

            var snippet = document.createElement("div");
            snippet.className = "docs-search-result-snippet";
            snippet.innerHTML = highlight(snippetText, query);

            a.appendChild(cat);
            a.appendChild(title);
            if (snippetText) a.appendChild(snippet);
            results.appendChild(a);
        });

        results.classList.add("open");
    }

    function closeResults() {
        var results = document.querySelector(".docs-search-results");
        if (results) results.classList.remove("open");
    }

    if (search) {

        search.addEventListener("input", function () {

            var query = search.value.trim();

            if (!query) {
                closeResults();
                if (navList) navList.style.display = "";
                if (navLabel) navLabel.style.display = "";
                if (emptyMsg) emptyMsg.style.display = "none";
                return;
            }

            if (navList) navList.style.display = "none";
            if (navLabel) navLabel.style.display = "none";

            renderResults(query);

        });

        search.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                search.value = "";
                search.dispatchEvent(new Event("input"));
                search.blur();
            }
        });

        document.addEventListener("click", function (e) {
            if (!searchBox.contains(e.target)) {
                closeResults();
            }
        });

    }


    /* =========================================================
       AUTO-GENERATED "ON THIS PAGE" TABLE OF CONTENTS
    ========================================================= */

    var toc = document.querySelector(".docs-toc");

    if (toc) {

        var sections = document.querySelectorAll(".docs-content > section[id]");
        var list = document.createElement("ul");

        sections.forEach(function (section) {

            var titleEl = section.querySelector(".section-title");

            if (!titleEl) {
                return;
            }

            var link = document.createElement("a");
            link.href = "#" + section.id;
            link.textContent = titleEl.textContent.replace(/\s+/g, " ").trim();

            var li = document.createElement("li");
            li.appendChild(link);
            list.appendChild(li);

        });

        if (list.children.length) {

            var label = document.createElement("div");
            label.className = "docs-toc-label";
            label.textContent = "On This Page";

            toc.appendChild(label);
            toc.appendChild(list);

            var tocLinks = list.querySelectorAll("a");

            var observer = new IntersectionObserver(function (entries) {

                entries.forEach(function (entry) {

                    var link = toc.querySelector(
                        'a[href="#' + entry.target.id + '"]'
                    );

                    if (!link) {
                        return;
                    }

                    if (entry.isIntersecting) {

                        tocLinks.forEach(function (l) {
                            l.classList.remove("active");
                        });

                        link.classList.add("active");

                    }

                });

            }, { rootMargin: "-15% 0px -70% 0px" });

            sections.forEach(function (section) {
                observer.observe(section);
            });

        } else {

            toc.style.display = "none";

        }

    }

});
