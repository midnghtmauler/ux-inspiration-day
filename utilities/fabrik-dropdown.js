/* =============================================================================
   Fabrik — Dropdown host
   Requires: nothing (vanilla, no deps). Link once per page that opens menus
   from a trigger (sorting panel, chips, later blocks), next to
   utilities/fabrik-tooltip.js. The consuming page links it, never an injected
   block (injectBlock() does not transfer <script src>). One delegated listener
   set on document: no per-element wiring, no ids, so markup added or moved later
   (e.g. into a side sheet) works as is.

   MARKUP CONTRACT
     <div data-dropdown [data-dropdown-keep-open]>      wrapper; the host adds .is-open
       <button data-dropdown-trigger …>                 a real button; the host keeps
         <span data-dropdown-value>Relevance</span>       aria-expanded, sets aria-haspopup="menu"
       </button>                                          if missing
       <div class="menu" data-dropdown-panel …>…</div>  the Menu root
     </div>
   - data-dropdown-keep-open (on the wrapper): the menu stays open after an item
     is activated (multi-select).
   - [data-dropdown-value] (inside the trigger): the element whose text the host
     updates in single-select mode. If the trigger's aria-label contains the old
     text, it is replaced with the new one.
   - Markup with .is-open but without data-dropdown is a static showcase and is
     never touched.

   OPEN STATE OF THE TRIGGER
   - While the menu is open the host keeps aria-expanded="true" on the trigger ("false"
     again on close). That attribute is the one and only Open signal: no class. Any
     component styles it for itself (chip.css, sorting-panel.css); Open is not :active,
     which means the mouse button is down.

   INPUT MODALITY
   - The host sets data-input-modality on <html>: "pointer" on any pointerdown (mouse,
     touch, pen), "keyboard" on any keydown except Shift, Control, Alt, Meta and CapsLock
     alone. No attribute before the first interaction. chip.css and button.css turn the
     :focus-visible ring (and the chip's focus border) off while it is "pointer", so a
     focus() the script makes after a click (Safari treats the initial modality as
     keyboard) never shows a ring; Tab, Enter, Space and Escape set "keyboard" and the
     ring shows. Both listeners are capture-phase on document and registered before any
     other listener of this file, so the first pointerdown after load sets the attribute
     before the browser moves focus and before the click handler runs. Registered once
     per page, even if the file is linked twice. A page with chips or menus that open
     links this file, which also provides the attribute.

   BEHAVIOUR
   - Click on the trigger toggles; a click outside closes; opening one closes any
     other open dropdown. "Inside" means inside the trigger or inside the panel of
     that dropdown, nothing else: the rest of the wrapper (e.g. the count text and the
     empty area of a toolbar row that wraps the trigger) counts as outside. Clicking
     another dropdown's trigger closes this one and opens that one in the same click.
   - Escape closes and returns focus to the trigger (it stops propagating, so an
     enclosing side sheet / overlay stays open). Tab closes; focus moves on
     normally.
   - Opened by mouse: focus stays on the trigger, no ring (the ring comes only
     from :focus-visible). Opened by keyboard (Enter, Space, ArrowDown on the
     trigger): focus moves to the item with aria-checked="true", else the first
     enabled item.
   - In the open menu: ArrowDown / ArrowUp move between visible, enabled items
     (wrapping), Home / End jump to first / last, Enter / Space click the focused
     item. Items are a roving tabindex (-1, the focused one 0). Hidden items,
     items with aria-disabled="true" or .is-disabled, and items of a nested
     submenu are skipped. In a text field inside the menu (search) only Escape,
     Tab and ArrowDown (first item) are handled.
   - Single-select (role="menuitemradio"): sets aria-checked="true" on the item
     and "false" on its siblings, keeps .is-selected (the Menu's selected look)
     in sync, copies the label into [data-dropdown-value], fires
     "fabrik-dropdown-select", closes and returns focus to the trigger.
   - role="menuitem": fires "fabrik-dropdown-select" and closes.
   - Multi-select (role="menuitemcheckbox"): the host only handles keyboard,
     focus and activation. The consumer's script changes the selection (a plain
     click listener; do not also bind Enter / Space on the items — the host
     already turns them into clicks). The menu closes after activation unless
     data-dropdown-keep-open is set.

   - data-dropdown-close (on any element inside the panel, e.g. the title row's close
     button or the Menu footer's button): a click on it closes the menu and returns
     focus to the trigger, in dropdown and sheet mode alike.

   SHEET MODE (opt-in; below 1024px the Menu opens as a bottom sheet)
     <div data-dropdown data-dropdown-sheet [="(max-width: 1023px)"] data-dropdown-title="Sort by">
   - data-dropdown-sheet (wrapper): opt in. The value is an optional media query;
     default "(max-width: 1023px)", the Menu's own breakpoint. It is evaluated at
     OPENING only (click or key), never while the menu is open.
   - data-dropdown-title (wrapper, optional): written into the Menu's .menu-title-label
     and used as the panel's aria-label while the sheet is open. Without it the Menu keeps
     its own aria-label and needs no title row: the sheet is then the list only.
   - There is no separate bottom-sheet block: the Menu's own sheet layout (.menu--sheet)
     is the design. The panel must be the .menu element itself (data-dropdown-panel on
     .menu); otherwise the dropdown stays a dropdown. The Menu may carry a
     .menu-title-row whose close button has data-dropdown-close (add
     .menu--title-sheet-only to keep that row out of the dropdown look); a sheet without
     it closes by scrim click, Escape, a single-select pick or the trigger. Give the
     footer button (multi-select) data-dropdown-close.
   - REQUIRES the page to also link utilities/fabrik-overlay.css and
     utilities/fabrik-overlay.js (the host never injects them). The host passes the
     panel to Fabrik.overlay.open(panel): the foundation owns scrim, scroll lock, the
     Tab trap, Escape, scrim click, the move of the panel to the end of <body> (never a
     clone) and its restoration on close, and the panel's z-index. The Menu's CSS
     (menu.css) owns the fixed bottom placement and the slide motion, keyed to the
     foundation's classes.
   - While open the host adds .menu--sheet to the panel (forced sheet look, so the
     layout holds if the window grows past 1024px meanwhile) and removes a forced
     .menu--dropdown; both are put back once the panel is home again. The wrapper
     gets .is-open as always plus .is-sheet: the panel is no longer inside the wrapper,
     so a consumer hides its (now empty) menu wrapper with .is-open:not(.is-sheet).
   - FALLBACKS (no errors): the overlay files are not linked, the panel is not a .menu,
     or Fabrik.overlay.open() returns false (another overlay is open, e.g. the trigger
     sits inside a side sheet) -> the normal dropdown opens. Opening again while the
     previous sheet of the same dropdown is still animating out is ignored.
   - FOCUS: opened by keyboard, the selected (else first enabled) item is focused;
     opened by mouse or touch, the panel itself is focused (tabindex -1, no ring), so
     ArrowUp / ArrowDown / Home / End then work as in the dropdown. Tab is trapped by
     the foundation (the host does not close on Tab in a sheet).
   - CLOSING: scrim click and Escape are handled by the foundation; the host follows by
     watching the panel's overlay classes and restores state, fires
     fabrik-dropdown-close and returns focus to the trigger. The close button and the
     footer button (data-dropdown-close), a single-select pick (also sets the value
     and fires fabrik-dropdown-select) and a second click on the trigger call
     Fabrik.overlay.close(panel). With data-dropdown-keep-open an item activation does
     not close.
   - NOT IN V1: no drag handle, no swipe, no History API handling (browser Back does not
     close it), and no live swap when the window crosses 1024px while open: the sheet
     stays as it is and the next opening uses the then-current mode.

   EVENTS (bubble, dispatched on the wrapper)
     fabrik-dropdown-open
     fabrik-dropdown-close
     fabrik-dropdown-select   detail: { item, label }

   MUST NOT
   - Position the menu or choose its look (sorting-panel.css and each consumer own
     dropdown placement and z-index; the Menu owns dropdown vs sheet, including the
     sheet's placement and motion).
   - Implement selection logic for multi-select.
   - Reimplement the scrim, focus trap or scroll lock (Fabrik.overlay does).
   ============================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.__fabrikInputModality) {
    root.__fabrikInputModality = true;
    var MODIFIER_KEYS = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'];
    document.addEventListener('pointerdown', function () {
      root.setAttribute('data-input-modality', 'pointer');
    }, true);
    document.addEventListener('keydown', function (e) {
      if (MODIFIER_KEYS.indexOf(e.key) === -1) root.setAttribute('data-input-modality', 'keyboard');
    }, true);
  }

  var WRAP = '[data-dropdown]';
  var ITEM = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';
  var TEXT_FIELD = 'input, textarea, select, [contenteditable]';
  var SHEET_QUERY = '(max-width: 1023px)';
  var OVERLAY_OPEN = 'fabrik-overlay-panel--open';
  var OVERLAY_CLOSING = 'fabrik-overlay-panel--closing';

  // The one dropdown whose panel is on the overlay foundation, from opening until the
  // panel is back in its wrapper. Only one overlay can be open, so one record is enough.
  var sheet = null;

  function triggerOf(w) { return w.querySelector('[data-dropdown-trigger]'); }
  function panelOf(w) { return sheet && sheet.wrap === w ? sheet.panel : w.querySelector('[data-dropdown-panel]'); }
  function isOpen(w) { return w.classList.contains('is-open'); }
  function isSheet(w) { return !!sheet && sheet.wrap === w; }

  // The wrapper an element belongs to, also for a panel that was moved to <body>.
  function wrapOf(el) {
    return el.closest(WRAP) || (sheet && sheet.panel.contains(el) ? sheet.wrap : null);
  }

  function isEnabled(item) {
    return item.getAttribute('aria-disabled') !== 'true' && !item.classList.contains('is-disabled');
  }

  function enabledItems(w) {
    var panel = panelOf(w);
    if (!panel) return [];
    var root = panel.matches('.menu') ? panel : (panel.querySelector('.menu') || panel);
    return Array.prototype.filter.call(panel.querySelectorAll(ITEM), function (item) {
      var menu = item.parentElement.closest('.menu');
      return (menu === root || (!menu && root === panel)) &&
        isEnabled(item) && item.getClientRects().length > 0;
    });
  }

  function labelOf(item) {
    var el = item.querySelector('.menu-item-label, .checkbox-label') || item;
    return el.textContent.replace(/\s+/g, ' ').trim();
  }

  function focusItem(w, item) {
    var all = panelOf(w).querySelectorAll(ITEM);
    for (var i = 0; i < all.length; i++) all[i].setAttribute('tabindex', '-1');
    item.setAttribute('tabindex', '0');
    item.focus();
  }

  function emit(w, name, detail) {
    w.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail || {} }));
  }

  function overlayApi() {
    var api = window.Fabrik && window.Fabrik.overlay;
    return api && typeof api.open === 'function' && typeof api.close === 'function' ? api : null;
  }

  function wantsSheet(w, panel) {
    if (!w.hasAttribute('data-dropdown-sheet') || !panel.classList.contains('menu')) return false;
    var query = w.getAttribute('data-dropdown-sheet').trim() || SHEET_QUERY;
    return window.matchMedia(query).matches;
  }

  function restoreMenu(rec) {
    var p = rec.panel;
    p.classList.remove('menu--sheet');
    if (rec.hadDropdown) p.classList.add('menu--dropdown');
    if (!rec.hadTabindex) p.removeAttribute('tabindex');
    if (rec.titled) {
      if (rec.ariaLabel === null) p.removeAttribute('aria-label');
      else p.setAttribute('aria-label', rec.ariaLabel);
    }
  }

  // Hands the panel to Fabrik.overlay. False means nothing changed and the caller opens a dropdown.
  function openSheet(w, trigger, panel) {
    var api = overlayApi();
    if (!api) return false;

    var title = w.getAttribute('data-dropdown-title');
    var rec = {
      wrap: w,
      panel: panel,
      closed: false,
      hadDropdown: panel.classList.contains('menu--dropdown'),
      hadTabindex: panel.hasAttribute('tabindex'),
      titled: !!title,
      ariaLabel: panel.getAttribute('aria-label'),
      observer: null,
    };

    panel.classList.remove('menu--dropdown');
    panel.classList.add('menu--sheet');
    if (!rec.hadTabindex) panel.setAttribute('tabindex', '-1');
    if (title) {
      var label = panel.querySelector('.menu-title-label');
      if (label) label.textContent = title;
      panel.setAttribute('aria-label', title);
    }

    // The foundation returns focus to whatever is focused now: make that the trigger (Safari does not focus buttons on click).
    trigger.focus({ preventScroll: true });
    if (!api.open(panel)) {
      restoreMenu(rec);
      return false;
    }

    sheet = rec;
    // Escape and scrim click close the overlay without the host: follow its classes.
    rec.observer = new MutationObserver(function () {
      var cl = panel.classList;
      if (cl.contains(OVERLAY_CLOSING)) settleSheet(rec);
      if (!cl.contains(OVERLAY_OPEN)) {
        settleSheet(rec);
        releaseSheet(rec);
      }
    });
    rec.observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
    return true;
  }

  // State half of closing a sheet; the panel is still animating out of the page.
  function settleSheet(rec) {
    if (rec.closed) return;
    rec.closed = true;
    var w = rec.wrap;
    var trigger = triggerOf(w);
    w.classList.remove('is-open', 'is-sheet');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
    emit(w, 'fabrik-dropdown-close');
  }

  // The panel is back in its wrapper: only now does the Menu leave the forced sheet look.
  function releaseSheet(rec) {
    rec.observer.disconnect();
    restoreMenu(rec);
    if (sheet === rec) sheet = null;
  }

  function closeSheet(rec) {
    settleSheet(rec);
    var api = overlayApi();
    if (api && !rec.panel.classList.contains(OVERLAY_CLOSING)) api.close(rec.panel);
  }

  function close(w, returnFocus) {
    if (!isOpen(w)) return;
    if (isSheet(w)) {
      closeSheet(sheet);
      return;
    }
    var trigger = triggerOf(w);
    w.classList.remove('is-open');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) trigger.focus();
    }
    emit(w, 'fabrik-dropdown-close');
  }

  function open(w, byKeyboard) {
    var trigger = triggerOf(w);
    var panel = panelOf(w);
    if (!trigger || !panel) return;
    var wasOpen = isOpen(w);
    if (!wasOpen && isSheet(w)) return; // its previous sheet is still animating out
    if (!wasOpen) {
      var others = document.querySelectorAll(WRAP + '.is-open');
      for (var i = 0; i < others.length; i++) close(others[i], false);
      var asSheet = wantsSheet(w, panel) && openSheet(w, trigger, panel);
      w.classList.add('is-open');
      if (asSheet) w.classList.add('is-sheet');
      trigger.setAttribute('aria-expanded', 'true');
      if (!trigger.hasAttribute('aria-haspopup')) trigger.setAttribute('aria-haspopup', 'menu');
    }
    var items = enabledItems(w);
    for (var j = 0; j < items.length; j++) items[j].setAttribute('tabindex', '-1');
    var target = items.filter(function (it) { return it.getAttribute('aria-checked') === 'true'; })[0] || items[0];
    if (byKeyboard) {
      if (target) focusItem(w, target);
      else if (isSheet(w)) panel.focus({ preventScroll: true });
    } else if (isSheet(w)) {
      panel.focus({ preventScroll: true }); // no ring: mouse focus is not :focus-visible
    } else if (document.activeElement !== trigger) {
      trigger.focus({ preventScroll: true });
    }
    if (!wasOpen) emit(w, 'fabrik-dropdown-open');
  }

  function activate(w, item) {
    var role = item.getAttribute('role');
    if (role === 'menuitemradio') {
      var scope = item.closest('.menu-list') || item.parentElement;
      scope.querySelectorAll('[role="menuitemradio"]').forEach(function (sibling) {
        sibling.setAttribute('aria-checked', 'false');
        sibling.classList.remove('is-selected');
      });
      item.setAttribute('aria-checked', 'true');
      item.classList.add('is-selected');
      var label = labelOf(item);
      var value = w.querySelector('[data-dropdown-value]');
      if (value) {
        var previous = value.textContent.trim();
        value.textContent = label;
        var trigger = triggerOf(w);
        var aria = trigger && trigger.getAttribute('aria-label');
        if (aria && previous && aria.indexOf(previous) !== -1) {
          trigger.setAttribute('aria-label', aria.replace(previous, label));
        }
      }
      emit(w, 'fabrik-dropdown-select', { item: item, label: label });
    } else if (role === 'menuitem') {
      emit(w, 'fabrik-dropdown-select', { item: item, label: labelOf(item) });
    }
    if (!w.hasAttribute('data-dropdown-keep-open')) close(w, true);
  }

  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;

    var trigger = target.closest('[data-dropdown-trigger]');
    var wrap = trigger && trigger.closest(WRAP);
    if (wrap) {
      if (trigger.getAttribute('aria-disabled') === 'true') return;
      // A keyboard (or assistive-technology) click has detail 0; a real mouse click has 1 or more.
      if (isOpen(wrap)) close(wrap, false);
      else open(wrap, e.detail === 0);
      return;
    }

    var closer = target.closest('[data-dropdown-close]');
    var closerWrap = closer && closer.closest('[data-dropdown-panel]') && wrapOf(closer);
    if (closerWrap && isOpen(closerWrap)) {
      close(closerWrap, true);
      return;
    }

    var item = target.closest(ITEM);
    var itemWrap = item && wrapOf(item);
    if (itemWrap && isOpen(itemWrap) && item.closest('[data-dropdown-panel]') && isEnabled(item)) {
      activate(itemWrap, item);
    }

    // Inside = inside this dropdown's trigger or panel. The path is taken at dispatch, so an
    // element a click handler removed from the page still counts as inside its old parents.
    var path = e.composedPath ? e.composedPath() : [];
    var openOnes = document.querySelectorAll(WRAP + '.is-open');
    for (var i = 0; i < openOnes.length; i++) {
      if (isSheet(openOnes[i])) continue; // scrim click: the foundation closes it, see openSheet()
      var ownTrigger = triggerOf(openOnes[i]);
      var ownPanel = panelOf(openOnes[i]);
      var inside = path.indexOf(ownTrigger) !== -1 || path.indexOf(ownPanel) !== -1 ||
        (!path.length && ((ownTrigger && ownTrigger.contains(target)) || (ownPanel && ownPanel.contains(target))));
      if (!inside) close(openOnes[i], false);
    }
  });

  // Capture phase so Escape can be stopped before an enclosing overlay's own handler sees it.
  document.addEventListener('keydown', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    var wrap = wrapOf(target);
    if (wrap && !isOpen(wrap)) wrap = null;

    if (e.key === 'Escape') {
      var escWrap = wrap || (target === document.body ? document.querySelector(WRAP + '.is-open') : null);
      if (!escWrap) return;
      if (isSheet(escWrap)) return; // the foundation closes it and the host follows; closing here too would close twice
      e.stopPropagation();
      e.preventDefault();
      close(escWrap, true);
      return;
    }

    if (e.key === 'Tab') {
      if (wrap && !isSheet(wrap)) close(wrap, false); // a sheet's Tab trap belongs to the foundation
      return;
    }

    if (e.key === 'ArrowDown') {
      var trigger = target.closest('[data-dropdown-trigger]');
      var triggerWrap = trigger && trigger.closest(WRAP);
      if (triggerWrap) {
        e.preventDefault();
        open(triggerWrap, true);
        return;
      }
    }

    if (!wrap || !target.closest('[data-dropdown-panel]')) return;

    if (target.closest(TEXT_FIELD)) {
      if (e.key === 'ArrowDown') {
        var first = enabledItems(wrap)[0];
        if (first) {
          e.preventDefault();
          focusItem(wrap, first);
        }
      }
      return;
    }

    var item = target.closest(ITEM);
    if (!item) {
      // Focus on the panel itself (mouse-opened sheet): the arrow keys pick the entry item.
      if (target !== panelOf(wrap)) return;
      var all = enabledItems(wrap);
      var entry = null;
      if (e.key === 'ArrowDown') entry = all.filter(function (it) { return it.getAttribute('aria-checked') === 'true'; })[0] || all[0];
      else if (e.key === 'ArrowUp' || e.key === 'End') entry = all[all.length - 1];
      else if (e.key === 'Home') entry = all[0];
      else return;
      e.preventDefault();
      if (entry) focusItem(wrap, entry);
      return;
    }

    var items = enabledItems(wrap);
    var index = items.indexOf(item);
    var next = null;
    if (e.key === 'ArrowDown') next = items[(index + 1) % items.length];
    else if (e.key === 'ArrowUp') next = items[(index < 1 ? items.length : index) - 1];
    else if (e.key === 'Home') next = items[0];
    else if (e.key === 'End') next = items[items.length - 1];
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!e.repeat) item.click();
      return;
    } else return;

    e.preventDefault();
    if (next) focusItem(wrap, next);
  }, true);
})();
