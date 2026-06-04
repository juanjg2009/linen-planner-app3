/* ============================================================
   Linen Paper Co. — runtime + page builders (vanilla, no deps)
   TOKENS is injected as a global before this script.
   ============================================================ */
(function () {
  'use strict';
  var T = window.TOKENS;
  var PAGE_W = T.PAGE_W, PAGE_H = T.PAGE_H, THEMES = T.THEMES, DEFAULT_THEME = T.DEFAULT_THEME;

  // ---- doc id (namespace) -------------------------------------------------
  var DOC_ID = (function () {
    try {
      var p = decodeURIComponent(location.pathname.split('/').pop() || '');
      return p.replace(/\.html?$/i, '') || 'linen-planner';
    } catch (e) { return 'linen-planner'; }
  })();

  // ---- storage ------------------------------------------------------------
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function pfx(pid) { return 'lp:' + DOC_ID + ':' + pid + '|'; }
  function allKeys() {
    var out = [], i, k, base = 'lp:' + DOC_ID + ':';
    try { for (i = 0; i < localStorage.length; i++) { k = localStorage.key(i); if (k && k.indexOf(base) === 0) out.push(k); } } catch (e) {}
    return out;
  }

  // ---- html helpers -------------------------------------------------------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function f(name, ph, cls) { return '<input type="text" class="lp-field ' + (cls || '') + '" name="' + esc(name) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>'; }
  function num(name, ph, cls) { return '<input type="text" inputmode="decimal" class="lp-field ' + (cls || '') + '" name="' + esc(name) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>'; }
  function ta(name, ph, cls) { return '<textarea class="lp-area ' + (cls || '') + '" name="' + esc(name) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '></textarea>'; }
  function cb(name) { return '<input type="checkbox" class="lp-cb" name="' + esc(name) + '">'; }
  function tg(name, mod) { return '<label class="lp-tgl"><input type="checkbox" class="lp-toggle" name="' + esc(name) + '"><span class="lp-tg ' + (mod || '') + '"></span></label>'; }
  function radio(group, value) { return '<input type="radio" class="lp-radio" name="' + esc(group) + '" value="' + esc(value) + '">'; }
  function lines(name, n) { var s = '', i; for (i = 0; i < n; i++) s += '<div style="padding:7px 0;border-bottom:1px solid color-mix(in srgb,var(--c-deep) 40%,transparent)">' + f(name + i) + '</div>'; return s; }

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // undated: Feb=29 to cover leap years
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  // ---- shared chrome ------------------------------------------------------
  function topnav(curKey) {
    var items = [['index', 'Index', 'index'], ['year', 'Year', 'year'], ['month', 'Month', 'month-01'],
      ['week', 'Week', 'wmon-01'], ['day', 'Day', 'daily'], ['notes', 'Notes', 'notes']];
    var h = '<div class="lp-topnav"><a class="nav-brand" href="#cover" style="text-decoration:none;color:inherit">Linen Paper Co.</a>';
    items.forEach(function (it) { h += '<a class="tab' + (curKey === it[0] ? ' cur' : '') + '" href="#' + it[2] + '">' + it[1] + '</a>'; });
    h += '<div class="theme-meta">Undated &#9672; <span class="js-theme-name"></span></div></div>';
    return h;
  }
  function sidetabs(curKey) {
    var items = [['style', 'Style', 'cover'], ['wellness', 'Wellness', 'habit'], ['selfcare', 'Self-care', 'wellness'],
      ['finance', 'Finance', 'finance'], ['productivity', 'Productivity', 'productivity']];
    var h = '<div class="lp-sidetabs">';
    items.forEach(function (it) { h += '<a class="' + (curKey === it[0] ? 'cur' : '') + '" href="#' + it[2] + '"><span>' + it[1] + '</span></a>'; });
    return h + '</div>';
  }
  function frame(curTop, curSide, inner) {
    return topnav(curTop) + sidetabs(curSide) + '<div class="pad" style="top:56px;right:64px;bottom:0;left:0">' + inner + '</div>';
  }

  // ========================================================================
  //  PAGE BUILDERS
  // ========================================================================

  function buildCover() {
    var dots = '';
    THEMES.forEach(function (t) { dots += '<button class="cw" data-theme="' + t.id + '" style="background:' + t.mid + '" title="' + t.name + '"></button>'; });
    return '<div class="pad" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">'
      + '<div style="position:absolute;top:34px;left:40px;right:40px;display:flex;justify-content:space-between" class="lp-eyebrow">'
      + '<span>Linen Paper Co.</span><span>Undated Edition</span></div>'
      + '<div style="width:120px;height:120px;border-radius:50%;background:var(--c-tint);display:flex;align-items:center;justify-content:center;font-size:38px;color:var(--c-deep)">&#10042;</div>'
      + '<div class="lp-sub" style="font-size:26px;margin-top:22px;color:var(--c-deep)">The digital planner</div>'
      + '<div class="lp-h lp-display" style="font-size:84px;letter-spacing:1px">All</div>'
      + '<div class="lp-sub" style="font-size:74px;margin-top:-6px">in One</div>'
      + '<div class="lp-eyebrow" style="margin-top:24px;border-top:1px solid color-mix(in srgb,var(--c-deep) 30%,transparent);border-bottom:1px solid color-mix(in srgb,var(--c-deep) 30%,transparent);padding:8px 14px">365 days &nbsp;&#183;&nbsp; 52 weeks &nbsp;&#183;&nbsp; 12 months</div>'
      + '<div style="position:absolute;bottom:34px;left:40px"><div class="lp-sub" style="font-size:20px"><span class="js-theme-name"></span></div></div>'
      + '<div style="position:absolute;bottom:34px;right:40px" class="cover-wheel">' + dots + '</div>'
      + '</div>';
  }

  function buildIndex() {
    var routes = [
      ['Year at a glance', '1 page', 'year'], ['Monthly planner', '12 months', 'month-01'],
      ['Weekly &#183; Monday', '52 weeks', 'wmon-01'], ['Weekly &#183; Sunday', '52 weeks', 'wsun-01'],
      ['Daily planner', '365 days', 'daily'], ['Habit tracker', 'monthly', 'habit'],
      ['Finance', 'budget', 'finance'], ['Wellness', 'meals &#183; water', 'wellness'],
      ['Productivity', 'projects', 'productivity'], ['Notes &amp; stickers', 'free', 'notes']
    ];
    var dir = '';
    routes.forEach(function (r, i) {
      dir += '<a href="#' + r[2] + '"><span class="num">' + pad2(i + 1) + '</span><span class="nm">' + r[0] + '</span><span class="meta">' + r[1] + '</span><span>&#8250;</span></a>';
    });
    var months = '';
    MONTHS.forEach(function (m, i) { months += '<a href="#month-' + pad2(i + 1) + '"><div class="mi">' + pad2(i + 1) + '</div><div class="mn">' + m + '</div></a>'; });
    var chips = ['Style', 'Wellness', 'Self-care', 'Finance', 'Productivity'];
    var ch = '';
    var chipMap = { 'Style': 'cover', 'Wellness': 'habit', 'Self-care': 'wellness', 'Finance': 'finance', 'Productivity': 'productivity' };
    chips.forEach(function (c) { ch += '<a href="#' + chipMap[c] + '">' + c + '</a>'; });
    var left = '<div class="lp-eyebrow">Index &#183; Interactive</div>'
      + '<div class="lp-h" style="font-size:46px;margin:8px 0">Your year,<br><span class="lp-sub">hyperlinked</span></div>'
      + '<div class="muted" style="font-size:13px;max-width:320px;margin-bottom:14px">Tap any section or month to jump. Every page links to the rest of the planner.</div>'
      + '<div class="chips">' + ch + '</div>'
      + '<div class="lp-eyebrow" style="margin:26px 0 10px">The twelve months</div>'
      + '<div class="month-grid">' + months + '</div>';
    var right = '<div class="lp-sub" style="font-size:24px;margin-bottom:6px">Directory <span class="lp-label" style="float:right;margin-top:10px">10 routes</span></div><div class="dir">' + dir + '</div>';
    return frame('index', '', '<div style="display:grid;grid-template-columns:1.05fr .95fr;gap:30px;height:100%">'
      + '<div style="min-width:0">' + left + '</div><div class="fill-tint" style="min-width:0;margin:-20px -64px -20px 0;padding:24px 64px 24px 24px">' + right + '</div></div>');
  }

  function miniCal(mi) {
    var dows = ['m', 't', 'w', 't', 'f', 's', 's'];
    var h = '<div class="minical"><a class="mt" href="#month-' + pad2(mi + 1) + '" style="text-decoration:none;color:inherit">' + MONTHS[mi] + '</a><table><tr>';
    dows.forEach(function (d) { h += '<th>' + d + '</th>'; });
    h += '</tr>';
    var d = 1, last = MONTH_DAYS[mi];
    for (var r = 0; r < 5; r++) { h += '<tr>'; for (var c = 0; c < 7; c++) { h += '<td>' + (d <= last ? d++ : '') + '</td>'; } h += '</tr>'; }
    return h + '</table></div>';
  }
  function buildYear() {
    var cals = '';
    for (var i = 0; i < 12; i++) cals += miniCal(i);
    var areas = ['Body', 'Mind', 'Money', 'Craft', 'Home', 'People', 'Joy'];
    var goals = '';
    areas.forEach(function (a, i) { goals += '<div style="display:flex;align-items:center;gap:10px;padding:6px 0">' + cb('goal-' + i) + '<span style="font-family:\'Cormorant Garamond\',serif;font-size:18px">' + a + '</span></div>'; });
    var left = '<div class="lp-eyebrow">Year at a glance &#183; Undated</div>'
      + '<div style="display:flex;justify-content:flex-end"><div class="lp-sub" style="font-size:22px;margin:-18px 0 8px">Twelve months at a glance</div></div>'
      + '<div class="minicals">' + cals + '</div>';
    var right = '<div class="lp-label">Word of the year</div>'
      + '<div>' + f('woty', '') + '</div>'
      + '<div class="lp-sub" style="font-size:30px;margin:4px 0 14px;color:var(--c-deep)">Consistency</div>'
      + '<div class="lp-label">Goals &#183; 7 areas</div>' + goals
      + '<div class="lp-label" style="margin:16px 0 6px">Let go this year</div>' + lines('letgo', 4);
    return frame('year', '', '<div style="display:grid;grid-template-columns:1.35fr .65fr;gap:24px;height:100%">'
      + '<div style="min-width:0">' + left + '</div><div class="fill-tint" style="min-width:0;margin:-20px -64px -20px 0;padding:22px 64px 22px 24px">' + right + '</div></div>');
  }

  function buildMonth(mi) {
    var name = MONTHS[mi], mm = pad2(mi + 1);
    var prev = 'month-' + pad2(((mi + 11) % 12) + 1), next = 'month-' + pad2(((mi + 1) % 12) + 1);
    var dows = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], head = '';
    dows.forEach(function (d) { head += '<div class="dow">' + d + '</div>'; });
    var cells = '', last = MONTH_DAYS[mi];
    for (var i = 1; i <= 35; i++) {
      var n = i <= last ? i : '';
      cells += '<a class="cell" href="#daily" style="height:88px">' + (n ? '<span class="n">' + n + '</span>' + f('d' + i, '', '') : '') + '</a>';
    }
    var prio = '', pay = '';
    for (var p = 0; p < 5; p++) { prio += '<div style="display:flex;gap:8px;align-items:center;padding:4px 0">' + cb('prio' + p) + f('priot' + p) + '</div>'; }
    for (var q = 0; q < 5; q++) { pay += '<div style="display:flex;gap:8px;align-items:center;padding:4px 0">' + cb('pay' + q) + f('payt' + q) + '</div>'; }
    var habits = ['Water', 'Reading', 'Steps', 'Meditate'], hb = '';
    habits.forEach(function (h, i) {
      hb += '<div style="margin:7px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><span>' + f('habn' + i, h) + '</span><span class="lp-mhab-out" data-i="' + i + '">0/31</span></div>'
        + '<div class="bar"><i></i></div><div style="display:none">' + num('habv' + i, '') + '</div></div>';
    });
    var left = '<div class="lp-eyebrow">Month ' + mm + ' &#183; Undated</div>'
      + '<div style="display:flex;align-items:center;gap:14px"><div class="lp-h lp-title">' + name + '</div>'
      + '<span class="ctx-nav"><a href="#' + prev + '">&#8249;</a><a href="#' + next + '">&#8250;</a></span></div>'
      + '<div class="cal" style="margin-top:10px">' + head + cells + '</div>';
    var right = '<div class="lp-label">Priorities</div>' + prio
      + '<div class="lp-label" style="margin-top:12px">Payments &amp; dates</div>' + pay
      + '<div class="lp-label" style="margin-top:12px">Habits this month</div>' + hb
      + '<div class="lp-label" style="margin-top:12px">Reflection</div>' + lines('refl', 3);
    return frame('month', '', '<div style="display:grid;grid-template-columns:1.55fr .9fr;gap:24px;height:100%">'
      + '<div style="min-width:0">' + left + '</div><div class="fill-tint" style="min-width:0;margin:-20px -64px -20px 0;padding:22px 64px 22px 24px">' + right + '</div></div>');
  }

  function buildWeek(kind, wn) {
    var nn = pad2(wn);
    var pfxId = kind === 'mon' ? 'wmon' : 'wsun';
    var prev = '#' + pfxId + '-' + pad2(wn > 1 ? wn - 1 : 52), next = '#' + pfxId + '-' + pad2(wn < 52 ? wn + 1 : 1);
    var days = kind === 'mon' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var cols = '';
    days.forEach(function (d, di) {
      var rows = '';
      for (var r = 0; r < 6; r++) rows += '<div class="row">' + cb('d' + di + 'c' + r) + f('d' + di + 't' + r) + '</div>';
      cols += '<div class="col"><div class="dh"><span class="lp-label">' + d + '</span><span class="d">' + f('d' + di + 'date', '', '') + '</span></div>' + rows + '</div>';
    });
    var top3 = '';
    for (var i = 0; i < 3; i++) top3 += '<div style="display:flex;gap:8px;align-items:center;padding:4px 0"><span class="lp-sub" style="font-size:15px">' + (i + 1) + '</span>' + f('top' + i) + '</div>';
    var habitRows = ['Water', 'Move', 'Read', 'Sleep 8h'], hb = '';
    var dh = kind === 'mon' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    var hhead = '<div style="display:grid;grid-template-columns:90px repeat(7,1fr);font-size:9px" class="lp-label"><span></span>';
    dh.forEach(function (d) { hhead += '<span style="text-align:center">' + d + '</span>'; });
    hhead += '</div>';
    habitRows.forEach(function (h, hi) {
      var t = '';
      for (var c = 0; c < 7; c++) t += '<span style="text-align:center">' + tg('h' + hi + 'd' + c) + '</span>';
      hb += '<div style="display:grid;grid-template-columns:90px repeat(7,1fr);align-items:center;padding:3px 0"><span style="font-size:11px">' + h + '</span>' + t + '</div>';
    });
    var inner = '<div class="lp-eyebrow">Week &#183; ' + (kind === 'mon' ? 'Monday' : 'Sunday') + ' start</div>'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-end">'
      + '<div style="display:flex;align-items:center;gap:12px"><div class="lp-h lp-title">Week ' + nn + '</div>'
      + '<span class="ctx-nav"><a href="' + prev + '">&#8249;</a><a href="' + next + '">&#8250;</a></span></div>'
      + '<div class="lp-sub" style="font-size:16px">Intention: ' + f('intention', '', '') + '</div></div>'
      + '<div class="wk" style="margin-top:12px;border-top:1px solid color-mix(in srgb,var(--c-deep) 40%,transparent);padding-top:8px">' + cols + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:22px;margin-top:14px">'
      + '<div><div class="lp-label">Top 3 of the week</div>' + top3 + '</div>'
      + '<div><div class="lp-label">Habits</div>' + hhead + hb + '</div>'
      + '<div><div class="lp-label">Notes</div>' + lines('note', 4) + '</div></div>';
    return frame('week', '', inner);
  }

  function buildDaily() {
    var three = '';
    for (var i = 0; i < 3; i++) three += '<div style="display:flex;gap:10px;align-items:center;padding:5px 0">' + cb('three' + i) + f('threet' + i) + '</div>';
    var sched = '';
    for (var h = 6; h <= 21; h++) sched += '<div style="display:flex;gap:10px;align-items:center;padding:4px 0;border-bottom:1px solid color-mix(in srgb,var(--c-deep) 32%,transparent)"><span class="lp-label" style="width:42px">' + pad2(h) + ':00</span>' + f('sch' + h) + '</div>';
    var todo = '';
    for (var t = 0; t < 7; t++) todo += '<div style="display:flex;gap:8px;align-items:center;padding:3px 0">' + cb('todo' + t) + f('todot' + t) + '</div>';
    var cups = '';
    for (var w = 0; w < 8; w++) cups += tg('water' + w, 'cup');
    var meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'], me = '';
    meals.forEach(function (m, i) { me += '<div style="display:flex;gap:8px;align-items:baseline;padding:4px 0"><span class="lp-label" style="width:70px">' + m + '</span>' + f('meal' + i) + '</div>'; });
    var hb = ['Move your body', 'Read', 'No screens', 'Vitamins', 'Journal'], hbh = '';
    hb.forEach(function (x, i) { hbh += '<div style="display:flex;gap:8px;align-items:center;padding:3px 0">' + cb('hab' + i) + '<span style="font-size:12px">' + x + '</span></div>'; });
    var quick = [['Weather', 'wx'], ['Mood', 'mood'], ['Sleep', 'sleep'], ['Water', 'wtr']], q = '';
    quick.forEach(function (c) { q += '<div class="card" style="padding:8px 10px;min-width:0"><div class="lp-label">' + c[0] + '</div>' + f(c[1]) + '</div>'; });
    var col1 = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + q + '</div>'
      + '<div class="lp-label" style="margin-top:12px">Schedule</div><div style="max-height:330px;overflow-y:auto">' + sched + '</div>'
      + '<div class="lp-label" style="margin-top:10px">Gratitude</div>' + lines('grat', 3);
    var col2 = '<div class="lp-label">The day\'s three</div>' + three
      + '<div class="card fill-tint" style="padding:12px;margin-top:8px"><div class="lp-label">Focus of the day</div>' + f('focus') + '</div>'
      + '<div class="lp-label" style="margin-top:12px">To-do</div>' + todo;
    var col3 = '<div class="lp-label">Water</div><div style="display:flex;gap:6px;flex-wrap:wrap">' + cups + '</div>'
      + '<div class="lp-label" style="margin-top:12px">Meals</div>' + me
      + '<div class="lp-label" style="margin-top:12px">Habits</div>' + hbh
      + '<div class="card fill-tint" style="padding:10px;margin-top:10px"><div class="lp-label">Highlight</div>' + f('highlight') + '</div>'
      + '<div class="lp-label" style="margin-top:10px">Notes</div>' + lines('note', 2);
    var inner = '<div style="display:flex;align-items:baseline;gap:16px"><div class="lp-h" style="font-size:64px">' + f('daynum', '00', '') + '</div>'
      + '<div><div class="lp-sub" style="font-size:26px">' + f('dayname', 'Weekday', '') + '</div><div class="lp-label">' + f('daymeta', 'Month · Week', '') + '</div></div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px;margin-top:10px">'
      + '<div style="min-width:0">' + col1 + '</div><div style="min-width:0">' + col2 + '</div><div style="min-width:0">' + col3 + '</div></div>';
    return frame('day', '', inner);
  }

  function buildHabit() {
    var names = ['', '', '', '', '', '', '', '', '', '', ''];
    var colnums = '<div class="colnums">';
    for (var c = 1; c <= 31; c++) colnums += '<span>' + c + '</span>';
    colnums += '</div>';
    var rows = '';
    names.forEach(function (_, ri) {
      var days = '<div class="days">';
      for (var c = 1; c <= 31; c++) days += tg('h' + ri + 'd' + c);
      days += '</div>';
      rows += '<div class="habitgrid" style="padding:3px 0;border-bottom:1px solid color-mix(in srgb,var(--c-deep) 32%,transparent)">'
        + '<div class="hname">' + f('hname' + ri, ri === 0 ? 'Habit…' : '') + '</div>' + days
        + '<div class="hsum lp-hsum" data-i="' + ri + '">0</div></div>';
    });
    var moods = ['😊', '🙂', '😐', '😔', '😫'], mh = '';
    moods.forEach(function (m, i) { mh += '<label style="cursor:pointer">' + radio('mood', String(i)) + '<span style="font-size:18px;opacity:.4" class="moodface">' + m + '</span></label>'; });
    var inner = '<div class="lp-eyebrow">Habit tracker &#183; Monthly</div>'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-end"><div class="lp-h lp-title">Daily consistency</div>'
      + '<div style="text-align:right"><div class="lp-label">Month</div><div class="lp-sub" style="font-size:18px">' + f('month', '', '') + '</div>'
      + '<div class="lp-label" style="margin-top:4px">Streak &#183; <span class="lp-streak">0</span> done</div></div></div>'
      + '<div class="habitgrid" style="margin-top:12px"><div></div>' + colnums + '<div class="lp-label" style="text-align:right">&#8721;</div></div>'
      + rows
      + '<div class="card fill-tint" style="margin-top:14px;padding:12px;display:flex;justify-content:space-between;align-items:center">'
      + '<div><div class="lp-label">Mood this month</div><div style="display:flex;gap:14px;margin-top:6px">' + mh + '</div></div>'
      + '<div class="lp-sub" style="font-size:16px">One day at a time, don\'t break the chain.</div></div>';
    return frame('day', 'wellness', inner);
  }

  function buildFinance() {
    var cats = ['Housing', 'Food', 'Transport', 'Leisure', 'Health', 'Savings', 'Subscriptions', 'Other'], cb2 = '';
    cats.forEach(function (c, i) {
      cb2 += '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;align-items:baseline">'
        + '<span style="font-size:13px"><span class="lp-catname" data-i="' + i + '">' + c + '</span></span>'
        + '<span style="font-size:11px" class="muted"><span class="lp-catspent" data-i="' + i + '">0</span>/' + num('catbud' + i, '0', 'catbud') + '&#8364;</span></div>'
        + '<div class="bar"><i></i></div></div>';
    });
    var n = financeRows();
    var inner = '<div style="display:grid;grid-template-columns:.9fr 1.1fr;gap:30px;height:100%">'
      + '<div style="min-width:0;display:flex;flex-direction:column">'
      + '<div class="lp-eyebrow">Finance &#183; Budget</div><div class="lp-h lp-title">Month in numbers</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:14px 0">'
      + '<div class="card stat" style="padding:10px"><div class="lp-label">In</div><div class="big lp-fin-in">0</div></div>'
      + '<div class="card stat" style="padding:10px"><div class="lp-label">Out</div><div class="big lp-fin-out">0</div></div>'
      + '<div class="card fill-tint stat" style="padding:10px"><div class="lp-label">Left</div><div class="big lp-fin-left">0</div></div></div>'
      + '<div class="lp-label">Categories</div>' + cb2
      + '<div class="card" style="margin-top:auto;padding:10px"><div class="lp-label">Note</div>' + f('note') + '</div></div>'
      + '<div style="min-width:0;display:flex;flex-direction:column">'
      + '<div class="lp-label">Expense log</div>'
      + '<div class="ledger" style="flex:1;min-height:0"><div class="lhead lp-label"><span>Date</span><span>Description</span><span>Category</span><span class="amt">Amount</span></div>'
      + '<div class="lrows">' + ledgerRows(n) + '</div></div>'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px;border-top:1px solid color-mix(in srgb,var(--c-deep) 44%,transparent);padding-top:8px">'
      + '<span class="lp-label">Month balance</span><span class="lp-h" style="font-size:34px;color:var(--c-deep)"><span class="lp-fin-bal">0</span> &#8364;</span></div></div></div>';
    return frame('month', 'finance', inner);
  }
  function financeRows() { var v = parseInt(lsGet(pfx('finance') + 'addcount') || '0', 10); return Math.max(9, v + 1); }
  function ledgerRows(n) {
    var h = '';
    for (var i = 0; i < n; i++) {
      h += '<div class="lrow"><span>' + f('r' + i + 'date', '') + '</span><span>' + f('r' + i + 'desc', '') + '</span>'
        + '<span>' + f('r' + i + 'cat', '') + '</span><span class="amt">' + num('r' + i + 'amt', '', 'amt') + '</span></div>';
    }
    return h;
  }

  function buildWellness() {
    var dh = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    var meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    var mhead = '<div style="display:grid;grid-template-columns:70px repeat(7,minmax(0,1fr))"><span></span>';
    dh.forEach(function (d) { mhead += '<span class="dow">' + d + '</span>'; });
    mhead += '</div>';
    var mrows = '';
    meals.forEach(function (m, mi) {
      var cells = '';
      for (var c = 0; c < 7; c++) cells += '<span style="border-left:1px solid color-mix(in srgb,var(--c-deep) 34%,transparent);min-width:0;padding:2px">' + f('m' + mi + 'd' + c, '', '') + '</span>';
      mrows += '<div style="display:grid;grid-template-columns:70px repeat(7,minmax(0,1fr));border-top:1px solid color-mix(in srgb,var(--c-deep) 34%,transparent);padding:6px 0;align-items:center"><span class="lp-label">' + m + '</span>' + cells + '</div>';
    });
    var water = '';
    dh.forEach(function (d, di) {
      var cups = '';
      for (var c = 0; c < 8; c++) cups += tg('w' + di + 'c' + c, 'cup');
      water += '<div style="display:flex;align-items:center;gap:8px;padding:2px 0"><span class="lp-label" style="width:14px">' + d + '</span><div style="display:flex;gap:5px">' + cups + '</div></div>';
    });
    var groc = '';
    for (var g = 0; g < 12; g++) groc += '<div style="display:flex;gap:6px;align-items:center;padding:3px 0;width:48%">' + cb('groc' + g) + f('groct' + g) + '</div>';
    var menu = [['10 min', 'Gentle stretch'], ['20 min', 'Warm bath'], ['15 min', 'Reading, no phone'], ['30 min', 'Outdoor walk'], ['5 min', 'Breathing'], ['45 min', 'Self-care afternoon']], mn = '';
    menu.forEach(function (x, i) { mn += '<div class="card" style="padding:8px 10px;min-width:0"><div class="lp-label">' + f('menut' + i, x[0], '') + '</div>' + f('menud' + i, x[1], '') + '</div>'; });
    var body = [['Energy', 'energy'], ['Stress', 'stress'], ['Rest', 'rest']], bd = '';
    body.forEach(function (b) { bd += '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><span>' + b[0] + '</span><span>' + num('bc-' + b[1], '', 'bcval') + '/10</span></div><div class="bar"><i></i></div></div>'; });
    var left = '<div class="lp-eyebrow">Wellness &#183; Week</div><div class="lp-h lp-title">Meals &amp; care</div>'
      + '<div class="lp-label" style="margin-top:12px">Meal planner</div>' + mhead + mrows
      + '<div class="lp-label" style="margin-top:14px">Daily water</div>' + water;
    var right = '<div class="lp-label">Grocery list</div><div style="display:flex;flex-wrap:wrap;justify-content:space-between">' + groc + '</div>'
      + '<div class="lp-label" style="margin-top:14px">Self-care menu</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px">' + mn + '</div>'
      + '<div class="card fill-tint" style="margin-top:14px;padding:12px"><div class="lp-label">Body check</div>' + bd + '</div>';
    return frame('week', 'selfcare', '<div style="display:grid;grid-template-columns:1.15fr .85fr;gap:24px;height:100%"><div style="min-width:0">' + left + '</div><div style="min-width:0">' + right + '</div></div>');
  }

  function buildProductivity() {
    var projects = ['', '', '', ''], pr = '';
    projects.forEach(function (_, pi) {
      var phases = '';
      for (var c = 0; c < 6; c++) phases += tg('p' + pi + 'ph' + c, 'sq');
      pr += '<div class="card" style="padding:12px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:baseline">'
        + '<span class="lp-sub" style="font-size:18px">' + f('projn' + pi, 'Project…', '') + '</span>'
        + '<span class="lp-label">' + f('projs' + pi, 'status', '') + ' &nbsp; <span class="lp-h lp-projpct" data-i="' + pi + '" style="font-size:18px">0%</span></span></div>'
        + '<div class="bar" style="margin:8px 0"><i></i></div>'
        + '<div style="display:flex;gap:8px;align-items:center"><span style="display:flex;gap:5px">' + phases + '</span><span class="lp-label">6 phases</span></div></div>';
    });
    var ms = '';
    for (var m = 0; m < 6; m++) ms += '<div style="display:flex;gap:10px;align-items:center;padding:5px 0">' + cb('ms' + m) + '<span style="flex:1">' + f('mst' + m) + '</span><span style="width:80px">' + f('msd' + m, '') + '</span></div>';
    var act = '';
    for (var a = 0; a < 5; a++) act += '<div style="display:flex;gap:8px;align-items:center;padding:3px 0">' + cb('act' + a) + f('actt' + a) + '</div>';
    var gb = [['Why', 'why'], ['Outcome', 'outcome'], ['Owner', 'owner'], ['Date', 'gdate']], gbh = '';
    gb.forEach(function (g) { gbh += '<div style="display:flex;gap:8px;align-items:baseline;padding:4px 0"><span class="lp-label" style="width:64px">' + g[0] + '</span>' + f('gb-' + g[1]) + '</div>'; });
    var left = '<div class="lp-eyebrow">Productivity &#183; Projects</div><div class="lp-h lp-title">In motion</div><div style="margin-top:14px">' + pr + '</div>';
    var right = '<div class="card fill-tint" style="padding:12px"><div class="lp-label">Goal breakdown</div>' + gbh + '</div>'
      + '<div class="lp-label" style="margin-top:14px">Milestones</div>' + ms
      + '<div class="lp-label" style="margin-top:14px">Actions this week</div>' + act;
    return frame('month', 'productivity', '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;height:100%"><div style="min-width:0">' + left + '</div><div style="min-width:0">' + right + '</div></div>');
  }

  function buildNotes() {
    return frame('notes', '', '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;height:100%">'
      + '<div style="min-width:0;padding-right:18px;border-right:1px solid color-mix(in srgb,var(--c-deep) 40%,transparent);display:flex;flex-direction:column">'
      + '<div style="display:flex;justify-content:space-between"><span class="lp-label">Ruled</span><span class="lp-sub" style="font-size:18px">To write</span></div>'
      + '<div class="notes-area ruled-bg" style="flex:1;margin-top:8px">' + ta('ruled') + '</div></div>'
      + '<div style="min-width:0;padding-left:18px;display:flex;flex-direction:column">'
      + '<div style="display:flex;justify-content:space-between"><span class="lp-label">Dotted</span><span class="lp-sub" style="font-size:18px">To sketch</span></div>'
      + '<div class="notes-area dotted-bg" style="flex:1;margin-top:8px">' + ta('dotted') + '</div></div></div>');
  }

  // ---- page registry ------------------------------------------------------
  var PAGES = []; // {id,label,build}
  function reg(id, label, build) { PAGES.push({ id: id, label: label, build: build }); }
  reg('cover', 'Cover', buildCover);
  reg('index', 'Index', buildIndex);
  reg('year', 'Year at a glance', buildYear);
  for (var m = 1; m <= 12; m++) (function (mi) { reg('month-' + pad2(mi + 1), MONTHS[mi], function () { return buildMonth(mi); }); })(m - 1);
  reg('daily', 'Daily', buildDaily);
  for (var w = 1; w <= 52; w++) (function (wn) { reg('wmon-' + pad2(wn), 'Week ' + pad2(wn) + ' · Mon', function () { return buildWeek('mon', wn); }); })(w);
  for (var w2 = 1; w2 <= 52; w2++) (function (wn) { reg('wsun-' + pad2(wn), 'Week ' + pad2(wn) + ' · Sun', function () { return buildWeek('sun', wn); }); })(w2);
  reg('habit', 'Habit tracker', buildHabit);
  reg('finance', 'Finance', buildFinance);
  reg('wellness', 'Wellness', buildWellness);
  reg('productivity', 'Productivity', buildProductivity);
  reg('notes', 'Notes', buildNotes);

  var ORDER = PAGES.map(function (p) { return p.id; });
  var byId = {}; PAGES.forEach(function (p) { byId[p.id] = p; });

  // ========================================================================
  //  RUNTIME
  // ========================================================================
  var stage, fit, toolbar, built = {}, current = null;

  function pageEl(id) { return document.getElementById('pg-' + id); }

  function buildPageOnce(id) {
    if (built[id]) return;
    var p = byId[id]; if (!p) return;
    var el = document.createElement('div');
    el.className = 'lp-page'; el.id = 'pg-' + id;
    el.innerHTML = p.build();
    stage.appendChild(el);
    built[id] = true;
    var tn = THEMES.filter(function (x) { return x.id === (lsGet('lp:theme') || DEFAULT_THEME); })[0] || THEMES[0];
    el.querySelectorAll('.js-theme-name').forEach(function (e) { e.textContent = tn.name; });
    el.querySelectorAll('.cover-wheel .cw').forEach(function (d) { d.classList.toggle('active', d.getAttribute('data-theme') === tn.id); });
    restorePage(el, id);
    updateDerived(el, id);
  }

  function restorePage(el, id) {
    var base = pfx(id);
    var inputs = el.querySelectorAll('input, textarea, select');
    inputs.forEach(function (inp) {
      if (inp.type === 'radio') {
        var v = lsGet(base + 'radio|' + inp.name);
        if (v !== null && inp.value === v) inp.checked = true;
      } else if (inp.type === 'checkbox') {
        var c = lsGet(base + inp.name);
        if (c !== null) inp.checked = c === '1';
      } else if (inp.name) {
        var t = lsGet(base + inp.name);
        if (t !== null) inp.value = t;
      }
    });
  }

  function onEdit(e) {
    var inp = e.target;
    if (!inp.name) return;
    var pg = inp.closest('.lp-page'); if (!pg) return;
    var id = pg.id.replace('pg-', ''); var base = pfx(id);
    if (inp.type === 'radio') { lsSet(base + 'radio|' + inp.name, inp.value); }
    else if (inp.type === 'checkbox') { lsSet(base + inp.name, inp.checked ? '1' : ''); }
    else { lsSet(base + inp.name, inp.value); }
    // finance ledger auto-grow
    if (id === 'finance') maybeGrowLedger(pg);
    updateDerived(pg, id);
  }

  function maybeGrowLedger(pg) {
    var rows = pg.querySelectorAll('.lrow');
    if (!rows.length) return;
    var last = rows[rows.length - 1];
    var filled = Array.prototype.some.call(last.querySelectorAll('input'), function (i) { return i.value.trim() !== ''; });
    if (filled) {
      var n = rows.length;
      var div = document.createElement('div');
      div.innerHTML = ledgerRows(n + 1);
      // append only the new last row
      var container = pg.querySelector('.lrows');
      var tmp = document.createElement('div'); tmp.innerHTML =
        '<div class="lrow"><span>' + f('r' + n + 'date') + '</span><span>' + f('r' + n + 'desc') + '</span><span>' + f('r' + n + 'cat') + '</span><span class="amt">' + num('r' + n + 'amt', '', 'amt') + '</span></div>';
      container.appendChild(tmp.firstChild);
      lsSet(pfx('finance') + 'addcount', String(n - 8));
    }
  }

  // ---- derived values -----------------------------------------------------
  function updateDerived(pg, id) {
    if (id === 'finance') deriveFinance(pg);
    else if (id === 'habit') deriveHabit(pg);
    else if (id === 'productivity') deriveProductivity(pg);
    else if (id.indexOf('month-') === 0) deriveMonth(pg);
    else if (id === 'wellness') deriveWellness(pg);
    else if (id === 'habit') {}
  }

  function val(pg, name) { var i = pg.querySelector('[name="' + name + '"]'); return i ? parseFloat((i.value || '').replace(',', '.')) || 0 : 0; }

  function deriveFinance(pg) {
    var rows = pg.querySelectorAll('.lrow'), inc = 0, exp = 0, catSpent = {};
    rows.forEach(function (r) {
      var amtI = r.querySelector('.amt input'); var catI = r.querySelectorAll('input')[2];
      var a = parseFloat((amtI.value || '').replace(',', '.')) || 0;
      if (a >= 0) inc += a; else exp += -a;
      var c = (catI.value || '').trim().toLowerCase();
      if (a < 0 && c) catSpent[c] = (catSpent[c] || 0) + (-a);
    });
    var left = inc - exp;
    setText(pg, '.lp-fin-in', fmt(inc)); setText(pg, '.lp-fin-out', fmt(exp));
    setText(pg, '.lp-fin-left', fmt(left)); setText(pg, '.lp-fin-bal', (left >= 0 ? '+' : '') + fmt(left));
    pg.querySelectorAll('.lp-catspent').forEach(function (sp) {
      var i = sp.getAttribute('data-i');
      var nameEl = pg.querySelector('.lp-catname[data-i="' + i + '"]');
      var cname = (nameEl ? nameEl.textContent : '').trim().toLowerCase();
      var spent = catSpent[cname] || 0;
      sp.textContent = fmt(spent);
      var bud = val(pg, 'catbud' + i);
      var bar = sp.closest('div').parentNode.querySelector('.bar > i');
      if (bar) bar.style.width = (bud > 0 ? Math.min(100, spent / bud * 100) : 0) + '%';
    });
  }
  function fmt(n) { return (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }

  function deriveHabit(pg) {
    var total = 0, named = 0;
    pg.querySelectorAll('.lp-hsum').forEach(function (sp) {
      var ri = sp.getAttribute('data-i');
      var nameI = pg.querySelector('[name="hname' + ri + '"]');
      var rowChecked = pg.querySelectorAll('[name^="h' + ri + 'd"]:checked').length;
      sp.textContent = rowChecked;
      if (nameI && nameI.value.trim()) { named++; total += rowChecked; }
    });
    setText(pg, '.lp-streak', total);
    // mood faces opacity
    pg.querySelectorAll('.lp-radio[name="mood"]').forEach(function (r) {
      var face = r.parentNode.querySelector('.moodface');
      if (face) face.style.opacity = r.checked ? '1' : '.4';
    });
  }

  function deriveProductivity(pg) {
    pg.querySelectorAll('.lp-projpct').forEach(function (sp) {
      var pi = sp.getAttribute('data-i');
      var ph = pg.querySelectorAll('[name^="p' + pi + 'ph"]');
      var done = pg.querySelectorAll('[name^="p' + pi + 'ph"]:checked').length;
      var pct = ph.length ? Math.round(done / ph.length * 100) : 0;
      sp.textContent = pct + '%';
      var bar = sp.closest('.card').querySelector('.bar > i');
      if (bar) bar.style.width = pct + '%';
    });
  }

  function deriveMonth(pg) {
    pg.querySelectorAll('.lp-mhab-out').forEach(function (sp) {
      // month habit bars are manual; reflect entered value/31 if numeric typed in title? keep 0/31 default
    });
  }
  function deriveWellness(pg) {
    pg.querySelectorAll('.bcval').forEach(function (i) {
      var v = parseFloat(i.value) || 0;
      var bar = i.closest('div').parentNode.querySelector('.bar > i');
      if (bar) bar.style.width = Math.min(100, v * 10) + '%';
    });
  }

  function setText(pg, sel, txt) { var e = pg.querySelector(sel); if (e) e.textContent = txt; }

  // ---- router -------------------------------------------------------------
  function resolveId(raw) {
    if (!raw) return 'cover';
    raw = raw.replace(/^#/, '');
    // sentinels (undated -> static fallbacks)
    if (raw === 'today') return 'daily';
    if (/-now$/.test(raw)) return raw.replace('-now', '-01');
    return byId[raw] ? raw : (byId[raw] ? raw : 'cover');
  }
  function show(raw) {
    var id = resolveId(raw);
    if (!byId[id]) id = 'cover';
    buildPageOnce(id);
    if (current && pageEl(current)) pageEl(current).classList.remove('is-active');
    var el = pageEl(id); el.classList.add('is-active');
    current = id;
    setToolbarLabel(byId[id].label);
    syncTopnav(el, id);
    el.scrollTop = 0;
    fitStage();
  }
  function syncTopnav(el, id) {
    // highlight handled at build by frame(); nothing dynamic required.
  }

  // ---- toolbar ------------------------------------------------------------
  function buildToolbar() {
    var dots = '';
    THEMES.forEach(function (t) { dots += '<button class="dot" data-theme="' + t.id + '" style="background:' + t.mid + '" title="' + t.name + '"></button>'; });
    toolbar.innerHTML =
      '<span class="brand">Linen Paper Co.</span>'
      + '<button class="nav-arrow" id="tb-prev" title="Previous">&#8249;</button>'
      + '<span class="pagelabel" id="tb-label"></span>'
      + '<button class="nav-arrow" id="tb-next" title="Next">&#8250;</button>'
      + '<button id="tb-index">Index</button>'
      + '<span class="sep"></span><span class="dots">' + dots + '</span><span class="sep"></span>'
      + '<span class="spacer"></span>'
      + '<button id="tb-export">Export</button><button id="tb-import">Import</button>'
      + '<button id="tb-clearpage">Clear page</button><button id="tb-clearall">Clear all</button>'
      + '<button id="tb-print">Print</button>'
      + '<input type="file" id="tb-file" accept="application/json" style="display:none">';
    on('#tb-prev', function () { nav(-1); });
    on('#tb-next', function () { nav(1); });
    on('#tb-index', function () { location.hash = '#index'; });
    on('#tb-export', exportData);
    on('#tb-import', function () { document.getElementById('tb-file').click(); });
    on('#tb-clearpage', clearPage);
    on('#tb-clearall', clearAll);
    on('#tb-print', function () { window.print(); });
    document.getElementById('tb-file').addEventListener('change', importData);
    toolbar.querySelectorAll('.dot').forEach(function (d) { d.addEventListener('click', function () { applyTheme(d.getAttribute('data-theme')); }); });
  }
  function on(sel, fn) { var e = toolbar.querySelector(sel); if (e) e.addEventListener('click', fn); }
  function setToolbarLabel(t) { var e = document.getElementById('tb-label'); if (e) e.innerHTML = t; }
  function nav(dir) {
    var i = ORDER.indexOf(current); if (i < 0) i = 0;
    var j = Math.min(ORDER.length - 1, Math.max(0, i + dir));
    location.hash = '#' + ORDER[j];
  }

  function exportData() {
    var keys = allKeys(), data = {};
    keys.forEach(function (k) { data[k] = lsGet(k); });
    var payload = { app: 'Linen Paper Co.', doc: DOC_ID, version: 1, date: new Date().toISOString(), theme: lsGet('lp:theme') || DEFAULT_THEME, data: data };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = DOC_ID + '-datos.json';
    document.body.appendChild(a); a.click(); a.remove();
  }
  function importData(e) {
    var file = e.target.files[0]; if (!file) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var p = JSON.parse(rd.result);
        var data = p.data || p;
        Object.keys(data).forEach(function (k) { if (k.indexOf('lp:' + DOC_ID + ':') === 0) lsSet(k, data[k]); });
        if (p.theme) lsSet('lp:theme', p.theme);
        location.reload();
      } catch (err) { alert('Invalid file.'); }
    };
    rd.readAsText(file);
    e.target.value = '';
  }
  function clearPage() {
    if (!current) return;
    if (!confirm('Clear this page? (' + byId[current].label + ')')) return;
    var base = pfx(current);
    allKeys().forEach(function (k) { if (k.indexOf(base) === 0) lsDel(k); });
    location.reload();
  }
  function clearAll() {
    if (!confirm('Clear ALL data in this planner? This cannot be undone.')) return;
    allKeys().forEach(function (k) { lsDel(k); });
    location.reload();
  }

  // ---- theme --------------------------------------------------------------
  function applyTheme(id) {
    var t = THEMES.filter(function (x) { return x.id === id; })[0] || THEMES[0];
    document.documentElement.setAttribute('data-theme', t.id);
    lsSet('lp:theme', t.id);
    document.querySelectorAll('.js-theme-name').forEach(function (e) { e.textContent = t.name; });
    toolbar.querySelectorAll('.dot').forEach(function (d) { d.classList.toggle('active', d.getAttribute('data-theme') === t.id); });
    document.querySelectorAll('.cover-wheel .cw').forEach(function (d) { d.classList.toggle('active', d.getAttribute('data-theme') === t.id); });
  }
  function wireCoverWheel() {
    document.addEventListener('click', function (e) {
      var cw = e.target.closest && e.target.closest('.cover-wheel .cw');
      if (cw) applyTheme(cw.getAttribute('data-theme'));
    });
  }

  // ---- scaling ------------------------------------------------------------
  function fitStage() {
    var pad = 24;
    var vw = window.innerWidth, vh = window.innerHeight;
    var th = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--toolbar-h')) || 46;
    var s = Math.min((vw - pad) / PAGE_W, (vh - th - pad) / PAGE_H);
    s = Math.max(0.1, s);
    stage.style.transform = 'scale(' + s + ')';
    fit.style.width = (PAGE_W * s) + 'px';
    fit.style.height = (PAGE_H * s) + 'px';
  }

  // ---- boot ---------------------------------------------------------------
  function boot() {
    toolbar = document.getElementById('lp-toolbar');
    fit = document.getElementById('lp-fit');
    stage = document.getElementById('lp-stage');
    buildToolbar();
    wireCoverWheel();
    applyTheme(lsGet('lp:theme') || DEFAULT_THEME);
    stage.addEventListener('input', onEdit);
    stage.addEventListener('change', onEdit);
    window.addEventListener('hashchange', function () { show(location.hash); });
    window.addEventListener('resize', fitStage);
    document.addEventListener('keydown', function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { nav(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { nav(-1); e.preventDefault(); }
    });
    show(location.hash || '#cover');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
