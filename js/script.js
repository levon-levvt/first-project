document.addEventListener("DOMContentLoaded", function () {

  // --- Konfiguration ---
  const birthDate     = new Date(1991, 5, 28, 0, 0, 0);
  const today         = new Date();

  // --- Live-Counter ---
  const counterEl = document.getElementById("life-counter");
  function updateCounter() {
    const seconds = Math.floor((new Date() - birthDate) / 1000);
    counterEl.textContent = seconds.toLocaleString("de-DE");
  }
  updateCounter();
  setInterval(updateCounter, 1000);
  const lifeYears     = 90;
  const bufferYears   = 1;
  const monthsPerYear = 12;

  const startOffset  = bufferYears * monthsPerYear;           // 12
  const lifeMonths   = lifeYears * monthsPerYear;             // 1080
  const endOffset    = startOffset + lifeMonths;              // 1092
  const totalPoints  = (lifeYears + bufferYears * 2) * 12;   // 1104

  // --- Kategorien ---
  const categories = [
    {
      name: "study",
      color: "#3dff64",
      events: [
        { start: new Date(1996, 5, 28), end: new Date(2009, 5, 28), tooltip: "fachoberschulreife" },
        { start: new Date(2009, 5, 28), end: new Date(2012, 5, 28), tooltip: "fachhochschulreife design" },
        { start: new Date(2012, 5, 28), end: new Date(2021, 5, 28), tooltip: "bachelor of arts kommunikationsdesign" }
      ]
    },
    {
      name: "job",
      color: "#0000ff",
      events: [
        { start: new Date(2015, 0, 1),  end: new Date(2016, 11, 31), tooltip: "startup: vielfalt" },
        { start: new Date(2017, 2, 1),  end: new Date(2018, 4, 31),  tooltip: "startup: arody" },
        { start: new Date(2021, 6, 28), end: today,                  tooltip: "learning experience design" }
      ]
    },
    {
      name: "places",
      color: "#ff8c42",
      events: [
        { start: new Date(1991, 5, 28),  end: new Date(2012, 8, 18), tooltip: "mülheim an der ruhr" },
        { start: new Date(2012, 8, 19),  end: new Date(2021, 5, 27), tooltip: "krefeld" },
        { start: new Date(2021, 5, 28),  end: today,                 tooltip: "wuppertal" },
        { start: new Date(2011, 8, 19),  end: new Date(2011, 9, 9),  tooltip: "tampere, finnland" },
        { start: new Date(2015, 9, 1),   end: new Date(2016, 1, 5),  tooltip: "krakau, polen" },
        { start: new Date(2017, 2, 1),   end: new Date(2018, 4, 31), tooltip: "augsburg, bayern" }
      ]
    },
    {
      name: "baseline",
      color: "#7c7cff",
      events: [
        { startAge:  0, endAge:  3, tooltip: "frühe kindheit" },
        { startAge:  3, endAge:  6, tooltip: "kindergarten" },
        { startAge:  6, endAge: 16, tooltip: "schule" },
        { startAge: 16, endAge: 30, tooltip: "ausbildung / studium" },
        { startAge: 30, endAge: 67, tooltip: "karriere" },
        { startAge: 67, endAge: 90, tooltip: "ruhestand" }
      ]
    }
  ];

  // --- State ---
  let activeCategoryIndex = -1;

  const livedMonthsRaw =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth()   - birthDate.getMonth());

  const livedMonths = Math.max(0, Math.min(startOffset + livedMonthsRaw, totalPoints));
  const blinkIndex  = Math.max(0, Math.min(livedMonths - 1, totalPoints - 1));

  const lifespanContainer        = document.getElementById("lifespan");
  const categoryButtonsContainer = document.getElementById("category-buttons");

  // --- Farb-Hilfsfunktionen ---
  function hexToRgb(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function hexToRgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function lightenColor(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    return {
      r: Math.round(r + (255 - r) * amount),
      g: Math.round(g + (255 - g) * amount),
      b: Math.round(b + (255 - b) * amount)
    };
  }

  function gradientColors(color, steps) {
    if (steps <= 1) {
      const { r, g, b } = hexToRgb(color);
      return [`rgb(${r},${g},${b})`];
    }
    const end   = hexToRgb(color);
    const start = lightenColor(color, 0.9);
    return Array.from({ length: steps }, (_, i) => {
      const t = i / (steps - 1);
      const r = Math.round(start.r + (end.r - start.r) * t);
      const g = Math.round(start.g + (end.g - start.g) * t);
      const b = Math.round(start.b + (end.b - start.b) * t);
      return `rgb(${r},${g},${b})`;
    });
  }

  // --- Index-Hilfsfunktionen ---
  function getMonthIndex(date) {
    return (date.getFullYear() - birthDate.getFullYear()) * 12
         + (date.getMonth()   - birthDate.getMonth());
  }

  function toIndex(date) {
    return startOffset + getMonthIndex(date);
  }

  // --- Tooltip ---
  function createTooltip(text, color) {
    const t = document.createElement("div");
    t.textContent = text;
    Object.assign(t.style, {
      position:    "absolute",
      bottom:      "160%",
      left:        "50%",
      transform:   "translateX(-50%)",
      background:  "white",
      color:       "#000",
      padding:     "5px 10px",
      borderRadius:"6px",
      whiteSpace:  "nowrap",
      fontSize:    "12px",
      visibility:  "hidden",
      opacity:     "0",
      pointerEvents:"none",
      zIndex:      "9999",
      boxShadow:   color
                     ? `0px 4px 10px ${hexToRgba(color, 0.35)}`
                     : "0px 4px 10px rgba(0,0,0,0.25)",
      textTransform:"lowercase"
    });
    return t;
  }

  function clampTooltip(tooltip) {
    const rect = tooltip.getBoundingClientRect();
    const vw   = window.innerWidth;
    if (rect.left < 0) {
      tooltip.style.left      = "0";
      tooltip.style.transform = "translateX(0)";
    } else if (rect.right > vw) {
      tooltip.style.left      = "auto";
      tooltip.style.right     = "0";
      tooltip.style.transform = "translateX(0)";
    } else {
      tooltip.style.left      = "50%";
      tooltip.style.transform = "translateX(-50%)";
    }
  }

  // --- Hintergrund-Glow ---
  const bgGlow = document.getElementById("bg-glow");

  function setBackgroundGlow(color) {
    if (!bgGlow) return;
    if (!color) {
      bgGlow.style.background = "transparent";
      return;
    }
    const { r, g, b } = hexToRgb(color);
    bgGlow.style.background =
      `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(${r},${g},${b},0.12) 0%, transparent 70%)`;
  }

  // --- Buttons ---
  categories.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.textContent = cat.name.toLowerCase();
    Object.assign(btn.style, {
      padding:         "5px 14px",
      color:           cat.color,
      border:          `1px solid ${hexToRgba(cat.color, 0.6)}`,
      borderRadius:    "999px",
      cursor:          "pointer",
      outline:         "none",
      transition:      "box-shadow 0.25s, background 0.25s",
      fontSize:        "12px",
      letterSpacing:   "0.04em",
      textTransform:   "lowercase",
      fontFamily:      "inherit"
    });

    btn.addEventListener("click", () => {
      activeCategoryIndex = (activeCategoryIndex === index) ? -1 : index;
      Array.from(categoryButtonsContainer.children).forEach(b => {
        b.style.boxShadow = "none";
      });
      if (activeCategoryIndex === index) {
        btn.style.boxShadow = `0 0 0 3px ${hexToRgba(cat.color, 0.2)}, 0 4px 12px ${hexToRgba(cat.color, 0.25)}`;
        setBackgroundGlow(cat.color);
      } else {
        setBackgroundGlow(null);
      }
      buildGrid();
    });

    categoryButtonsContainer.appendChild(btn);
  });

  // --- Grid ---
  function buildGrid() {
    lifespanContainer.innerHTML = "";

    const eventMap = {};

    if (activeCategoryIndex >= 0) {
      const cat        = categories[activeCategoryIndex];
      const isBaseline = cat.name === "baseline";

      cat.events.forEach((event, ei) => {
        let startIdx, endIdx;

        if (isBaseline) {
          startIdx = startOffset + event.startAge * 12;
          endIdx   = startOffset + event.endAge   * 12 - 1;
        } else {
          startIdx = toIndex(event.start);
          endIdx   = toIndex(event.end);
        }

        startIdx = Math.max(startIdx, startOffset);
        endIdx   = Math.min(endIdx,   endOffset - 1);

        const cap = isBaseline
          ? endOffset - 1
          : Math.min(livedMonths - 1, endOffset - 1);
        endIdx = Math.min(endIdx, cap);

        const steps = endIdx - startIdx + 1;
        if (steps <= 0) return;

        const colors  = gradientColors(cat.color, steps);
        const groupId = `event-${ei}`;

        for (let i = startIdx; i <= endIdx; i++) {
          eventMap[i] = { color: colors[i - startIdx], tooltip: event.tooltip, groupId };
        }
      });
    }

    for (let i = 0; i < totalPoints; i++) {
      const point = document.createElement("div");

      // Liminal-Zone
      if (i < startOffset || i >= endOffset) {
        point.className = "point liminal";
        const t = createTooltip(i < startOffset ? "1 jahr vor dem leben" : "1 jahr nach dem leben");
        point.appendChild(t);
        point.addEventListener("mouseenter", () => {
          t.style.visibility = "visible";
          t.style.opacity    = "1";
          clampTooltip(t);
        });
        point.addEventListener("mouseleave", () => {
          t.style.visibility = "hidden";
          t.style.opacity    = "0";
        });
        lifespanContainer.appendChild(point);
        continue;
      }

      // Lebensbereich
      point.className = "point";
      const ev = eventMap[i];
      point.style.backgroundColor = ev ? ev.color : (i < livedMonths ? "rgba(58,58,58,0.75)" : "rgba(58,58,58,0.14)");

      if (i === blinkIndex) {
        point.style.animation = "blink 1s infinite";
      }

      if (ev && activeCategoryIndex >= 0) {
        const cat = categories[activeCategoryIndex];
        point.dataset.groupId = ev.groupId;
        point.style.cursor    = "pointer";

        const t = createTooltip(ev.tooltip, cat.color);
        point.appendChild(t);

        point.addEventListener("mouseenter", () => {
          lifespanContainer.querySelectorAll(`[data-group-id='${ev.groupId}']`).forEach(p => {
            p.dataset.origBg     = p.style.backgroundColor;
            p.dataset.origBorder = p.style.border;
            p.style.backgroundColor = "transparent";
            p.style.border          = `1px solid ${cat.color}`;
          });
          t.style.visibility = "visible";
          t.style.opacity    = "1";
          clampTooltip(t);
        });

        point.addEventListener("mouseleave", () => {
          lifespanContainer.querySelectorAll(`[data-group-id='${ev.groupId}']`).forEach(p => {
            p.style.backgroundColor = p.dataset.origBg     || "";
            p.style.border          = p.dataset.origBorder || "";
          });
          t.style.visibility = "hidden";
          t.style.opacity    = "0";
        });
      }

      lifespanContainer.appendChild(point);
    }
  }

  buildGrid();
});
