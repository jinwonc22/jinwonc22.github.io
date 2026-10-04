/* Placeholder Simulated Search
   The keyphrase typed into the header search form is read from the URL (?q=...) and "simulates" a search
   by adding results based on specific words ("textbook", and "test")
   AI DISCLOSURE: Formatting/boilerplate by Anima, debugged and reviewed by Claude AI. */
(function () {
    "use strict";

    // Get the submitted search query string
    var params = new URLSearchParams(window.location.search);
    var submitted = (params.get("q") || "").trim();
    var keyphrase = submitted.toLowerCase();

    // Keep the typed phrase in the header search box, can be stored for the browse button
    var box = document.getElementById("header-q");
    if (box) {
        box.value = submitted;
    }

    var summary = document.getElementById("search-summary");
    var list = document.getElementById("search-results");
    var empty = document.getElementById("search-empty");
    var emptyHeading = document.getElementById("empty-heading");
    var emptyHint = document.getElementById("empty-hint");

    // Decide which simulated results (if any) match the keyphrase.
    // TODO: implement proper functionality later, it works for now as it does read the keyphrase
    var results = [];
    switch (keyphrase) {
        case "textbook":
            results = [
                { title: "Placeholder Title1, #th Edition", author: "John Doe", blurb: "Blurb 1" },
                { title: "Placeholder Title2, #th Edition", author: "Jane Doe", blurb: "Blurb 2" },
                { title: "Placeholder Title3, #th Edition", author: "Anonymous", blurb: "Blurb 3" }
            ];
            break;
        case "test":
            results = [
                { title: "Placeholder Title4, #th Edition", author: "John Doe, Jane Doe", blurb: "Blurb 4" },
                { title: "Placeholder Title5, #th Edition", author: "Test", blurb: "Blurb 5" }
            ];
            break;
        default:
            results = [];
    }
    // If the search bar is completely empty or the user just clicked the search button:
    if (submitted === "") {
        // Turn result into helper message instead
        summary.textContent = "";
        emptyHeading.textContent = "What are you looking for?";
        emptyHint.textContent = "Type a word into the search box above and press Search. Try \u201Ctextbook or test\u201D.";
        empty.hidden = false;
    }

    // Show results.
    else if (results.length > 0) {
        summary.textContent = "Found " + results.length + (results.length === 1 ? " result" : " results") +
            " for \u201C" + submitted + "\u201D.";
        results.forEach(function (r) {
            var li = document.createElement("li");

            var h2 = document.createElement("h2");
            var a = document.createElement("a");
            a.href = "details.html";
            a.textContent = r.title;
            h2.appendChild(a);

            var meta = document.createElement("p");
            meta.className = "result-meta";
            meta.textContent = "by " + r.author;

            var blurb = document.createElement("p");
            blurb.className = "result-blurb";
            blurb.textContent = r.blurb;

            li.appendChild(h2);
            li.appendChild(meta);
            li.appendChild(blurb);
            list.appendChild(li);
        });
    }
    else {
        summary.textContent = "";
        emptyHeading.textContent = "Sorry, we couldn\u2019t find anything for \u201C" + submitted + "\u201D.";
        emptyHint.textContent = "Check your spelling, or try a different word. \u201CBiology\u201D is a good one to start with.";
        empty.hidden = false;
    }

    document.title = "Search: " + (submitted || "everything") + " \u00B7 Stacks";
})();