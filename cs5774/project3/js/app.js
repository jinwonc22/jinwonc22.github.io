/* Stacks prototype.
   Tooltips and the sidebar overlay live in js/interactions.js (jQuery).
   Every page loads this file for js functionality, currently for:
   1. Tag Selection (details.html, upload.html)
   2. Simulated Search (All pages)
   3. People List (permissions.html)
   AI DISCLOSURE: Formatting/boilerplate by Anima, debugged and reviewed by Claude AI. */
(function () {
    "use strict";

    // Global functions to clean and trim text
    const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
    const text = (el) => clean(el && el.textContent);

    /* TAG PICKER DROPDOWN
       The add/remove mechanism (hidden checkbox + :has()) in components.css
       Uses HTMLLIELEMENT interface and DOM Traversal to browse through tags
       Rules when option list is visible:
         - opens when the search field gets focus/is clicked /is typed in
         - filters options as you type
         - Enter picks the first match, ArrowDown/Up move through options
         - closes on Escape, outside click, or when focus leaves the picker*/
    function initTagPickers() {
        document.querySelectorAll(".tag-picker").forEach((picker, n) => {
            const search = picker.querySelector(".tag-search");
            const menu = picker.querySelector(".tag-menu");
            if (!search || !menu) return;

            menu.id = menu.id || "tag-menu-" + n;
            picker.classList.add("is-dropdown");
            search.setAttribute("aria-controls", menu.id);
            search.setAttribute("aria-haspopup", "true");
            search.setAttribute("autocomplete", "off");

            // Add items according to htmlli
            const items = () => Array.from(menu.querySelectorAll("li"));
            const visibleBoxes = () =>
                items().filter((li) => !li.hidden).map((li) => li.querySelector(".tag-checkbox"));

            // Filter tags based on given (search)
            function filter() {
                const term = search.value.trim().toLowerCase();
                let any = false;
                items().forEach((li) => {
                    const match = !term || text(li.querySelector(".tag-option")).toLowerCase().includes(term);
                    li.hidden = !match;
                    if (match) any = true;
                });
                menu.classList.toggle("tag-menu-empty", !any);
            }

            // Expand/close
            function open() {
                menu.hidden = false;
                search.setAttribute("aria-expanded", "true");
            }
            function close() {
                menu.hidden = true;
                search.setAttribute("aria-expanded", "false");
                search.value = "";
                filter();
            }
            close();

            // Keyboard controls
            search.addEventListener("focus", open);
            search.addEventListener("click", open);
            search.addEventListener("input", () => { open(); filter(); });
            search.addEventListener("keydown", (e) => {
                if (e.key === "Escape") { close(); search.blur(); }
                else if (e.key === "ArrowDown") {
                    e.preventDefault(); open();
                    const first = visibleBoxes()[0];
                    if (first) {
                        first.focus();
                    }
                }
                else if (e.key === "Enter") {
                    e.preventDefault();
                    const first = visibleBoxes()[0];
                    if (first) { // toggles the tag, menu stays open
                        first.click();
                    }
                }
            });
            menu.addEventListener("keydown", (e) => {
                const boxes = visibleBoxes();
                const i = boxes.indexOf(document.activeElement);
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    (boxes[i + 1] || boxes[0]).focus();
                }
                else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (i <= 0) {
                        search.focus();
                    }
                    else {
                        boxes[i - 1].focus();
                    }
                }
                else if (e.key === "Enter" && i >= 0) {
                    e.preventDefault(); boxes[i].click();
                }
                else if (e.key === "Escape") {
                    search.focus(); close();
                }
            });

            /* Listener band-aid fixes: click would close the menu before the click registers. */
            menu.addEventListener("mousedown", (e) => e.preventDefault());
            picker.addEventListener("focusout", (e) => {
                if (!picker.contains(e.relatedTarget)) {
                    close();
                }
            });
            document.addEventListener("mousedown", (e) => {
                if (!picker.contains(e.target)) {
                    close();
                }
            });
        });
    }

    /* SIMULATED SEARCH
       The search takes in and filters and ranks the related items as you type.
         - Matches are ordered best-first using CSS `order`:
             1. title starts with the first word
             2. title contains all words
             3. only the extra fields match.
         - A no results screen is shown when nothing matches.
         - data-prefill-from-url on the input pre-fills it from ?q=... so the
           home page search (GET request to library.html?q=...) works on the list.
         - Middle search bar automatically searches into the library page,
           - Adds keyboard controls such as enter for searching through keybind
         - UNFINISHED permissions page search
           - TODO: make match either the dropdown or the main simulated search


           PAGING ELEMENTS
         - Logic handled by pagination.js library
         - Entries are split into pages, navigated by a < [page] > navigator below
            */
    function initSearch() {
        document.querySelectorAll("[data-filter-target]").forEach((input) => {
            const list = document.querySelector(input.getAttribute("data-filter-target"));
            if (!list) return;

            // No results found
            const empty = list.parentElement.querySelector(".no-results");
            // Cleaning input, convert to objects for use
            const records = Array.from(list.children)
                .filter((el) => !el.classList.contains("no-results"))
                .map((el, index) => {
                    const nameEl = el.querySelector(".username");
                    const avatarEl = el.querySelector(".avatar");
                    // clean to reduce case-sensitivity, order start with title, then extra searchable fields
                    const title = clean(el.dataset.title).toLowerCase();
                    const extra = clean([el.dataset.subjects, el.dataset.author, avatarEl && text(avatarEl)]
                        .filter(Boolean).join(" ")).toLowerCase();
                    return { el, index, title, extra };
                });

            // DOES NOT CURRENTLY FUNCTION, meant to link directly to a textbook
            // TODO: when textbooks get their own page urls
            const usesUrl = input.hasAttribute("data-prefill-from-url");
            function syncUrl(value) {
                if (!usesUrl || !window.history.replaceState) return;
                try {
                    const url = new URL(window.location.href);
                    if (value) url.searchParams.set(input.name || "q", value);
                    else url.searchParams.delete(input.name || "q");
                    window.history.replaceState(null, "", url);
                } catch (err) { /* e.g. file:// restrictions: safe to ignore */ }
            }

            /* PAGE NAVIGATION, using pagination.js
            * TODO: Formatting not working as intended, showing 7 then 9 options, fix later */
            const pageSize = parseInt(list.getAttribute("data-page-size"), 10) || 0;
            let page = 1;
            let pager = null;

            if (pageSize) {
                pager = document.createElement("nav");
                pager.className = "pagination";
                pager.setAttribute("aria-label", "More textbooks");
                list.after(pager);
            }

            function apply() {
                const value = input.value.trim();
                const terms = value.toLowerCase().split(/\s+/).filter(Boolean);
                let matches;

                // If search is empty, show all items still
                if (!terms.length) {
                    matches = records.slice();
                    records.forEach((r) => { r.el.style.order = ""; });
                    syncUrl("");
                }
                // search each record and push all matches
                else {
                    matches = [];
                    records.forEach((r) => {
                        const haystack = r.title + " " + r.extra;
                        if (!terms.every((t) => haystack.includes(t))) {
                            return;
                        }
                        const titleHit = terms.every((t) => r.title.includes(t));
                        r.score = r.title.startsWith(terms[0]) && titleHit ? 0 : titleHit ? 1 : 2;
                        matches.push(r);
                    });
                    matches.sort((a, b) => a.score - b.score || a.index - b.index)
                        .forEach((r, rank) => { r.el.style.order = String(rank); });
                    syncUrl(value);
                }


                // if the list has another page, add matches
                if (pager) {
                    $(pager).pagination({
                        dataSource: matches,
                        pageSize: pageSize,

                        // show matches
                        callback: function (data, pagination) {
                            page = pagination.pageNumber;

                            const shown = new Set(data);

                            records.forEach((r) => {
                                r.el.hidden = !shown.has(r);
                            });

                            // if there's no matches left
                            if (empty) {
                                empty.hidden = matches.length > 0;
                            }
                        }
                    });
                }
                else {
                    records.forEach((r) => {
                        r.el.hidden = false;
                    });

                    if (empty) {
                        empty.hidden = matches.length > 0;
                    }
                }
            }

            // TODO: URL search feature not working yet
            if (usesUrl) {
                const q = new URLSearchParams(window.location.search).get(input.name || "q");
                if (q && !input.value) {
                    input.value = q;
                }
            }

            input.addEventListener("input", () => { page = 1; apply(); });

            const form = input.closest("form");
            if (form) {
                form.addEventListener("submit", (e) => {
                    let samePage = true;
                    try {
                        samePage = new URL(form.action, window.location.href).pathname === window.location.pathname;
                    }
                    catch (err) { /* treat as same page */ }
                    if (samePage) { e.preventDefault(); page = 1; apply(); }
                });
            }

            // TEMPORARY ONE-PAGE person permissions
            // TODO: I'm not sure what this should look like yet, placeholder old code will fix to support dropdown or paging?
            const row = input.closest(".permissions-search-row");
            const browse = row && row.querySelector(".browse-btn");
            if (browse) {
                browse.addEventListener("click", (e) => {
                    e.preventDefault();
                    input.value = "";
                    page = 1;
                    apply();
                    input.focus();
                });
            }

            apply();
        });
    }

    /* PLACEHOLDER PEOPLE LIST  (permissions.html)
    * Functional: Contains listeners to the dataset of people
    * Examine this function later for the final revision */
    function initPeople() {
        const list = document.getElementById("people-list");
        if (!list) {
            return;
        }
        list.addEventListener("click", (e) => {
            const add = e.target.closest(".add-btn");
            const remove = e.target.closest(".remove-btn");
            const button = add || remove;
            const row = button && button.closest(".person-row");
            if (!row) {
                return;
            }
            row.dataset.access = add ? "view" : "none";
            row.querySelector('input[value="view"]').checked = true;
            const next = add ? row.querySelector("input:checked") : row.querySelector(".add-btn");
            if (next) {
                next.focus();
            }
        });
    }

    /* SAVE BUTTONS  (details.html)
    * Saving details
    * Saves to browser storage, currently just a placeholder */
    function initSaveButtons() {
        document.querySelectorAll(".save-btn[aria-controls]").forEach((btn) => {
            const field = document.getElementById(btn.getAttribute("aria-controls"));
            const status = btn.parentElement.querySelector(".save-status");
            if (!field) return;
            const key = "stacks.details." + (field.name || field.id);
            let timer = null;

            try {
                const saved = window.localStorage.getItem(key);
                if (saved !== null) {
                    field.value = saved;
                }
            } catch (err) { /* storage blocked: keep the default text */ }

            btn.addEventListener("click", () => {
                let ok = true;
                try {
                    window.localStorage.setItem(key, field.value);
                } catch (err) {
                    ok = false;
                }
                if (status) {
                    status.textContent = ok ? "\u2713 Saved" : "Couldn\u2019t save (browser storage is blocked)";
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        status.textContent = "";
                        }, 2200);
                }
            });
        });
    }

    /* CONFIRMATION DIALOGS
    Currently inside details (Delete), and upload (upload, cancel)
    Primarily uses event delegation by adding listeners attached to the document.
    Handled by the SweetAlerts2 library*/
    function initConfirmDialogs() {
        // delegates this task to finding elements matching data-confirm
        document.addEventListener("click", (e) => {
            const opener = e.target.closest("[data-confirm]");
            if (!opener) {
                return;
            }

            e.preventDefault();

            // Final destination (should go to library with current use cases)
            const destination =
                opener.dataset.confirmHref ||
                opener.getAttribute("href") ||
                "library.html";

            Swal.fire({
                title: opener.dataset.confirmTitle || "Are you sure?",
                text: opener.dataset.confirmMessage || "",
                icon: opener.dataset.confirmTone === "danger" ? "warning" : undefined,

                // Cancel button
                showCancelButton: true,
                // Confirm button
                confirmButtonText: opener.dataset.confirmYes || "Yes",
                cancelButtonText: opener.dataset.confirmNo || "Go back",

                confirmButtonColor:
                    opener.dataset.confirmTone === "danger"
                        ? "#d33"
                        : undefined,

                reverseButtons: true,
                focusCancel: true,

                allowOutsideClick: true,
                allowEscapeKey: true
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = destination;
                }
            });
        });
    }

    /* HELP LINKS  (all pages)
       - The footer "Help?" button always points at the help section for the page
       you are on
       - Scrolls to the relevant help section
       */
    const HELP_TOPICS = ["login", "home", "library", "details", "upload", "permissions", "reader", "search"];

    function initHelp() {
        const name = window.location.pathname.split("/").pop().replace(/\.html$/, "") || "home";

        if (name === "help") {
            const scrollToHash = () => {
                const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
                if (target) {
                    target.scrollIntoView({ block: "start" });
                }
                document.querySelectorAll(".help-toc a").forEach((a) => {
                    if (a.getAttribute("href") === window.location.hash) {
                        a.setAttribute("aria-current", "true");
                    }
                    else a.removeAttribute("aria-current");
                });
            };
            window.addEventListener("load", scrollToHash);
            window.addEventListener("hashchange", scrollToHash);
            return;
        }


        const topic = HELP_TOPICS.indexOf(name) !== -1 ? name : "general";
        document.querySelectorAll(".footer-help").forEach((a) => {
            a.setAttribute("href", "help.html#help-" + topic);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        initHelp();
        initSaveButtons();
        initConfirmDialogs();
        initPeople();
        initTagPickers();
        initSearch();
    });
})();