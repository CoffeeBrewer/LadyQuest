// ===== SIMPLE STATE (demo only, no blockchain) =====
const state = {
  walletConnected: false,
  walletAddress: null,
  ladyBalance: 2.5, // demo number
  beansBalance: 0,
  totalBrewed: 0,
  brew: {
    active: false,
    ratePerHour: 24, // demo: BEANS / hour
    accumulated: 0,
    lastUpdate: null,
  },
  price: {
    // fake demo rate, imagine this is from the DEX
    beansPerLady: 95.0,
  },
};

// ===== DOM HELPERS =====
function $(selector) {
  return document.querySelector(selector);
}

// ===== NAV ACTIVE STATE ON SCROLL =====
function setupNavHighlight() {
  const links = document.querySelectorAll(".ch-nav-link");
  const sections = [...document.querySelectorAll("section[id]")];

  function onScroll() {
    const scrollY = window.scrollY;
    let currentId = "hero";

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      const offsetTop = rect.top + window.scrollY;
      if (scrollY + 120 >= offsetTop) {
        currentId = section.id;
      }
    }

    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const id = href.replace("#", "");
      if (id === currentId) {
        link.classList.add("ch-nav-link--active");
      } else {
        link.classList.remove("ch-nav-link--active");
      }
    });
  }

  window.addEventListener("scroll", onScroll);
  onScroll();
}

// ===== WALLET CONNECT (FAKE) =====
function setupWalletConnect() {
  const btn = $("#connectWalletBtn");

  btn.addEventListener("click", () => {
    if (!state.walletConnected) {
      // Demo: pretend we connected a wallet
      state.walletConnected = true;
      state.walletAddress = "0xC0FFEE...BEANS";
      btn.textContent = "Wallet Connected";
      btn.classList.remove("ch-btn-secondary");
      btn.classList.add("ch-btn-primary");

      // Update hero + profile
      $("#heroStatus").textContent = "You’re seated in the café";
      $("#profileWallet").textContent = state.walletAddress;
      $("#ladyBalance").textContent = state.ladyBalance.toFixed(3);
      $("#beansBalance").textContent = state.beansBalance.toFixed(2);
    } else {
      // Simple toggle / "disconnect" for demo
      state.walletConnected = false;
      state.walletAddress = null;
      btn.textContent = "Connect Wallet";
      btn.classList.remove("ch-btn-primary");
      btn.classList.add("ch-btn-secondary");
      $("#heroStatus").textContent = "Wallet not connected";
      $("#profileWallet").textContent = "Not connected";
      $("#ladyBalance").textContent = "0.0";
      $("#beansBalance").textContent = "0.0";
    }
  });
}

// ===== BAR / DEX SWAP (DEMO CALC) =====
function setupBar() {
  const ladyInput = $("#ladyInput");
  const beansOutput = $("#beansOutput");
  const priceInfo = $("#priceInfo");
  const buyBtn = $("#buyBeansBtn");
  const openDexBtn = $("#openDexBtn");

  function recalc() {
    const value = parseFloat(ladyInput.value || "0");
    if (value <= 0) {
      beansOutput.textContent = "0.0";
      priceInfo.textContent =
        "Live estimate based on a simulated AMM curve. In production this reads from the LADY/BEANS pool.";
      return;
    }

    const estBeans = value * state.price.beansPerLady;
    beansOutput.textContent = estBeans.toFixed(2);
    const implied = state.price.beansPerLady.toFixed(2);
    priceInfo.textContent = `Estimated rate ~ 1 LADY ≈ ${implied} BEANS (demo only, real app calls the DEX router).`;
  }

  ladyInput.addEventListener("input", recalc);

  buyBtn.addEventListener("click", () => {
    if (!state.walletConnected) {
      alert("Connect your wallet first to buy BEANS.");
      return;
    }
    const value = parseFloat(ladyInput.value || "0");
    if (value <= 0) {
      alert("Please enter an amount of LADY to spend.");
      return;
    }
    if (value > state.ladyBalance) {
      alert("Not enough LADY in this demo balance.");
      return;
    }

    const estBeans = value * state.price.beansPerLady;

    // Update demo balances
    state.ladyBalance -= value;
    state.beansBalance += estBeans;

    $("#ladyBalance").textContent = state.ladyBalance.toFixed(3);
    $("#beansBalance").textContent = state.beansBalance.toFixed(2);

    alert(
      `Demo swap complete.\nYou spent ${value.toFixed(
        4
      )} LADY and received ≈ ${estBeans.toFixed(2)} BEANS.`
    );

    ladyInput.value = "";
    recalc();
  });

  openDexBtn.addEventListener("click", () => {
    alert(
      "In the real dApp, this would open the full DEX UI or an external link to the DEX."
    );
  });

  recalc();
}

// ===== BREW SIMULATOR =====
let brewIntervalId = null;

function updateBrewAccumulated() {
  if (!state.brew.active || !state.brew.lastUpdate) return;

  const now = Date.now();
  const deltaMs = now - state.brew.lastUpdate;
  const deltaHours = deltaMs / (1000 * 60 * 60);
  const earned = state.brew.ratePerHour * deltaHours;

  state.brew.accumulated += earned;
  state.totalBrewed += earned;
  state.brew.lastUpdate = now;

  $("#brewAccumulated").textContent = `${state.brew.accumulated.toFixed(
    2
  )} BEANS`;
  $("#totalBrewed").textContent = state.totalBrewed.toFixed(2);

  const maxHeight = 80;
  const ratio = Math.min(state.brew.accumulated / 100, 1);
  const height = Math.max(10, ratio * maxHeight);
  $("#brewLiquid").style.height = `${height}%`;
}

function setupBrew() {
  const startBtn = $("#startBrewBtn");
  const collectBtn = $("#collectBrewBtn");
  const brewStatus = $("#brewStatus");
  const brewRate = $("#brewRate");
  const brewLiquid = $("#brewLiquid");
  const orbitRate = $("#orbitBrewRate");

  function startInterval() {
    if (brewIntervalId) return;
    brewIntervalId = setInterval(updateBrewAccumulated, 1500);
  }

  function stopInterval() {
    if (brewIntervalId) {
      clearInterval(brewIntervalId);
      brewIntervalId = null;
    }
  }

  startBtn.addEventListener("click", () => {
    if (!state.walletConnected) {
      alert("Connect your wallet first to start a Brew.");
      return;
    }
    if (!state.brew.active) {
      state.brew.active = true;
      state.brew.lastUpdate = Date.now();
      brewStatus.textContent = "Brewing";
      brewStatus.classList.remove("ch-chip-soft");
      brewStatus.classList.add("ch-chip-active");

      brewRate.textContent = `${state.brew.ratePerHour.toFixed(
        1
      )} BEANS / hour`;
      if (orbitRate) {
        orbitRate.textContent = `${state.brew.ratePerHour.toFixed(
          1
        )} BEANS / hour`;
      }

      startInterval();
    }
  });

  collectBtn.addEventListener("click", () => {
    if (!state.walletConnected) {
      alert("Connect your wallet first.");
      return;
    }
    updateBrewAccumulated();
    if (state.brew.accumulated <= 0) {
      alert("Nothing brewed yet — start your Brew first.");
      return;
    }

    const collected = state.brew.accumulated;
    state.brew.accumulated = 0;
    brewLiquid.style.height = "0%";
    $("#brewAccumulated").textContent = "0.0 BEANS";

    state.beansBalance += collected;
    $("#beansBalance").textContent = state.beansBalance.toFixed(2);

    alert(`You collected ${collected.toFixed(2)} BEANS from your Brew.`);

    const lvlEl = $("#coffeeLevel");
    let lvl = parseInt(lvlEl.textContent || "1", 10);
    lvlEl.textContent = String(lvl + 1);
  });

  brewStatus.textContent = "Idle";
  brewRate.textContent = "0 BEANS / hour";
  brewLiquid.style.height = "0%";
  if (orbitRate) orbitRate.textContent = "0 BEANS / h";
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  setupNavHighlight();
  setupWalletConnect();
  setupBar();
  setupBrew();
});
