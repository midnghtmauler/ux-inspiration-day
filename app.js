/*
  UX Team Inspiration Day — companion app logic.
  Hash-routed views (Agenda / Segment / Log / Summary), localStorage work log,
  full-screen launch with avatar selection, stepped missions (capture on
  exhibition tasks; workshop phases are browse-only — the afternoon is
  captured physically on sticky notes and the whiteboard), bottom-sheet
  note capture, Markdown + JSON export. No framework, no build step.
*/

(function () {
  'use strict';

  var STORAGE_KEY = 'uxday-log-v1';

  /* ---- Store ---------------------------------------------------------- */

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.entries)) return { name: parsed.name || '', entries: parsed.entries };
      }
    } catch (e) { /* corrupted storage: start clean */ }
    return { name: '', entries: [] };
  }

  var state = loadState();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* ---- Helpers ---------------------------------------------------------- */

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function icon(name, small) {
    return '<span class="ico' + (small ? ' ico--16' : '') + '" aria-hidden="true"><svg viewBox="0 0 24 24">' +
      (ICONS[name] || '') + '</svg></span>';
  }

  function segmentById(id) {
    for (var i = 0; i < SEGMENTS.length; i++) if (SEGMENTS[i].id === id) return SEGMENTS[i];
    return null;
  }

  function taskById(id) {
    for (var i = 0; i < SEGMENTS.length; i++) {
      var tasks = SEGMENTS[i].tasks || [];
      for (var j = 0; j < tasks.length; j++) if (tasks[j].id === id) return tasks[j];
    }
    return null;
  }

  function phaseById(id) {
    for (var i = 0; i < SEGMENTS.length; i++) {
      var phases = SEGMENTS[i].phases || [];
      for (var j = 0; j < phases.length; j++) if (phases[j].id === id) return phases[j];
    }
    return null;
  }

  function typeById(id) {
    for (var i = 0; i < ENTRY_TYPES.length; i++) if (ENTRY_TYPES[i].id === id) return ENTRY_TYPES[i];
    return null;
  }

  function toMinutes(hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function dayStatus() {
    var now = new Date();
    var iso = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    if (iso !== DAY.dateISO) return { isToday: false };
    var mins = now.getHours() * 60 + now.getMinutes();
    var current = null, next = null;
    for (var i = 0; i < SEGMENTS.length; i++) {
      var s = SEGMENTS[i];
      if (toMinutes(s.start) <= mins && mins < toMinutes(s.end)) current = s;
      else if (toMinutes(s.start) > mins && !next) next = s;
    }
    return { isToday: true, current: current, next: next };
  }

  /* The segment a new entry is attributed to; on the day it is the live
     segment, off-day the nearest one so logging always works. */
  function currentSegment(now) {
    now = now || new Date();
    var iso = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
    var mins = now.getHours() * 60 + now.getMinutes();
    if (iso === DAY.dateISO) {
      var live = null, upcoming = null;
      for (var i = 0; i < SEGMENTS.length; i++) {
        var s = SEGMENTS[i];
        if (toMinutes(s.start) <= mins && mins < toMinutes(s.end)) live = s;
        else if (toMinutes(s.start) > mins && !upcoming) upcoming = s;
      }
      return live || upcoming || SEGMENTS[SEGMENTS.length - 1];
    }
    var last = null, next = null;
    for (var j = 0; j < SEGMENTS.length; j++) {
      var t = SEGMENTS[j];
      if (toMinutes(t.start) <= mins) last = t;
      else { next = t; break; }
    }
    return last || next || SEGMENTS[0];
  }

  function entryCountForSegment(id) {
    return state.entries.filter(function (e) { return e.segmentId === id; }).length;
  }

  var TYPE_TAG_CLASS = {
    observation: 'tag tag-info',
    reference: 'tag tag-info',
    principle: 'tag tag-success',
    convention: 'tag tag-success',
    idea: 'tag tag-neutral',
    experiment: 'tag tag-neutral'
  };

  function tag(label, cls) {
    return '<span class="' + (cls || 'tag tag-neutral') + '">' + esc(label) + '</span>';
  }

  function personPhoto(name) {
    for (var i = 0; i < DAY.team.length; i++) if (DAY.team[i].name === name) return DAY.team[i].photo;
    return null;
  }

  /* ---- App bar & tab bar ------------------------------------------------ */

  function renderChrome(route) {
    var bar = document.getElementById('app-bar');
    var conf = {
      agenda: { title: DAY.title, subtitle: DAY.dateLabel + ' · ' + DAY.city },
      segment: { title: '', subtitle: '', back: true },
      log: { title: 'Work log', subtitle: state.name ? 'Logging as ' + state.name : 'Your capture space' },
      summary: { title: 'Day summary', subtitle: 'Deliverables and export' }
    }[route.name] || { title: DAY.title, subtitle: '' };

    if (route.name === 'segment') {
      var seg = segmentById(route.id);
      conf.title = seg ? seg.title : 'Segment';
      conf.subtitle = seg ? seg.timeLabel + ' · ' + seg.typeLabel : '';
      if (route.step !== null && route.step !== undefined && seg) {
        conf.backHref = '#/segment/' + seg.id;
        conf.backLabel = 'Overview';
      }
    }

    bar.innerHTML =
      '<div class="app-bar-inner">' +
      (conf.back
        ? '<a class="app-bar-back" href="' + (conf.backHref || '#/') + '" aria-label="Back">' + icon('arrow-left') + '<span>' + (conf.backLabel || 'Agenda') + '</span></a>'
        : '') +
      '<div class="app-bar-titles">' +
      '<span class="app-bar-title">' + esc(conf.title) + '</span>' +
      (conf.subtitle ? '<span class="app-bar-subtitle">' + esc(conf.subtitle) + '</span>' : '') +
      '</div>' +
      (state.name && personPhoto(state.name)
        ? '<a class="app-bar-person" href="#/summary" aria-label="Logged in as ' + esc(state.name) + ' — open day summary">' +
          '<img class="app-bar-avatar" src="' + personPhoto(state.name) + '" alt=""></a>'
        : '') +
      '</div>';

    var tabs = document.getElementById('tab-bar');
    var logCount = state.entries.length;
    tabs.innerHTML =
      '<nav class="tab-bar-inner" aria-label="App sections">' +
      tab('#/', 'calendar-empty', 'Agenda', route.name === 'agenda' || route.name === 'segment') +
      tab('#/log', 'document-annotation', 'Log', route.name === 'log', logCount) +
      tab('#/summary', 'document-check', 'Summary', route.name === 'summary') +
      '</nav>';

    function tab(href, ic, label, current, badge) {
      return '<a class="tab" href="' + href + '"' + (current ? ' aria-current="page"' : '') + '>' +
        '<span class="tab-icon-wrap">' + icon(ic) +
        (badge ? '<span class="tab-badge">' + badge + '</span>' : '') +
        '</span><span>' + label + '</span></a>';
    }
  }

  /* ---- Shared fragments -------------------------------------------------- */

  function locationCard(loc) {
    if (!loc) return '';
    /* The whole card is the Maps link — not just the arrow */
    return '<div class="group"><a class="location-card" href="' + loc.mapsUrl + '" target="_blank" rel="noopener" aria-label="Open ' + esc(loc.name) + ' in Maps">' +
      '<span class="location-icon">' + icon('location') + '</span>' +
      '<div class="location-main">' +
      '<div class="location-name">' + esc(loc.name) + '</div>' +
      '<div class="small muted">' + esc(loc.detail) + '</div>' +
      (loc.note ? '<div class="small muted">' + esc(loc.note) + '</div>' : '') +
      '</div>' +
      '<span class="location-maps" aria-hidden="true">' + icon('arrow-right') + '</span>' +
      '</a></div>';
  }

  function personPicker() {
    return DAY.team.map(function (p) {
      return '<label class="person-pick">' +
        '<input type="radio" name="pick-name" value="' + esc(p.name) + '"' + (state.name === p.name ? ' checked' : '') + '>' +
        '<img class="person-photo" src="' + p.photo + '" alt="" loading="lazy">' +
        '<span class="person-name">' + esc(p.name) + '</span>' +
        '</label>';
    }).join('');
  }

  function wirePersonPicker(root) {
    root.querySelectorAll('input[name="pick-name"]').forEach(function (r) {
      r.addEventListener('change', function () {
        state.name = r.value;
        save();
        render();
      });
    });
  }

  function addEntry(segmentId, type, text, taskId, photoTaken) {
    var now = new Date();
    state.entries.push({
      id: 'e' + now.getTime().toString(36),
      ts: now.toISOString(),
      time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
      segmentId: segmentId,
      taskId: taskId || null,
      type: type,
      text: text,
      photoTaken: !!photoTaken
    });
    save();
  }

  function removeEntry(id) {
    state.entries = state.entries.filter(function (e) { return e.id !== id; });
    save();
  }

  /* ---- First-launch onboarding ------------------------------------------- */
  /* Three pages: 1 select your avatar, 2 the day's mission, 3 how the day
     flows. Shown only while no name is stored; the name is kept in memory
     and persisted on "Start the day" so quitting midway never half-registers. */

  function renderLaunch() {
    if (state.name || document.getElementById('launch')) return;
    var picked = '';
    var launch = el(
      '<div class="launch" id="launch" role="dialog" aria-modal="true" aria-labelledby="launch-title">' +
      '<div class="launch-inner" id="launch-inner"></div></div>'
    );
    document.body.appendChild(launch);
    var inner = launch.querySelector('#launch-inner');

    function dots(n) {
      return '<div class="launch-dots" aria-hidden="true">' + [0, 1, 2].map(function (i) {
        return '<span class="step-dot' + (i === n ? ' is-current' : '') + '"></span>';
      }).join('') + '</div>';
    }

    function focusTitle() {
      var h = inner.querySelector('.launch-title');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
    }

    function finish() {
      state.name = picked;
      save();
      launch.remove();
      /* always land on the agenda after onboarding */
      if (location.hash && location.hash !== '#/') location.hash = '#/';
      render();
    }

    function pageAvatar() {
      inner.innerHTML =
        '<p class="launch-kicker">Beyond the Interface</p>' +
        '<h1 class="launch-title" id="launch-title">Select your avatar</h1>' +
        '<p class="launch-lead">Notes and photos you capture today are logged under your name — and stay on your device.</p>' +
        '<div class="person-grid" role="radiogroup" aria-label="Who are you?">' + personPicker() + '</div>' +
        dots(0) +
        '<button type="button" class="btn btn-primary-filled" id="launch-next" disabled><span class="btn-label">Continue</span><span class="btn-spinner"></span></button>';
      var nextBtn = inner.querySelector('#launch-next');
      inner.querySelectorAll('input[name="pick-name"]').forEach(function (r) {
        if (picked && r.value === picked) r.checked = true;
        r.addEventListener('change', function () { picked = r.value; nextBtn.disabled = false; nextBtn.focus(); });
      });
      if (picked) nextBtn.disabled = false;
      nextBtn.addEventListener('click', pageMission);
      var first = inner.querySelector('input[name="pick-name"]');
      if (first && !picked) first.focus();
    }

    function pageMission() {
      inner.innerHTML =
        '<p class="launch-kicker">The mission</p>' +
        '<h1 class="launch-title" id="launch-title">A day away from the interface</h1>' +
        '<ul class="paragraph-list paragraph-list--bullet launch-objectives">' +
        DAY.goals.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul>' +
        dots(1) +
        '<button type="button" class="btn btn-primary-filled" id="launch-next"><span class="btn-label">Continue</span><span class="btn-spinner"></span></button>' +
        '<button type="button" class="launch-skip" id="launch-skip">Skip the intro</button>';
      inner.querySelector('#launch-next').addEventListener('click', pageHow);
      inner.querySelector('#launch-skip').addEventListener('click', finish);
      watchSwipe(function () { return 'avatar'; });
      focusTitle();
    }

    function pageHow() {
      inner.innerHTML =
        '<p class="launch-kicker">Today’s agenda</p>' +
        '<h1 class="launch-title" id="launch-title">Today’s agenda</h1>' +
        '<div class="launch-moments">' +
        moment('camera', 'Morning — Exhibitions',
          'Log what stops you. Take a photo for later sharing.') +
        moment('team', 'Afternoon — Workshop',
          'Review our logs and discuss.') +
        moment('document-annotation', 'Evening — Train home',
          'Three reflections and log sharing.') +
        '</div>' +
        dots(2) +
        '<button type="button" class="btn btn-primary-filled" id="launch-start"><span class="btn-label">Start the day</span><span class="btn-spinner"></span></button>';
      inner.querySelector('#launch-start').addEventListener('click', finish);
      watchSwipe(function () { return 'mission'; });
      focusTitle();
    }

    /* Swipe right anywhere on the onboarding returns to the previous page.
       Claim the gesture early (capture phase) so the browser's edge-swipe
       navigation doesn't win; preventDefault stops the horizontal pan. */
    function watchSwipe(goBack) {
      var sx = 0, sy = 0, claimed = false;
      inner.addEventListener('touchstart', function (e) {
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        claimed = false;
      }, { passive: true, capture: true });
      inner.addEventListener('touchmove', function (e) {
        if (claimed) { e.preventDefault(); return; }
        var dx = e.touches[0].clientX - sx;
        var dy = e.touches[0].clientY - sy;
        if (dx > 24 && Math.abs(dy) < 32) { claimed = true; e.preventDefault(); }
        else if (Math.abs(dy) > 24) claimed = 'v'; /* vertical scroll wins */
      }, { passive: false, capture: true });
      inner.addEventListener('touchend', function (e) {
        if (claimed !== true) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (dx > 64) {
          var target = goBack();
          if (target === 'avatar') pageAvatar();
          else if (target === 'mission') pageMission();
        }
      }, { passive: true, capture: true });
    }

    function moment(ic, label, text) {
      return '<div class="launch-moment"><span class="launch-moment-icon">' + icon(ic) + '</span>' +
        '<span class="launch-moment-text"><strong>' + esc(label) + '</strong><br>' +
        '<span class="small muted">' + esc(text) + '</span></span></div>';
    }

    pageAvatar();
  }

  /* ---- Capture sheet ------------------------------------------------------ */
  /* One capture system. Opened from "Add a note" / "Log an observation" links
     inside a segment; attributed to that segment (or the current one). */

  var composer = { type: 'observation' };
  var sheetOpen = false;

  function openSheet(segmentId) {
    if (sheetOpen) return;
    sheetOpen = true;
    var target = segmentId ? segmentById(segmentId) : currentSegment();
    if (!target) target = currentSegment();

    var scrim = el('<div class="sheet-scrim" id="sheet-scrim"></div>');
    var sheet = el(
      '<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">' +
      '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="sheet-head">' +
      '<h2 class="sheet-title" id="sheet-title">New entry</h2>' +
      '<button type="button" class="app-bar-back" id="sheet-close" aria-label="Close">Close</button>' +
      '</div>' +
      '<p class="sheet-attribution">' + icon('time', true) +
      '<span>Logged to <strong>' + esc(target.title) + '</strong> — automatically, based on the time.</span></p>' +
      '<div class="segmented" role="radiogroup" aria-label="Entry type">' +
      ENTRY_TYPES.map(function (t) {
        var sel = composer.type === t.id;
        return '<button type="button" class="segmented-item" role="radio" aria-checked="' + sel + '" data-type="' + t.id + '">' + esc(t.label) + '</button>';
      }).join('') +
      '</div>' +
      '<textarea class="app-field" id="sheet-text" placeholder="What did you notice? One thought is enough." aria-label="Your note"></textarea>' +
      (target.type === 'exhibition'
        ? '<p class="photo-reminder small muted" style="margin:0">' + icon('camera', true) +
          '<span>Take a photo of the work for later.</span></p>' +
          '<label class="photo-check"><input type="checkbox" id="sheet-photo"><span>Photo taken</span></label>'
        : '') +
      '<div class="sheet-actions">' +
      '<button type="button" class="btn btn-primary-filled" id="sheet-add"><span class="btn-label">Add to log</span><span class="btn-spinner"></span></button>' +
      (target.id === 'workshop'
        ? '<button type="button" class="btn btn-secondary-plain" id="sheet-formula"><span class="btn-label">Use idea formula</span><span class="btn-spinner"></span></button>'
        : '') +
      '</div></div>'
    );

    document.body.appendChild(scrim);
    document.body.appendChild(sheet);

    function close() {
      sheetOpen = false;
      scrim.remove();
      sheet.remove();
    }

    scrim.addEventListener('click', close);
    sheet.querySelector('#sheet-close').addEventListener('click', close);
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
    });

    sheet.querySelectorAll('[data-type]').forEach(function (b) {
      b.addEventListener('click', function () {
        composer.type = b.getAttribute('data-type');
        sheet.querySelectorAll('[data-type]').forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
        b.setAttribute('aria-checked', 'true');
      });
    });

    var formulaBtn = sheet.querySelector('#sheet-formula');
    if (formulaBtn) formulaBtn.addEventListener('click', function () {
      var ta = sheet.querySelector('#sheet-text');
      ta.value = CAPTURE_FORMULA.split(' → ').join(':\n') + ':\n';
      ta.focus();
    });

    sheet.querySelector('#sheet-add').addEventListener('click', function () {
      var ta = sheet.querySelector('#sheet-text');
      var text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      var photo = sheet.querySelector('#sheet-photo');
      addEntry(target.id, composer.type, text, null, photo && photo.checked);
      close();
      render();
    });

    sheet.querySelector('#sheet-text').focus();
  }

  /* ---- Remove confirmation ------------------------------------------------ */
  /* Deleting a log entry is irreversible, so every Remove in the log confirms
     first — same sheet/scrim overlay pattern as the capture composer. */

  var confirmOpen = false;

  function confirmRemove(id, trigger) {
    if (confirmOpen) return;
    var entry = state.entries.find(function (e) { return e.id === id; });
    if (!entry) return;
    confirmOpen = true;

    var scrim = el('<div class="sheet-scrim"></div>');
    var sheet = el(
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title">' +
      '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="sheet-head">' +
      '<h2 class="sheet-title" id="confirm-title">Remove this entry?</h2>' +
      '<button type="button" class="app-bar-back" id="confirm-close" aria-label="Cancel">Close</button>' +
      '</div>' +
      '<p class="confirm-preview small">' + esc(entry.text) + '</p>' +
      '<div class="sheet-actions">' +
      '<button type="button" class="btn btn-primary-filled" id="confirm-remove"><span class="btn-label">Remove</span><span class="btn-spinner"></span></button>' +
      '<button type="button" class="btn btn-secondary-plain" id="confirm-keep"><span class="btn-label">Keep entry</span><span class="btn-spinner"></span></button>' +
      '</div></div>'
    );

    document.body.appendChild(scrim);
    document.body.appendChild(sheet);

    function close(refocus) {
      confirmOpen = false;
      scrim.remove();
      sheet.remove();
      if (refocus && trigger) trigger.focus();
    }

    scrim.addEventListener('click', function () { close(true); });
    sheet.querySelector('#confirm-close').addEventListener('click', function () { close(true); });
    sheet.querySelector('#confirm-keep').addEventListener('click', function () { close(true); });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { close(true); document.removeEventListener('keydown', onEsc); }
    });
    sheet.querySelector('#confirm-remove').addEventListener('click', function () {
      removeEntry(id);
      close(false);
      render();
    });

    sheet.querySelector('#confirm-keep').focus();
  }

  /* ---- View: Agenda ------------------------------------------------------ */

  function renderAgenda(view) {
    var status = dayStatus();
    var html = '<h1 class="large-title">' + esc(DAY.theme) + '</h1>';

    /* Now / next banner */
    if (status.isToday && status.current) {
      html += nowCard('Happening now', status.current, status.next);
    } else if (status.isToday && status.next) {
      html += nowCard('Coming up next', status.next, null);
    } else if (status.isToday) {
      html += '<div class="now-card"><span class="now-card-kicker">The day is done</span>' +
        '<span class="now-card-title">Review your log on the way home</span>' +
        '<div><a class="hyperlink hyperlink-sm" href="#/summary">Go to summary</a></div></div>';
    } else {
      html += '<div class="now-card"><span class="now-card-kicker">Not today</span>' +
        '<span class="now-card-title">The day starts ' + esc(DAY.dateLabel) + ', 09:00 at ' + esc(DAY.meet) + '</span>' +
        '<div class="now-card-meta"><span>' + icon('time', true) + ' Browse the agenda below to prepare</span></div></div>';
    }

    /* Timeline rows */
    html += '<section aria-label="Agenda"><h2 class="section-label">Agenda</h2><div class="timeline">';
    SEGMENTS.forEach(function (s) {
      var isNow = status.isToday && status.current && status.current.id === s.id;
      var logs = entryCountForSegment(s.id);
      html += '<a class="timeline-row' + (isNow ? ' is-now' : '') + '" href="#/segment/' + s.id + '">' +
        '<span class="timeline-time">' + esc(s.start) + '</span>' +
        '<span class="timeline-rail"><span class="timeline-dot"></span></span>' +
        '<span class="timeline-main">' +
        '<span class="timeline-title">' + esc(s.title) + '</span>' +
        '<span class="timeline-meta">' + tag(s.typeLabel, typeTagClass(s.type)) +
        '<span class="meta-item">' + icon('location', true) + esc(s.location.name) + '</span>' +
        (logs ? '<span class="timeline-logs">' + icon('edit', true) + logs + ' logged</span>' : '') +
        '</span></span>' +
        '<span class="timeline-chevron">' + icon('arrow-right') + '</span>' +
        '</a>';
    });
    html += '</div></section>';

    /* Goal + practical info */
    html += '<section aria-label="Goal for the day"><h2 class="section-label">Goal for the day</h2>' +
      '<div class="group"><div class="group-inset"><p style="margin:0">' + esc(DAY.mission) + '</p></div></div></section>';

    html += '<section aria-label="Good to know"><h2 class="section-label">Good to know</h2>' +
      '<div class="group"><div class="group-inset"><ul class="paragraph-list paragraph-list--bullet" style="margin:0">' +
      DAY.practical.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') +
      '</ul></div></div></section>';

    view.innerHTML = html;
  }

  function typeTagClass(type) {
    return {
      exhibition: 'tag tag-info',
      workshop: 'tag tag-success',
      travel: 'tag tag-neutral tag--outlined',
      break: 'tag tag-neutral tag--outlined',
      logistics: 'tag tag-neutral tag--outlined'
    }[type] || 'tag tag-neutral';
  }

  function nowCard(kicker, seg, next) {
    return '<div class="now-card"><span class="now-card-kicker">' + esc(kicker) + '</span>' +
      '<span class="now-card-title">' + esc(seg.title) + '</span>' +
      '<div class="now-card-meta">' +
      '<span>' + icon('time', true) + ' ' + esc(seg.timeLabel) + '</span>' +
      '<span>' + icon('location', true) + ' ' + esc(seg.location.name) + '</span>' +
      (next ? '<span>' + icon('arrow-right', true) + ' Then: ' + esc(next.title) + '</span>' : '') +
      '</div>' +
      '<div><a class="hyperlink hyperlink-sm" href="#/segment/' + seg.id + '">Open this part of the day</a></div></div>';
  }

  /* ---- View: Segment ----------------------------------------------------- */

  /* Progress: which answerable tasks / capturable phases are done */
  function segmentProgress(s) {
    var items = (s.tasks || []).filter(function (t) { return t.answerable; }).map(function (t) { return 'task:' + t.id; });
    (s.phases || []).forEach(function (p) { if (p.capture) items.push('phase:' + p.id); });
    var done = items.filter(function (key) {
      var kind = key.split(':')[0], id = key.split(':')[1];
      return state.entries.some(function (e) { return kind === 'task' ? e.taskId === id : e.phaseId === id; });
    });
    return { total: items.length, done: done.length };
  }

  /* First step without an entry yet (exhibition tasks only; phases never capture) */
  function firstOpenStep(s, items) {
    if (!s.tasks) return 0;
    for (var i = 0; i < items.length; i++) {
      var d = items[i].data;
      var answered = state.entries.some(function (e) { return e.taskId === d.id; });
      if (!answered) return i;
    }
    return 0;
  }

  function missionCtaLabel(s, items) {
    if (!s.tasks) return 'Open the first phase';
    var prog = segmentProgress(s);
    if (prog.done === 0) return 'Start the mission';
    if (prog.done < prog.total) return 'Continue · ' + prog.done + ' of ' + prog.total + ' captured';
    return 'Review your answers';
  }

  function renderSegment(view, id, stepIndex) {
    var s = segmentById(id);
    if (!s) { view.innerHTML = '<p class="muted" style="padding:0 var(--space-m)">Unknown segment. <a class="hyperlink hyperlink-primary" href="#/">Back to agenda</a></p>'; return; }
    if (stepIndex === undefined || stepIndex === null) stepIndex = null;

    /* Stepped missions: exhibitions have answerable tasks; workshop phases are
       stepped too, but browse-only (no in-app capture in the workroom) */
    var missionItems = null;
    if (s.tasks && s.tasks.some(function (t) { return t.answerable; })) {
      missionItems = s.tasks.filter(function (t) { return t.answerable; }).map(function (t) { return { kind: 'task', data: t }; });
    } else if (s.phases && s.phases.length) {
      missionItems = s.phases.map(function (p) { return { kind: 'phase', data: p }; });
    }

    if (missionItems && stepIndex !== null && stepIndex >= 0 && stepIndex < missionItems.length) {
      renderStep(view, s, missionItems, stepIndex);
      return;
    }
    renderSegmentOverview(view, s, missionItems);
  }

  /* Mission overview: hero, location, brief, steps with progress, extra context */
  function renderSegmentOverview(view, s, missionItems) {
    /* Only the guide (Nicolas) gets the full location card up front — everyone
       else follows the group, so location demotes to a quiet line and the
       mission lead + entry CTA take the visual focus. */
    var isGuide = state.name === 'Nicolas';
    var html = '<section class="detail-hero">' +
      '<div class="detail-meta">' + tag(s.typeLabel, typeTagClass(s.type)) +
      '<span class="meta-item small muted">' + icon('time', true) + ' ' + esc(s.timeLabel) + '</span></div>' +
      '<h1 class="detail-title">' + esc(s.title) + '</h1>' +
      (!isGuide && s.location
        ? '<p class="location-line small muted">' + icon('location', true) + '<span>' + esc(s.location.name) + '</span></p>'
        : '') +
      '</section>';

    if (isGuide) html += '<section aria-label="Location">' + locationCard(s.location) + '</section>';

    /* Orientation: one-sentence focus + a primary way in.
       The steps carry the story; the overview orients. */
    if (s.focus) {
      html += '<section class="detail-hero"><p class="mission-lead">' + esc(s.focus) + '</p>' +
        (missionItems
          ? '<a class="btn btn-primary-filled mission-cta" href="#/segment/' + s.id + '/step/' + firstOpenStep(s, missionItems) + '">' +
            '<span class="btn-label">' + missionCtaLabel(s, missionItems) + '</span><span class="btn-spinner"></span></a>'
          : '') +
        '</section>';
    }

    /* Steps titled by their promised output (1:1 contract: output[i] ↔ task i);
       the original task name becomes the subtitle. Phases unaffected. */
    if (missionItems) {
      var prog = segmentProgress(s);
      var label = s.stepsLabel || (s.id === 'workshop' ? 'The afternoon, phase by phase' : 'Your mission');
      html += '<section aria-label="' + label + '"><h2 class="section-label">' + label +
        (prog.total ? ' · ' + prog.done + ' of ' + prog.total + ' captured' : '') + '</h2><div class="group">';
      missionItems.forEach(function (item, i) {
        var d = item.data;
        var doneEntry = state.entries.find(function (e) {
          return item.kind === 'task' ? e.taskId === d.id : e.phaseId === d.id;
        });
        var isTask = item.kind === 'task';
        var title = isTask && s.output && s.output[i] ? s.output[i] : (isTask ? d.title : d.timeLabel + ' · ' + d.title);
        var subtitle = isTask && s.output && s.output[i] ? d.title : null;
        html += '<a class="step-row" href="#/segment/' + s.id + '/step/' + i + '">' +
          '<span class="step-check' + (doneEntry ? ' is-done' : '') + '">' +
          (doneEntry ? icon('checkbox-on', true) : '<span class="step-num">' + (i + 1) + '</span>') + '</span>' +
          '<span class="step-main"><span class="step-title">' + esc(title) + '</span>' +
          (subtitle ? '<span class="step-subtitle">' + esc(subtitle) + '</span>' : '') +
          (doneEntry ? '<span class="step-answer">' + esc(doneEntry.text.slice(0, 80)) + (doneEntry.text.length > 80 ? '…' : '') + '</span>' : '') +
          '</span>' +
          '<span class="timeline-chevron">' + icon('arrow-right') + '</span></a>';
      });
      html += '</div></section>';
    }

    /* The mission brief, collapsed: only when there is a genuine keep-in-mind
       question — the outputs already appear as the mission row titles above */
    if (s.briefQuestions && s.briefQuestions.length) {
      html += '<section class="detail-hero"><details class="mission-brief">' +
        '<summary><span class="mission-brief-label">The mission brief</span>' + icon('arrow-right', true) + '</summary>' +
        '<div class="mission-brief-body">' +
        '<p class="small muted" style="margin:0">Keep in mind: ' + s.briefQuestions.map(esc).join(' ') + '</p>' +
        '</div></details></section>';
    }

    /* Materials note (workshop) */
    if (s.materials) {
      html += '<section class="detail-hero"><p class="small muted" style="margin:0">Materials in the room: ' + s.materials.map(esc).join(' · ') + '</p></section>';
    }

    /* Non-answerable tasks (e.g. lunch) stay a simple list */
    if (s.tasks && !s.tasks.some(function (t) { return t.answerable; })) {
      html += '<section><h2 class="section-label">' + (s.id === 'lunch' ? 'Share over lunch' : 'Tasks and observations') + '</h2>' +
        '<div class="group"><div class="group-inset"><ol class="paragraph-list paragraph-list--numbered" style="margin:0">' +
        s.tasks.map(function (t) {
          return '<li><strong>' + esc(t.title) + '</strong>' + (t.hint ? '<br><span class="small muted">' + esc(t.hint) + '</span>' : '') + '</li>';
        }).join('') +
        '</ol></div></div></section>';
    }

    /* Loose-note capture: the single, quiet alternative (not in the workroom —
       the workshop is captured physically on sticky notes and the whiteboard;
       segments can opt out with allowNotes: false) */
    if (!s.phases && s.allowNotes !== false) {
      var logs = entryCountForSegment(s.id);
      html += '<section class="detail-hero">' +
        '<button type="button" class="note-link" data-action="note">' + icon('add', true) +
        '<span>' + (logs ? logs + ' ' + (logs === 1 ? 'entry' : 'entries') + ' logged — add a note' : 'Something else caught your eye? Add a note') + '</span></button>' +
        '</section>';
    }

    view.innerHTML = html;
    var noteBtn = view.querySelector('[data-action="note"]');
    if (noteBtn) noteBtn.addEventListener('click', function () { openSheet(s.id); });
  }

  /* One focused step: the prompt, the lens, the capture field, prev/next */
  function renderStep(view, s, items, i) {
    var item = items[i];
    var d = item.data;
    var isTask = item.kind === 'task';
    var entry = state.entries.find(function (e) {
      return isTask ? e.taskId === d.id : e.phaseId === d.id;
    });

    var html = '<section class="detail-hero">' +
      '<div class="detail-meta">' + tag(s.typeLabel, typeTagClass(s.type)) +
      '<span class="meta-item small muted">' + icon('time', true) + ' ' + esc(isTask ? s.timeLabel : d.timeLabel) + '</span></div>' +
      '<h1 class="detail-title">' + esc(isTask ? d.title : d.title) + '</h1>' +
      '<div class="step-progress" role="img" aria-label="Step ' + (i + 1) + ' of ' + items.length + '">' +
      items.map(function (_, j) {
        return '<span class="step-dot' + (j === i ? ' is-current' : '') + (stepDone(items[j]) ? ' is-done' : '') + '"></span>';
      }).join('') +
      '<span class="small muted" style="margin-left:var(--space-xs)">' + (i + 1) + ' of ' + items.length + '</span></div>' +
      '</section>';

    /* The story for this step */
    html += '<section><div class="group"><div class="group-inset" style="display:flex;flex-direction:column;gap:var(--space-m)">';
    if (isTask && d.hint) html += '<p style="margin:0">' + esc(d.hint) + '</p>';
    /* Workshop phases: Goal first and prominent (same emphasis as the task
       lens), then the numbered steps — same composition on every phase. */
    if (!isTask && d.goal) {
      html += '<p class="lens" style="margin:0">' + icon('star-outline', true) +
        '<span><span class="output-label">Goal:</span> ' + esc(d.goal) + '</span></p>';
    }
    if (!isTask && d.steps) {
      html += '<ol class="paragraph-list paragraph-list--numbered" style="margin:0">' +
        d.steps.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>';
    }
    if (!isTask && d.thinkRather) {
      html += '<div class="formula">Think: ' + esc(d.thinkRather.think) + '</div>' +
        '<p class="small muted" style="margin:0">rather than: ' + esc(d.thinkRather.rather) + '</p>';
    }
    if (!isTask && d.formula) html += '<div class="formula"><span class="formula-label">The shared shape — capture each idea as</span>' + esc(d.formula) + '</div>';
    if (!isTask && d.note) html += '<p class="small muted" style="margin:0">' + esc(d.note) + '</p>';
    if (isTask && d.lens) {
      html += '<p class="lens" style="margin:0">' + icon('star-outline', true) +
        '<span><span class="output-label">While you look:</span> ' + esc(d.lens) + '</span></p>';
    }
    if (isTask && d.keepInMind) {
      html += '<p class="lens" style="margin:0">' + icon('info', true) +
        '<span><span class="output-label">Keep in mind:</span> ' + esc(d.keepInMind) + '</span></p>';
    }
    html += '</div></div></section>';

    /* Capture */
    var capture = isTask ? (d.capture || { type: 'observation', placeholder: 'One thought is enough.' }) : d.capture;
    var photoPrompt = capture && s.type === 'exhibition';
    if (capture) {
      html += '<section><h2 class="section-label">Your capture</h2><div class="group"><div class="group-inset" style="display:flex;flex-direction:column;gap:var(--space-m)">';
      if (entry) {
        html += '<p class="entry-text" style="margin:0">' + esc(entry.text) + '</p>' +
          (entry.photoTaken
            ? '<p class="photo-reminder small" style="margin:0">' + icon('camera', true) + '<span>Photo taken</span></p>'
            : '') +
          '<div class="entry-actions">' +
          '<button type="button" class="btn btn-secondary-plain btn-size-m" data-edit-entry><span class="btn-label">Edit</span><span class="btn-spinner"></span></button>' +
          '<button type="button" class="btn btn-secondary-plain btn-size-m" data-remove-entry="' + entry.id + '"><span class="btn-label">Remove</span><span class="btn-spinner"></span></button>' +
          '</div>';
      } else {
        html += '<textarea class="app-field" id="step-field" placeholder="' + esc(capture.placeholder || 'Rough is fine.') + '" aria-label="Your capture for: ' + esc(d.title) + '"></textarea>' +
          (photoPrompt
            ? '<p class="photo-reminder small muted" style="margin:0">' + icon('camera', true) +
              '<span>Take a photo of the work for later.</span></p>' +
              '<label class="photo-check"><input type="checkbox" id="step-photo"><span>Photo taken</span></label>'
            : '');
      }
      html += '</div></div></section>';
    }

    /* Footer: previous on the left, one primary forward action on the right.
       Capture steps merge save + advance into a single "Save and continue". */
    var prevHref = i > 0 ? '#/segment/' + s.id + '/step/' + (i - 1) : '#/segment/' + s.id;
    var prevLabel = i > 0 ? stepName(items[i - 1]) : 'Overview';
    var nextHref = i < items.length - 1 ? '#/segment/' + s.id + '/step/' + (i + 1) : '#/segment/' + s.id;
    var last = i === items.length - 1;
    /* Step navigation follows the configurator side-sheet CTA pairing:
       quiet plain action on the left, filled primary action on the right,
       arrows integrated as button icons. */
    html += '<section class="detail-hero step-actions">' +
      '<a class="btn btn-secondary-plain btn-icon-left" href="' + prevHref + '">' + icon('arrow-left') + '<span class="btn-label">' + esc(prevLabel) + '</span><span class="btn-spinner"></span></a>' +
      (capture
        ? (entry
          ? '<a class="btn btn-primary-filled btn-icon-right" href="' + nextHref + '"><span class="btn-label">' + (last ? 'Finish' : 'Continue') + '</span>' + icon('arrow-right') + '<span class="btn-spinner"></span></a>'
          : '<button type="button" class="btn btn-primary-filled btn-icon-right" data-save-entry><span class="btn-label">' + (last ? 'Save and finish' : 'Save and continue') + '</span>' + icon('arrow-right') + '<span class="btn-spinner"></span></button>')
        : '<a class="btn btn-primary-filled btn-icon-right" href="' + nextHref + '"><span class="btn-label">' + (last ? 'Done — overview' : esc(stepName(items[i + 1]))) + '</span>' + icon('arrow-right') + '<span class="btn-spinner"></span></a>') +
      '</section>';

    view.innerHTML = html;

    function stepName(it) {
      var x = it.data;
      return it.kind === 'task' ? 'Task ' + (items.indexOf(it) + 1) : x.title;
    }

    function stepDoneRef(it) {
      var x = it.data;
      return state.entries.some(function (e) { return it.kind === 'task' ? e.taskId === x.id : e.phaseId === x.id; });
    }

    var saveBtn = view.querySelector('[data-save-entry]');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      var ta = document.getElementById('step-field');
      var text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      var photo = document.getElementById('step-photo');
      addStepEntry(s.id, capture.type, text, isTask ? d.id : null, isTask ? null : d.id, photo && photo.checked);
      /* save and continue: advance to the next step */
      if (i < items.length - 1) location.hash = '#/segment/' + s.id + '/step/' + (i + 1);
      else location.hash = '#/segment/' + s.id;
    });

    var editBtn = view.querySelector('[data-edit-entry]');
    if (editBtn) editBtn.addEventListener('click', function () {
      state.entries = state.entries.filter(function (e) { return e.id !== entry.id; });
      save();
      render();
      var ta = document.getElementById('step-field');
      if (ta) ta.focus();
    });

    var removeBtn = view.querySelector('[data-remove-entry]');
    if (removeBtn) removeBtn.addEventListener('click', function () {
      removeEntry(removeBtn.getAttribute('data-remove-entry'));
      render();
    });
  }

  function stepDone(item) {
    var d = item.data;
    return state.entries.some(function (e) { return item.kind === 'task' ? e.taskId === d.id : e.phaseId === d.id; });
  }

  function addStepEntry(segmentId, type, text, taskId, phaseId, photoTaken) {
    var now = new Date();
    state.entries.push({
      id: 'e' + now.getTime().toString(36),
      ts: now.toISOString(),
      time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
      segmentId: segmentId,
      taskId: taskId || null,
      phaseId: phaseId || null,
      type: type,
      text: text,
      photoTaken: !!photoTaken
    });
    save();
  }

  /* ---- View: Log --------------------------------------------------------- */

  function renderLog(view) {
    var html = '<h1 class="large-title">Work log</h1>';

    if (!state.name) {
      html += '<section aria-label="Who is logging"><h2 class="section-label">Who is logging?</h2>' +
        '<div class="group"><div class="group-inset">' +
        '<p class="small muted" style="margin:0 0 var(--space-m)">Your name personalises this device’s log and the export header. Nothing leaves your phone.</p>' +
        '<div class="person-grid">' + personPicker() + '</div>' +
        '</div></div></section>';
    }

    /* Entries grouped by segment, day order */
    html += '<section aria-label="Your entries"><h2 class="section-label">Your entries (' + state.entries.length + ')</h2>';
    if (!state.entries.length) {
      html += '<div class="group"><div class="group-inset"><p class="muted" style="margin:0">Nothing logged yet. Open a part of the day and answer its tasks — the summary builds itself.</p></div></div>';
    } else {
      SEGMENTS.forEach(function (s) {
        var list = state.entries.filter(function (e) { return e.segmentId === s.id; });
        if (!list.length) return;
        html += '<h3 class="log-segment-title">' + esc(s.title) + '</h3><div class="group">';
        list.forEach(function (e) {
          var t = typeById(e.type);
          var task = e.taskId ? taskById(e.taskId) : null;
          var phase = e.phaseId ? phaseById(e.phaseId) : null;
          var context = task ? task.title : (phase ? phase.title : null);
          var label = task ? 'Task answer' : (phase ? phase.timeLabel : (t ? t.label : e.type));
          html += '<article class="entry">' +
            '<div class="entry-head">' + tag(label, (task || phase) ? 'tag tag-success' : TYPE_TAG_CLASS[e.type]) +
            '<span class="small muted">' + esc(e.time) + '</span>' +
            '<button type="button" class="btn btn-tertiary-tonal entry-remove" data-remove="' + e.id + '" aria-label="Remove entry from ' + esc(e.time) + '">' +
            '<span class="btn-label">Remove</span><span class="btn-spinner"></span></button></div>' +
            (context ? '<div class="small muted">' + esc(context) + '</div>' : '') +
            '<p class="entry-text">' + esc(e.text) + '</p>' +
            (e.photoTaken ? '<div class="photo-taken small muted">' + icon('camera', true) + '<span>Photo taken</span></div>' : '') +
            '</article>';
        });
        html += '</div>';
      });
    }
    html += '</section>';

    view.innerHTML = html;

    view.querySelectorAll('[data-remove]').forEach(function (b) {
      b.addEventListener('click', function () {
        confirmRemove(b.getAttribute('data-remove'), b);
      });
    });

    wirePersonPicker(view);
  }

  /* ---- View: Summary ----------------------------------------------------- */

  function renderSummary(view) {
    var html = '<h1 class="large-title">Day summary</h1>';

    if (!state.name) {
      html += '<section aria-label="Who is logging"><h2 class="section-label">Who is logging?</h2>' +
        '<div class="group"><div class="group-inset">' +
        '<p class="small muted" style="margin:0 0 var(--space-m)">Your name personalises this device’s log and the export header. Nothing leaves your phone.</p>' +
        '<div class="person-grid">' + personPicker() + '</div>' +
        '</div></div></section>';
    }

    /* Deliverables checklist */
    html += '<section aria-label="Deliverables"><h2 class="section-label">Your day, delivered</h2><div class="group"><ul class="checklist">';
    DELIVERABLES.forEach(function (d) {
      var count = state.entries.filter(function (e) {
        var t = typeById(e.type);
        return t && t.mapsTo === d.id;
      }).length;
      var done = count > 0;
      html += '<li class="checklist-item' + (done ? ' is-done' : '') + '">' +
        '<span class="checklist-icon">' + icon(done ? 'checkbox-on' : 'not-done') + '</span>' +
        '<span>' + esc(d.label) + (count ? ' <span class="small muted">(' + count + ')</span>' : '') + '</span></li>';
    });
    html += '</ul></div></section>';

    /* Export */
    html += '<section aria-label="Export"><h2 class="section-label">Take it with you</h2>' +
      '<div class="group"><div class="group-inset" style="display:flex;flex-direction:column;gap:var(--space-m)">' +
      '<p class="small muted" style="margin:0">Everything stays on this device. Export your log to share it in the team channel or archive it.</p>' +
      '<button type="button" class="btn btn-primary-filled btn-icon-left" data-action="export-md"' + (state.entries.length ? '' : ' disabled') + '>' +
      icon('download') + '<span class="btn-label">Export as Markdown</span><span class="btn-spinner"></span></button>' +
      '<button type="button" class="btn btn-secondary-filled btn-icon-left" data-action="export-json"' + (state.entries.length ? '' : ' disabled') + '>' +
      icon('export') + '<span class="btn-label">Export as JSON</span><span class="btn-spinner"></span></button>' +
      '</div></div></section>';

    /* Account: log out / switch user. Entries are nameless and stay on the
       device — logging out only re-opens the avatar picker. */
    if (state.name) {
      html += '<section aria-label="Account"><h2 class="section-label">Logged in as ' + esc(state.name) + '</h2>' +
        '<div class="group"><div class="group-inset" style="display:flex;flex-direction:column;gap:var(--space-m)">' +
        '<p class="small muted" style="margin:0">Picked the wrong avatar? Log out and choose again — your entries stay on this device.</p>' +
        '<button type="button" class="btn btn-secondary-outline" data-action="logout"><span class="btn-label">Log out</span><span class="btn-spinner"></span></button>' +
        '</div></div></section>';
    }

    /* Day goals reference */
    html += '<section aria-label="Day goals"><h2 class="section-label">Goal for the day</h2>' +
      '<div class="group"><div class="group-inset"><ul class="paragraph-list paragraph-list--bullet" style="margin:0">' +
      DAY.goals.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') +
      '</ul></div></div></section>';

    view.innerHTML = html;

    var mdBtn = view.querySelector('[data-action="export-md"]');
    if (mdBtn) mdBtn.addEventListener('click', exportMarkdown);
    var jsonBtn = view.querySelector('[data-action="export-json"]');
    if (jsonBtn) jsonBtn.addEventListener('click', exportJson);

    var logoutBtn = view.querySelector('[data-action="logout"]');
    if (logoutBtn) logoutBtn.addEventListener('click', function () {
      state.name = '';
      save();
      render();
    });

    wirePersonPicker(view);
  }

  /* ---- Export ------------------------------------------------------------- */

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportMarkdown() {
    var lines = [
      '# Inspiration Day log — ' + (state.name || 'Team member'),
      '',
      DAY.title + ': ' + DAY.theme + ' · ' + DAY.dateLabel + ' · ' + DAY.city,
      ''
    ];
    SEGMENTS.forEach(function (s) {
      var list = state.entries.filter(function (e) { return e.segmentId === s.id; });
      if (!list.length) return;
      lines.push('## ' + s.timeLabel + ' · ' + s.title, '');
      list.forEach(function (e) {
        var t = typeById(e.type);
        var task = e.taskId ? taskById(e.taskId) : null;
        var phase = e.phaseId ? phaseById(e.phaseId) : null;
        var label = task ? 'Task: ' + task.title : (phase ? phase.timeLabel + ' ' + phase.title : (t ? t.label : e.type));
        lines.push('- **' + label + '** (' + e.time + '): ' + e.text.replace(/\n/g, ' ') + (e.photoTaken ? ' — photo taken 📷' : ''));
      });
      lines.push('');
    });
    lines.push('---', '', '## Deliverables checklist', '');
    DELIVERABLES.forEach(function (d) {
      var done = state.entries.some(function (e) {
        var t = typeById(e.type);
        return t && t.mapsTo === d.id;
      });
      lines.push('- [' + (done ? 'x' : ' ') + '] ' + d.label);
    });
    lines.push('');
    download('inspiration-day-log-' + (state.name || 'team').toLowerCase().replace(/\s+/g, '-') + '-2026-11-23.md',
      lines.join('\n'), 'text/markdown');
  }

  function exportJson() {
    download('inspiration-day-log-' + (state.name || 'team').toLowerCase().replace(/\s+/g, '-') + '-2026-11-23.json',
      JSON.stringify({ name: state.name, day: DAY.dateISO, entries: state.entries }, null, 2),
      'application/json');
  }

  /* ---- Router -------------------------------------------------------------- */

  function parseRoute() {
    var h = location.hash.replace(/^#\/?/, '').split('?')[0];
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) return { name: 'agenda' };
    if (parts[0] === 'segment' && parts[1]) {
      var r = { name: 'segment', id: parts[1], step: null };
      if (parts[2] === 'step' && parts[3] !== undefined) r.step = parseInt(parts[3], 10);
      return r;
    }
    if (parts[0] === 'log') return { name: 'log' };
    if (parts[0] === 'summary') return { name: 'summary' };
    return { name: 'agenda' };
  }

  function render() {
    var route = parseRoute();
    var view = document.getElementById('view');
    renderChrome(route);
    if (route.name === 'segment') renderSegment(view, route.id, route.step);
    else if (route.name === 'log') renderLog(view);
    else if (route.name === 'summary') renderSummary(view);
    else renderAgenda(view);
    renderLaunch();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', render);

  /* refresh the now/next state once a minute while on the agenda */
  setInterval(function () {
    if (parseRoute().name === 'agenda') render();
  }, 60000);

  document.addEventListener('DOMContentLoaded', function () {
    render();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is best-effort in the prototype */ });
    }
  });
})();
