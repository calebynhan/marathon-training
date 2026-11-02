// Decides whose plan this device shows, and runs the "make your plan" screen.
//   /me            Caleb's plan (data.js) plus his Strava runs (/api/done)
//   anywhere else  the plan saved on this device, or the setup screen
(() => {
  const STORE = "miles.plan.v1";
  const OWNER_META = {
    owner: true,
    easy: "9:15–10:15", hrEasy: 150,
    long: "9:30–10:15", longLate: "9:00–9:45", longSwitch: 14, hrLong: 155,
  };

  const isOwner = location.pathname.replace(/\/+$/, "") === "/me";
  window.MILES_STORE = STORE;

  if (isOwner) {
    window.PLAN_META = OWNER_META;
    return;
  }

  window.DONE = {};
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { saved = null; }
  if (saved && Array.isArray(saved.plan) && saved.plan.length) {
    window.PLAN = saved.plan;
    window.PLAN_META = saved.meta || {};
    return;
  }

  window.PLAN = null;
  document.addEventListener("DOMContentLoaded", showSetup);
  if (document.readyState !== "loading") showSetup();

  function showSetup() {
    if (showSetup.done) return;
    showSetup.done = true;
    const $ = (id) => document.getElementById(id);
    $("setup").hidden = false;
    $("day").hidden = true;
    $("cal").hidden = true;
    $("viewBtn").hidden = true;
    const brand = $("dateBtn");
    brand.textContent = "Miles";
    brand.classList.add("is-today");
    brand.disabled = true;

    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    $("fDate").min = today;

    document.querySelectorAll(".seg").forEach((seg) => {
      seg.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      });
    });
    const segVal = (name) => {
      const b = document.querySelector(`.seg[data-name="${name}"] [aria-checked="true"]`);
      return b ? Number(b.dataset.v) : null;
    };

    const form = $("setupForm");
    const err = $("formErr");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = "";
      const body = {
        race: $("fRace").value.trim(),
        distance: segVal("distance"),
        date: $("fDate").value,
        goal: $("fGoal").value.trim(),
        weekly: $("fWeekly").value,
        longest: $("fLongest").value,
        days: segVal("days"),
        notes: $("fNotes").value.trim(),
        code: $("fCode").value.trim(),
        today,
      };
      if (!body.date) return fail("Pick a race date.", $("fDate"));
      if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(body.goal)) return fail("Goal time looks like 3:30.", $("fGoal"));
      if (body.weekly === "") return fail("Add your miles a week. 0 is fine.", $("fWeekly"));
      if (body.longest === "") return fail("Add your longest recent run. 0 is fine.", $("fLongest"));

      const weeks = Math.min(30, Math.max(4, Math.round((new Date(body.date) - now) / 6048e5) + 1));
      const expect = weeks * 7 * 52;
      form.hidden = true;
      $("making").hidden = false;
      setMeter(0.03);

      try {
        const r = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.body) throw new Error("no body");
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = "", result = null;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            const msg = JSON.parse(line);
            if (msg.p) setMeter(Math.min(0.96, 0.03 + msg.p / expect));
            if (msg.error || msg.plan) result = msg;
          }
        }
        if (!result) throw new Error("no result");
        if (result.error) {
          if (/access code/i.test(result.error)) $("codeField").hidden = false;
          return back(result.error);
        }
        setMeter(1);
        try {
          localStorage.setItem(STORE, JSON.stringify({ plan: result.plan, meta: result.meta, made: today }));
        } catch (e3) {
          return back("Your browser blocked saving the plan. Turn off Private Browsing and try again.");
        }
        setTimeout(() => location.replace(location.pathname), 350);
      } catch (e2) {
        back("Couldn't reach the plan writer. Check your connection and try again.");
      }
    });

    function setMeter(f) {
      $("meterFill").style.width = `${Math.round(f * 100)}%`;
      document.querySelector(".meter").setAttribute("aria-valuenow", String(Math.round(f * 100)));
    }
    function back(msg) {
      $("making").hidden = true;
      form.hidden = false;
      fail(msg);
    }
    function fail(msg, el) {
      err.textContent = msg;
      if (el) el.focus();
    }
  }
})();
