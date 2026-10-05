/* Tooltips
   Hover over an element to bring up a tooltip on what that element does
   Logic handled by the Tippy library*/
(function ($) {
    "use strict";

    /* TOOLTIP MESSAGES TODO: Add more messages specific to navigations and editing details */

    var TOOLTIP_MESSAGES = {
        ".brand": "Go to the home page",
        ".sign-out": "Sign out of your account",
        ".header-search-btn": "Search for a textbook",
        ".search-field": "Search for a textbook",

        ".home-nav-link": "Open this section",
        ".textbook-card": "Open this textbook",

        ".theme-dark": "Switch to dark mode",
        ".theme-light": "Switch to light mode",
        ".footer-help": "Open the help section",

        ".sidebar-toggle-btn": "Open or close the sidebar",
        ".library-heading-row .edit-btn": "Edit this library",
        ".library-search-row .browse-btn": "Search this library",
        ".add-library-btn": "Add another library",

        ".cover-box": "Open this textbook in the reader",
        ".open-btn": "Open this textbook in the reader",
        ".change-cover-btn": "Choose a new cover image",
        ".save-btn": "Save your changes",
        ".delete-btn": "Delete this textbook",

        ".tag-search": "Search subject tags",
        ".tag-option": "Add or remove this subject tag",
        ".tag-chip": "Subject tag",

        ".attach-zone": "Drag a textbook file here",
        ".browse-file-btn": "Choose a textbook file",
        ".upload-btn": "Upload this textbook",
        ".cancel-btn": "Cancel this upload"
    };


    /* TOOLTIPS */

    function initTooltips() {
        if (typeof window.tippy !== "function") {
            console.error("Tippy.js is NOT loaded.");
            return;
        }

        Object.keys(TOOLTIP_MESSAGES).forEach(function (selector) {
            var elements = document.querySelectorAll(selector);

            elements.forEach(function (element) {
                tippy(element, {
                    content: TOOLTIP_MESSAGES[selector],
                    delay: 350,
                    placement: "top",
                    arrow: true
                });
            });
        });

        console.log("Tippy tooltips initialized.");
    }


    /* SIDEBAR
    * TODO: FIX needed, does not fully work on all sidebar elements */

    function openSidebar($btn, $overlay) {
        var $backdrop = $("<div>", {
            "class": "sidebar-backdrop",
            "aria-hidden": "true"
        });

        $backdrop.on("click", function () {
            closeSidebar($btn, $overlay);
        });

        $overlay.prepend($backdrop);
        $overlay.prop("hidden", false);

        $btn
            .addClass("is-active")
            .attr("aria-expanded", "true");

        $("body").addClass("sidebar-open");

        $overlay
            .children(".overlay-panel")
            .find(".overlay-close")
            .trigger("focus");
    }


    function closeSidebar($btn, $overlay) {
        $overlay.children(".sidebar-backdrop").remove();

        $overlay.prop("hidden", true);

        $btn
            .removeClass("is-active")
            .attr("aria-expanded", "false")
            .trigger("focus");

        $("body").removeClass("sidebar-open");
    }


    function initSidebars() {
        $(".sidebar-toggle-btn").on("click", function () {
            var $btn = $(this);
            var $wrap = $btn.closest(".sidebar-wrap");
            var $overlay = $wrap.find(".overlay-sidebar");

            if ($overlay.prop("hidden")) {
                openSidebar($btn, $overlay);
            } else {
                closeSidebar($btn, $overlay);
            }
        });

        $(".overlay-close").on("click", function () {
            var $overlay = $(this).closest(".overlay-sidebar");

            var $btn = $overlay
                .closest(".sidebar-wrap")
                .find(".sidebar-toggle-btn");

            closeSidebar($btn, $overlay);
        });

        $(document).on("keydown", function (e) {
            if (e.key !== "Escape") {
                return;
            }

            $(".overlay-sidebar")
                .not("[hidden]")
                .each(function () {
                    var $overlay = $(this);

                    var $btn = $overlay
                        .closest(".sidebar-wrap")
                        .find(".sidebar-toggle-btn");

                    closeSidebar($btn, $overlay);
                });
        });
    }


    /* START */

    $(function () {
        console.log("app.js loaded.");
        initTooltips();
        initSidebars();
    });

})(window.jQuery);