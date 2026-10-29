(() => {
  const PLAN = window.PLAN;
  const byDate = new Map(PLAN.map((d, i) => [d.d, i]));
  const $ = (id) => document.getElementById(id);

  const STRENGTH = {
    A: [
      ["Single-leg calf raise", "3 × 15 each"],
      ["Split squat", "3 × 10 each"],
      ["Single-leg glute bridge", "3 × 10 each"],
      ["Front plank", "3 × 40 s"],
      ["Dead bug", "2 × 10 each"],
    ],
    B: [
      ["Bent-knee calf raise", "3 × 15 each"],
      ["Step-up", "3 × 10 each"],
      ["Single-leg deadlift", "3 × 8 each"],
      ["Side plank", "2 × 30 s each"],
      ["Band walk or side leg raise", "2 × 15 each"],
    ],
  };

  const ICON_CAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
  const ICON_DAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M9 9.5h6M9 13h6M9 16.5h3"/></svg>';
  const ICON_STR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11"/></svg>';

  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const parse = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtMi = (mi) => (Number.isInteger(mi) ? String(mi) : mi.toFixed(1));
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const todayKey = () => keyOf(new Date());
  const clampIndex = (k) => {
    if (byDate.has(k)) return byDate.get(k);
    return k < PLAN[0].d ? 0 : PLAN.length - 1;
  };

  let sel = clampIndex(todayKey());
  let view = "day";

  const weekTotals = {};
  PLAN.forEach((d) => { weekTotals[d.w] = (weekTotals[d.w] || 0) + d.mi; });

  function paceLine(d) {
    switch (d.t) {
      case "Easy": case "Recovery": case "Shakeout": case "Medium-long":
        return "<b>9:15–10:15</b> /mi, heart rate under 150";
      case "Long":
        return (d.w <= 13 ? "<b>9:30–10:15</b>" : "<b>9:00–9:45</b>") + " /mi, heart rate under 155";
      default:
        return "";
    }
  }

  function renderDay(animate) {
    const d = PLAN[sel];
    const dt = parse(d.d);
    const isToday = d.d === todayKey();

    const dateBtn = $("dateBtn");
    dateBtn.innerHTML = `${weekdays[dt.getDay()]}, ${months[dt.getMonth()]} ${dt.getDate()}` + (isToday ? '<span class="dot" aria-hidden="true"></span>' : "");
    dateBtn.classList.toggle("is-today", isToday);

    $("type").textContent = d.mi === 0 ? "" : d.t;

    const miles = $("miles");
    miles.className = "miles";
    if (d.mi === 0) {
      miles.textContent = "Rest";
      miles.classList.add("word");
    }
    $("sprig").toggleAttribute("hidden", d.mi !== 0);
    if (d.mi !== 0) {
      miles.innerHTML = `${fmtMi(d.mi)}<small>mi</small>`;
      if (d.t === "Race") miles.classList.add("race");
    }

    const steps = $("steps");
    steps.innerHTML = "";
    const list = d.t === "Done" ? [] : d.x;
    list.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      if (/@|all-out|race,|uphill|×/.test(s) && !/warm-up|cool-down/.test(s)) li.className = "main";
      steps.appendChild(li);
    });

    $("pace").innerHTML = d.t === "Done" ? `Done at <b>${d.x[0]}</b>` : paceLine(d);

    const chip = $("strength");
    if (d.s) {
      chip.hidden = false;
      chip.innerHTML = `${ICON_STR}Strength ${d.s}`;
      chip.setAttribute("aria-label", `Strength session ${d.s}, show exercises`);
    } else chip.hidden = true;

    renderRibbon(d);

    const hero = $("hero");
    if (animate) { hero.classList.remove("swap"); void hero.offsetWidth; hero.classList.add("swap"); }

    $("prev").disabled = sel === 0;
    $("next").disabled = sel === PLAN.length - 1;
  }

  function renderRibbon(d) {
    const ribbon = $("ribbon");
    ribbon.innerHTML = "";
    const week = PLAN.filter((x) => x.w === d.w);
    const scale = Math.max(8, ...week.map((x) => x.mi));
    const today = todayKey();
    week.forEach((x) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bar-day";
      if (x.mi === 0) b.classList.add("rest");
      if (x.d === d.d) b.classList.add("on");
      if (x.d === today) b.classList.add("today");
      const dt = parse(x.d);
      const h = x.mi === 0 ? 4 : Math.max(10, (x.mi / scale) * 92);
      b.innerHTML = `<span class="n">${x.mi ? fmtMi(x.mi) : ""}</span><span class="b" style="height:${h}px"></span><span class="l">${weekdays[dt.getDay()][0]}</span>`;
      b.setAttribute("aria-label", `${weekdays[dt.getDay()]}, ${x.mi ? fmtMi(x.mi) + " miles" : "rest"}`);
      b.addEventListener("click", () => go(byDate.get(x.d)));
      ribbon.appendChild(b);
    });
    $("wk").innerHTML = `Week ${d.w}&ensp;<b>${fmtMi(Math.round(weekTotals[d.w] * 10) / 10)} mi</b>`;
  }

  function cellColor(mi) {
    if (!mi) return null;
    const a = Math.min(1, 0.14 + 0.86 * Math.pow(Math.min(mi, 22) / 22, 0.85));
    return { bg: `rgba(104, 150, 58, ${a.toFixed(3)})`, fg: a > 0.55 ? "#fff" : "#22321c" };
  }

  function renderCal() {
    const grid = $("grid");
    grid.innerHTML = "";
    const today = todayKey();
    const curWeek = PLAN[clampIndex(today)].w;
    const weeks = [...new Set(PLAN.map((d) => d.w))];
    let lastMonth = -1;

    weeks.forEach((w) => {
      const days = PLAN.filter((d) => d.w === w);
      const first = parse(days[0].d);
      const monthStart = days.find((d) => parse(d.d).getDate() === 1);
      const m = monthStart ? parse(monthStart.d).getMonth() : first.getMonth();
      if (m !== lastMonth && (monthStart || lastMonth === -1)) {
        const h = document.createElement("h3");
        h.className = "month";
        const yr = monthStart ? parse(monthStart.d).getFullYear() : first.getFullYear();
        h.textContent = monthsLong[m] + (m === 0 || lastMonth === -1 ? ` ${yr}` : "");
        grid.appendChild(h);
        lastMonth = m;
      }

      const row = document.createElement("div");
      row.className = "row" + (w === curWeek ? " current" : "");
      row.setAttribute("role", "row");
      row.innerHTML = `<span class="w">W${w}</span>`;
      days.forEach((d) => {
        const c = document.createElement("button");
        c.type = "button";
        c.className = "cell";
        c.setAttribute("role", "gridcell");
        const dt = parse(d.d);
        const col = cellColor(d.mi);
        if (col) { c.style.background = col.bg; c.style.color = col.fg; }
        if (d.t === "Race") c.classList.add("race");
        if (d.d === today) c.classList.add("today");
        if (d.d < today) c.classList.add("past");
        c.textContent = d.mi ? fmtMi(d.mi) : "";
        c.setAttribute("aria-label", `${weekdays[dt.getDay()]} ${months[dt.getMonth()]} ${dt.getDate()}, ${d.mi ? fmtMi(d.mi) + " miles " + d.t : "rest"}`);
        c.addEventListener("click", () => { sel = byDate.get(d.d); setView("day"); });
        row.appendChild(c);
      });
      const t = document.createElement("span");
      t.className = "t";
      t.textContent = fmtMi(Math.round(weekTotals[w] * 10) / 10);
      row.appendChild(t);
      grid.appendChild(row);
    });
  }

  function setView(v, fromHash) {
    view = v;
    document.body.classList.toggle("on-cal", v === "cal");
    $("day").hidden = v !== "day";
    $("cal").hidden = v !== "cal";
    const btn = $("viewBtn");
    btn.innerHTML = v === "day" ? ICON_CAL : ICON_DAY;
    btn.setAttribute("aria-label", v === "day" ? "Show calendar" : "Show day");
    if (v === "cal") {
      renderCal();
      $("dateBtn").innerHTML = "Plan";
      $("dateBtn").classList.add("is-today");
      const cur = document.querySelector(".row.current");
      if (cur) cur.scrollIntoView({ block: "center" });
    } else renderDay(true);
    if (!fromHash) history.replaceState(null, "", v === "cal" ? "#calendar" : `#${PLAN[sel].d}`);
  }

  function go(i) {
    if (i < 0 || i >= PLAN.length || i === sel) return;
    sel = i;
    renderDay(true);
    history.replaceState(null, "", `#${PLAN[sel].d}`);
  }

  // Events
  $("viewBtn").addEventListener("click", () => setView(view === "day" ? "cal" : "day"));
  $("dateBtn").addEventListener("click", () => { sel = clampIndex(todayKey()); setView("day"); });
  $("prev").addEventListener("click", () => go(sel - 1));
  $("next").addEventListener("click", () => go(sel + 1));
  document.addEventListener("keydown", (e) => {
    if (!$("sheet").hidden) { if (e.key === "Escape") closeSheet(); return; }
    if (view !== "day") return;
    if (e.key === "ArrowLeft") go(sel - 1);
    if (e.key === "ArrowRight") go(sel + 1);
  });

  let sx = null, sy = null;
  const day = $("day");
  day.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  day.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(sel + (dx < 0 ? 1 : -1));
    sx = sy = null;
  });

  // Strength sheet
  let lastFocus = null;
  function openSheet() {
    const d = PLAN[sel];
    if (!d.s) return;
    lastFocus = document.activeElement;
    $("sheetTitle").textContent = `Strength ${d.s}`;
    $("sheetList").innerHTML = STRENGTH[d.s].map(([n, r]) => `<li><span>${n}</span><span>${r}</span></li>`).join("");
    let note = "15 minutes. Rest 30–45 s between sets. Stop with reps in the tank.";
    if (d.w === 24) note = "Taper week: keep it light.";
    else if (d.w >= 8) note += " Add a loaded backpack or a set once it feels easy.";
    $("sheetNote").textContent = note;
    $("sheet").hidden = false;
    $("sheet").querySelector(".done").focus();
  }
  function closeSheet() {
    $("sheet").hidden = true;
    if (lastFocus) lastFocus.focus();
  }
  $("strength").addEventListener("click", openSheet);
  $("sheet").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });

  // Routing
  function fromHash() {
    const h = location.hash.slice(1);
    if (h === "calendar") return setView("cal", true);
    if (byDate.has(h)) sel = byDate.get(h);
    setView("day", true);
  }
  window.addEventListener("hashchange", fromHash);
  fromHash();

  // Refresh "today" when the app is reopened on a new day
  let lastToday = todayKey();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && todayKey() !== lastToday) {
      lastToday = todayKey();
      sel = clampIndex(lastToday);
      setView("day");
    }
  });
})();
