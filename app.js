// Basic Omnisense mock: 3D wallet graph + fake live data feed

// ------- DOM references -------
const feedContainer = document.getElementById("feed-container");
const clearFeedBtn = document.getElementById("clear-feed-btn");
const timeSlider = document.getElementById("time-slider");
const timeLabel = document.getElementById("time-label");
const latencyValue = document.getElementById("latency-value");

const vizNodesEl = document.getElementById("viz-nodes");
const vizLinksEl = document.getElementById("viz-links");
const vizHeatEl = document.getElementById("viz-heat");

// ------- 3D / Three.js setup -------
let scene, camera, renderer;
let nodeGroup, linkGroup;
let nodes = [];
let links = [];
let clock;
let heatLevel = 0.5;

function initScene() {
  const container = document.getElementById("viz-container");
  const { clientWidth, clientHeight } = container;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02020a, 0.035);

  camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 200);
  camera.position.set(0, 14, 32);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(clientWidth, clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x02020a, 1);
  container.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(10, 16, 8);
  scene.add(dir);

  const neon = new THREE.PointLight(0xff4fd8, 1.4, 80);
  neon.position.set(-10, 6, -4);
  scene.add(neon);

  // Background glow plane
  const planeGeo = new THREE.PlaneGeometry(80, 80);
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x181444,
    transparent: true,
    opacity: 0.6,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.position.set(0, -16, -12);
  plane.rotation.x = -Math.PI * 0.24;
  scene.add(plane);

  nodeGroup = new THREE.Group();
  linkGroup = new THREE.Group();
  scene.add(linkGroup);
  scene.add(nodeGroup);

  generateGraph(80, 120);

  window.addEventListener("resize", onWindowResize);
  animate();
}

function onWindowResize() {
  const container = document.getElementById("viz-container");
  const { clientWidth, clientHeight } = container;

  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
}

// ------- Graph generation -------

function generateGraph(nodeCount, linkCount) {
  const nodeGeo = new THREE.SphereGeometry(0.28, 16, 16);
  const walletMat = new THREE.MeshStandardMaterial({
    color: 0x4fd8ff,
    emissive: 0x1c4c6e,
    emissiveIntensity: 0.6,
    metalness: 0.2,
    roughness: 0.25,
  });

  const whaleMat = new THREE.MeshStandardMaterial({
    color: 0xff4fd8,
    emissive: 0x862259,
    emissiveIntensity: 0.9,
    metalness: 0.3,
    roughness: 0.2,
  });

  const tempNodes = [];

  for (let i = 0; i < nodeCount; i++) {
    const radius = 8 + Math.random() * 7;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 10;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = height * 0.5;

    const isWhale = Math.random() < 0.08;
    const mat = isWhale ? whaleMat.clone() : walletMat.clone();
    const mesh = new THREE.Mesh(nodeGeo, mat);
    mesh.position.set(x, y, z);

    const baseScale = isWhale ? 1.6 : 1;
    mesh.scale.setScalar(baseScale);

    nodeGroup.add(mesh);

    const node = {
      mesh,
      baseScale,
      isWhale,
      pulseOffset: Math.random() * Math.PI * 2,
    };
    tempNodes.push(node);
  }

  nodes = tempNodes;

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x4b82ff,
    transparent: true,
    opacity: 0.4,
  });

  const tempLinks = [];
  for (let i = 0; i < linkCount; i++) {
    const a = Math.floor(Math.random() * nodeCount);
    const b = Math.floor(Math.random() * nodeCount);
    if (a === b) continue;

    const start = nodes[a].mesh.position;
    const end = nodes[b].mesh.position;

    const geo = new THREE.BufferGeometry().setFromPoints([
      start.clone(),
      end.clone(),
    ]);

    const line = new THREE.Line(geo, lineMat.clone());
    linkGroup.add(line);

    tempLinks.push({
      line,
      intensity: Math.random(),
      pulseOffset: Math.random() * Math.PI * 2,
    });
  }

  links = tempLinks;

  vizNodesEl.textContent = nodes.length.toString();
  vizLinksEl.textContent = links.length.toString();
}

// ------- Animation loop -------

let rotationAngle = 0;

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  const dt = clock.getDelta();

  rotationAngle += dt * 0.06;
  nodeGroup.rotation.y = rotationAngle;
  linkGroup.rotation.y = rotationAngle;

  // Node breathing + sparse pulses
  nodes.forEach((node) => {
    const pulse =
      0.02 *
      Math.sin(elapsed * (node.isWhale ? 3.2 : 2.1) + node.pulseOffset);
    const scale = node.baseScale + pulse;
    node.mesh.scale.setScalar(scale);

    // Occasional brighter pulse
    if (Math.random() < (node.isWhale ? 0.009 : 0.003)) {
      node.mesh.material.emissiveIntensity = node.isWhale ? 1.25 : 0.9;
      setTimeout(() => {
        node.mesh.material.emissiveIntensity = node.isWhale ? 0.9 : 0.6;
      }, 220 + Math.random() * 180);
    }
  });

  // Link shimmer
  links.forEach((link) => {
    const t = elapsed * 2.5 + link.pulseOffset;
    const baseOpacity = 0.18 + 0.28 * (0.5 + 0.5 * Math.sin(t));
    link.line.material.opacity = baseOpacity * (0.5 + 0.5 * heatLevel);
  });

  // Camera subtle drift
  camera.position.x = Math.sin(elapsed * 0.11) * 3;
  camera.position.y = 14 + Math.sin(elapsed * 0.23) * 1.5;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

// ------- Fake live data / feed -------

const FEED_TAGS = [
  { label: "Whale", color: "var(--accent)" },
  { label: "DEX spike", color: "var(--accent-alt)" },
  { label: "NFT mint", color: "var(--success)" },
  { label: "Bridge", color: "#ffb74d" },
  { label: "Alert", color: "var(--danger)" },
];

const ADDR_PREFIXES = ["0xLady", "0xQueen", "0xRose", "0xFlow", "0xAura"];

function randomAddress() {
  const prefix =
    ADDR_PREFIXES[Math.floor(Math.random() * ADDR_PREFIXES.length)];
  const tail = Math.random().toString(16).slice(2, 10);
  return `${prefix}…${tail}`;
}

function randomNumber(min, max, decimals = 2) {
  const v = min + Math.random() * (max - min);
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

function addFeedItem() {
  const tagData = FEED_TAGS[Math.floor(Math.random() * FEED_TAGS.length)];
  const ts = new Date().toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const addrA = randomAddress();
  const addrB = randomAddress();
  const value = randomNumber(1.2, 128.4, 2);

  let mainText;
  let subText;

  switch (tagData.label) {
    case "Whale":
      mainText = `Whale transfer of ${value} LADY detected`;
      subText = `${addrA} → ${addrB}`;
      break;
    case "DEX spike":
      mainText = `DEX volume spike: ${randomNumber(48, 650, 1)}k LADY`;
      subText = `Dominant pair: LADY / USDC`;
      break;
    case "NFT mint":
      mainText = `${Math.floor(randomNumber(40, 420, 0))} NFTs minted in 60s`;
      subText = `Collection: LadyLegends #${
        1000 + Math.floor(Math.random() * 9000)
      }`;
      break;
    case "Bridge":
      mainText = `Bridge inflow: ${randomNumber(20, 420, 1)}k LADY`;
      subText = `From: Ethereum → Ladychain`;
      break;
    default:
      mainText = `Anomaly in mempool pattern`;
      subText = `Clustered activity near ${randomAddress()}`;
  }

  const item = document.createElement("div");
  item.className = "feed-item";

  const meta = document.createElement("div");
  meta.className = "feed-meta";

  const tsSpan = document.createElement("span");
  tsSpan.textContent = ts;

  const tag = document.createElement("span");
  tag.className = "feed-tag";
  tag.textContent = tagData.label;
  tag.style.borderColor = tagData.color;
  tag.style.color = tagData.color;

  meta.appendChild(tsSpan);
  meta.appendChild(tag);

  const body = document.createElement("div");
  body.className = "feed-body";

  const main = document.createElement("div");
  main.className = "feed-body-main";
  main.textContent = mainText;

  const sub = document.createElement("div");
  sub.className = "feed-body-sub";
  sub.textContent = subText;

  body.appendChild(main);
  body.appendChild(sub);

  item.appendChild(meta);
  item.appendChild(body);

  feedContainer.prepend(item);

  // Limit feed length
  const maxItems = 40;
  while (feedContainer.children.length > maxItems) {
    feedContainer.removeChild(feedContainer.lastChild);
  }

  // Slight bump in heat level with events
  heatLevel = Math.min(1, heatLevel + 0.02);
  updateHeatLabel();
}

function updateHeatLabel() {
  const label =
    heatLevel > 0.8
      ? "Overheated"
      : heatLevel > 0.6
      ? "Surging"
      : heatLevel > 0.35
      ? "Rising"
      : "Calm";
  vizHeatEl.textContent = label;
  vizHeatEl.style.color =
    heatLevel > 0.8
      ? "var(--danger)"
      : heatLevel > 0.6
      ? "var(--accent)"
      : heatLevel > 0.35
      ? "var(--success)"
      : "var(--text-soft)";
}

function startFeedLoop() {
  // Seed some items
  for (let i = 0; i < 7; i++) {
    addFeedItem();
  }

  setInterval(() => {
    addFeedItem();
  }, 2200 + Math.random() * 1400);

  // Simulated latency wobble
  setInterval(() => {
    const base = 22;
    const jitter = Math.round(Math.random() * 12);
    latencyValue.textContent = `${base + jitter} ms`;

    // Slowly cool down heat if no events
    heatLevel = Math.max(0.15, heatLevel - 0.01);
    updateHeatLabel();
  }, 1300);
}

// ------- UI wiring -------

if (clearFeedBtn) {
  clearFeedBtn.addEventListener("click", () => {
    feedContainer.innerHTML = "";
  });
}

if (timeSlider) {
  timeSlider.addEventListener("input", (e) => {
    const v = Number(e.target.value);
    if (v === 100) {
      timeLabel.textContent = "Now";
    } else if (v > 75) {
      timeLabel.textContent = "−2 min";
    } else if (v > 50) {
      timeLabel.textContent = "−5 min";
    } else if (v > 25) {
      timeLabel.textContent = "−15 min";
    } else {
      timeLabel.textContent = "−1 h";
    }

    // Here you could rewind to snapshots; for nu alleen visuele hint:
    const intensity = 0.6 + (100 - v) / 220; // 0.6 .. ~1
    scene && (scene.fog.density = 0.03 + (100 - v) / 4000);
    nodes.forEach((node) => {
      node.mesh.material.emissiveIntensity =
        (node.isWhale ? 0.9 : 0.6) * intensity;
    });
  });
}

// Layer toggles – for nu alleen opacity/visibility switches
document.querySelectorAll('.toggle input[type="checkbox"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    const layer = e.target.getAttribute("data-layer");
    const active = e.target.checked;

    switch (layer) {
      case "wallets":
        nodeGroup.visible = active;
        break;
      case "tx":
        linkGroup.visible = active;
        break;
      case "whales":
        nodes.forEach((n) => {
          if (n.isWhale) {
            n.mesh.visible = active;
          }
        });
        break;
      // dex / nft toggles reserved for echte data integraties later
      default:
        // no-op for now
        break;
    }
  });
});

// ------- Bootstrapping -------

window.addEventListener("DOMContentLoaded", () => {
  initScene();
  startFeedLoop();
});
