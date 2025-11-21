// Smooth scroll for buttons/links with data-scroll-target
document.querySelectorAll("[data-scroll-target]").forEach((el) => {
  el.addEventListener("click", () => {
    const id = el.getAttribute("data-scroll-target");
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const navbar = document.getElementById("navbar");

if (navToggle && navbar) {
  navToggle.addEventListener("click", () => {
    navbar.classList.toggle("nav-menu-open");
  });
}

// DEMO QUEST PROGRESSION (tiers + claim)

const tierGrid = document.querySelector(".quest-tier-grid");
const sampleRunLabel = document.getElementById("sampleRun");

let demoState = {
  completedQuests: 0,
  claimedQuests: 0,
  beansEarned: 0
};

function updateSampleRunLabel() {
  if (!sampleRunLabel) return;
  sampleRunLabel.textContent =
    `${demoState.claimedQuests} quests claimed · ${demoState.beansEarned} $BEANS earned`;
}

// Create a simple confetti burst inside a quest row
function spawnConfetti(row) {
  const container = document.createElement("div");
  container.className = "confetti-container";

  const pieces = 18;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const left = Math.random() * 100;
    const delay = Math.random() * 0.25;
    const xMove = (Math.random() - 0.5) * 60; // left/right
    piece.style.left = `${left}%`;
    piece.style.animationDelay = `${delay}s`;
    piece.style.setProperty("--x-move", `${xMove}px`);
    container.appendChild(piece);
  }

  row.appendChild(container);

  // Clean up after animation
  setTimeout(() => {
    container.remove();
  }, 900);
}

function handleStartQuest(row) {
  if (row.classList.contains("completed")) return;

  row.classList.add("completed");
  demoState.completedQuests += 1;

  const claimBtn = row.querySelector(".tier-quest-btn-claim");
  if (claimBtn) {
    claimBtn.disabled = false;
  }

  const meta = row.querySelector(".tier-quest-meta");
  if (meta) {
    meta.textContent = "Quest completed · ready to claim";
  }
}

function handleClaimQuest(row, beans) {
  if (row.classList.contains("claimed")) return;

  row.classList.add("claimed");

  const claimBtn = row.querySelector(".tier-quest-btn-claim");
  const startBtn = row.querySelector(".tier-quest-btn-start");

  if (claimBtn) {
    claimBtn.disabled = true;
    claimBtn.textContent = "Claimed";
  }
  if (startBtn) {
    startBtn.disabled = true;
  }

  demoState.claimedQuests += 1;
  demoState.beansEarned += beans;
  updateSampleRunLabel();

  spawnConfetti(row);
}

// Delegate clicks for all quest buttons
if (tierGrid) {
  tierGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".tier-quest-btn");
    if (!btn) return;

    const action = btn.dataset.action;
    const row = btn.closest(".tier-quest-row");
    if (!row) return;

    const beans = parseInt(row.dataset.beans || "0", 10);

    if (action === "start") {
      handleStartQuest(row);
    } else if (action === "claim") {
      if (btn.disabled) return;
      handleClaimQuest(row, beans);
    }
  });
}

// Waitlist form (front-end only demo)
const waitlistForm = document.getElementById("waitlistForm");
const emailInput = document.getElementById("emailInput");
const waitlistNote = document.getElementById("waitlistNote");

if (waitlistForm && emailInput && waitlistNote) {
  waitlistForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;

    // Here you would later call your backend / API
    emailInput.value = "";
    emailInput.blur();
    waitlistNote.textContent =
      "Thanks! You’re on the list for the first Coffeeholics quests. ☕";
  });
}

// Footer year
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Init sample label
updateSampleRunLabel();
