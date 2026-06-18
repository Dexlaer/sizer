const presets = [
  { label: "16:9", w: 1920, h: 1080 },
  { label: "9:16", w: 1080, h: 1920 },
  { label: "1:1", w: 1080, h: 1080 },
  { label: "4:5", w: 1080, h: 1350 },
  { label: "5:4", w: 1350, h: 1080 },
  { label: "4:3", w: 1440, h: 1080 },
  { label: "3:2", w: 3000, h: 2000 },
  { label: "2:3", w: 2000, h: 3000 },
  { label: "21:9", w: 2560, h: 1080 },
  { label: "2.39:1", w: 2389, h: 1000 },
];

const elements = {
  area: document.querySelector("#scale-area"),
  frame: document.querySelector("#frame-wrap"),
  empty: document.querySelector("#empty-state"),
  widthInput: document.querySelector("#width-input"),
  heightInput: document.querySelector("#height-input"),
  widthLabel: document.querySelector("#width-label"),
  heightLabel: document.querySelector("#height-label"),
  centerLabel: document.querySelector("#center-label"),
  ratioValue: document.querySelector("#ratio-value"),
  chipRatio: document.querySelector("#chip-ratio"),
  pixelsValue: document.querySelector("#pixels-value"),
  orientationValue: document.querySelector("#orientation-value"),
  orientationGlyph: document.querySelector("#orientation-glyph"),
  swapButton: document.querySelector("#swap-button"),
  presets: document.querySelector("#presets"),
};

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function ratioString(w, h) {
  const divisor = gcd(w, h);
  const rw = w / divisor;
  const rh = h / divisor;

  if (rw <= 50 && rh <= 50) {
    return `${rw} : ${rh}`;
  }

  const decimal = w / h;
  return decimal >= 1 ? `${decimal.toFixed(2)} : 1` : `1 : ${(1 / decimal).toFixed(2)}`;
}

function megapixelsString(w, h) {
  const value = (w * h) / 1e6;
  return value >= 100 ? `${Math.round(value)} МП` : `${value.toFixed(2)} МП`;
}

function clean(value) {
  return value.replace(/[^\d]/g, "").slice(0, 6);
}

function getSize() {
  const w = Number.parseInt(elements.widthInput.value, 10) || 0;
  const h = Number.parseInt(elements.heightInput.value, 10) || 0;
  return { w, h, valid: w >= 1 && h >= 1 };
}

function orientation(w, h) {
  if (w > h) return "Горизонтальная";
  if (w < h) return "Вертикальная";
  return "Квадрат";
}

function fitFrame(w, h) {
  const rect = elements.area.getBoundingClientRect();
  if (!rect.width || !rect.height) return { fw: 0, fh: 0 };

  const scale = Math.min(rect.width / w, rect.height / h);
  return {
    fw: Math.max(0, w * scale),
    fh: Math.max(0, h * scale),
  };
}

function updateGlyph(w, h) {
  const scale = Math.min(20 / w, 20 / h);
  const gw = Math.max(4, Math.round(w * scale));
  const gh = Math.max(4, Math.round(h * scale));
  elements.orientationGlyph.style.setProperty("--glyph-w", `${gw}px`);
  elements.orientationGlyph.style.setProperty("--glyph-h", `${gh}px`);
}

function updatePresetState(w, h) {
  document.querySelectorAll(".preset").forEach((button) => {
    const isActive = Number(button.dataset.w) === w && Number(button.dataset.h) === h;
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function render() {
  const { w, h, valid } = getSize();

  if (!valid) {
    elements.frame.style.display = "none";
    elements.empty.style.display = "block";
    elements.ratioValue.textContent = "—";
    elements.chipRatio.textContent = "—";
    elements.pixelsValue.textContent = "—";
    elements.orientationValue.textContent = "—";
    updatePresetState(0, 0);
    return;
  }

  const { fw, fh } = fitFrame(w, h);
  const ratio = ratioString(w, h);

  elements.empty.style.display = "none";
  elements.frame.style.display = "block";
  elements.frame.style.width = `${fw}px`;
  elements.frame.style.height = `${fh}px`;
  elements.widthLabel.textContent = String(w);
  elements.heightLabel.textContent = String(h);
  elements.centerLabel.textContent = `${w}x${h}`;
  elements.centerLabel.style.display = fw > 108 && fh > 48 ? "inline-block" : "none";
  elements.ratioValue.textContent = ratio;
  elements.chipRatio.textContent = ratio;
  elements.pixelsValue.textContent = megapixelsString(w, h);
  elements.orientationValue.textContent = orientation(w, h);

  updateGlyph(w, h);
  updatePresetState(w, h);
}

function renderPresets() {
  const fragment = document.createDocumentFragment();

  presets.forEach((preset) => {
    const button = document.createElement("button");
    button.className = "preset";
    button.type = "button";
    button.dataset.w = preset.w;
    button.dataset.h = preset.h;
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<strong>${preset.label}</strong><span>${preset.w}x${preset.h}</span>`;
    button.addEventListener("click", () => {
      elements.widthInput.value = String(preset.w);
      elements.heightInput.value = String(preset.h);
      render();
    });
    fragment.append(button);
  });

  elements.presets.append(fragment);
}

function bindInputs() {
  [elements.widthInput, elements.heightInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.value = clean(input.value);
      render();
    });
  });

  elements.swapButton.addEventListener("click", () => {
    const width = elements.widthInput.value;
    elements.widthInput.value = elements.heightInput.value;
    elements.heightInput.value = width;
    render();
  });
}

renderPresets();
bindInputs();
render();

const resizeObserver = new ResizeObserver(render);
resizeObserver.observe(elements.area);
window.addEventListener("orientationchange", render);
