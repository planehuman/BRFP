// Step 1: Create the map (before any layers!)
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -1,
  maxZoom: 4
});

// Step 2: Define map bounds
const mapBounds = [[0, 0], [2000, 2000]];

// Step 3: Add image overlay
const image = L.imageOverlay('map.png', mapBounds).addTo(map);

// Step 4: Fit map to image bounds
map.fitBounds(mapBounds);

// Flip Y function (for 2000x2000 image)
function flipY(y) {
  return 2000 - y;
}

const airports = {
  BRUY: { name: "BRUY", coords: [500, 1000], metar: "METAR BRUY 071200Z 21015KT 10SM CLR 24/16 A2992", notams: "No NOTAMs", image: "BRUY.png" },
  BRYA: { name: "BRYA", coords: [250, 1100], metar: "METAR BRYA 071200Z 22012KT 9SM FEW020 22/15 A2985", notams: "Runway 12/30 closed", image: "BRYA.png" },
  BVIA: { name: "BVIA", coords: [1525, 250], metar: "METAR BVIA 071200Z 23010KT 10SM CLR 25/17 A3001", notams: "Taxiway B maintenance", image: "BVIA.png" },
  BVTA: { name: "BVTA", coords: [1775, 400], metar: "METAR BVTA 071200Z 24008KT 10SM CLR 26/18 A2998", notams: "No NOTAMs", image: "BVTA.jpg" },
  BREW: { name: "BREW", coords: [1885, 1700], metar: "METAR BREW 071200Z 19012KT 10SM CLR 27/19 A2990", notams: "Construction near ramp", image: "BREW.png" },
  BVER: { name: "BVER", coords: [315, 125], metar: "METAR BVER 071200Z 20014KT 10SM CLR 23/14 A2980", notams: "Glider activity", image: "BVER.png" }
};

// Add markers with interactive popups (clickable only)
for (const code in airports) {
  const a = airports[code];
  L.marker(a.coords).addTo(map)
    .bindPopup(`
      <b>${a.name}</b><br>
      METAR: ${a.metar}<br>
      NOTAMs: ${a.notams}<br>
      <img src="${a.image}" width="150">
    `);
}

// 5. ATC zones as transparent circles
const atcZones = [
  { center: airports.BVIA.coords, radius: 200, name: "BVIA Tower" },
  { center: airports.BVER.coords, radius: 150, name: "BVER Ground" },
  { center: airports.BREW.coords, radius: 250, name: "BREW Center" },
];

atcZones.forEach(zone => {
  L.circle(zone.center, {
    radius: zone.radius,
    color: '#00f',
    fillColor: '#00f',
    fillOpacity: 0.2,
  }).addTo(map).bindPopup(`<b>${zone.name}</b> ATC Zone`);
});

const graph = {
  BVIA: ["VILLE"],
  BVTA: ["VILLE"],
  VILLE: ["BVIA", "BVTA", "BRICK", "TREA"],
  BRICK: ["VILLE", "READ", "TRAM"],
  READ: ["BRICK", "MIUT"],
  MIUT: ["READ", "YTEN"],
  TREA: ["VILLE", "TRAM"],
  TRAM: ["BRICK", "TREA", "YTEN"],
  YTEN: ["MIUT", "TRAM", "ENRG"],

  BREW: ["ENRG"],
  ENRG: ["YANN", "YTEN", "TRAC", "EMRG"],
  EMRG: ["ENRG", "TRAC", "CANT"],
  CANT: ["EMRG"],
  TRAC: ["ENRG", "EMRG"],

  BVER: ["YNKE"],
  YNKE: ["BVER", "RTEA"],
  RTEA: ["YNKE", "REAM"],
  REAM: ["RTEA", "YTFA", "KEEP"],
  YTFA: ["REAM", "RVDA"],
  RVDA: ["YTFA", "OCAE", "YANN"],
  OCAE: ["RVDA", "YANN"],
  YANN: ["RVDA", "OCAE", "ENRG", "WATE"],
  WATE: ["YANN", "KEEP"],
  KEEP: ["WATE", "REAM", "REAP"],
  REAP: ["KEEP"],

  BRYA: ["BRUY", "ENRG"],
  BRUY: ["BRYA"]
};

const waypointGraph = graph;

const waypoints = {
  VILLE: { coords: [487, 404] },
  BRICK: { coords: [278, 637] },
  MIUT: { coords: [104, 902] },
  YTEN: { coords: [102, 1255] },
  READ: { coords: [227, 957] },
  TREA: { coords: [472, 865] },
  TRAM: { coords: [332, 1115] },
  ENRG: { coords: [226, 1790] },
  TRAC: { coords: [430, 1571] },
  EMRG: { coords: [284, 1790] },
  CANT: { coords: [544, 1765] },
  YNKE: { coords: [1591, 36] },
  RTEA: { coords: [1779, 157] },
  REAM: { coords: [1361, 1085] },
  YTFA: { coords: [1563, 1085] },
  RVDA: { coords: [1671, 959] },
  OCAE: { coords: [1868, 1280] },
  YANN: { coords: [1669, 1298] },
  WATE: { coords: [1506, 1280] },
  KEEP: { coords: [1416, 1266] },
  REAP: { coords: [1331, 1346] }
};

function distance(a, b) {
  const dy = a[0] - b[0];
  const dx = a[1] - b[1];
  return Math.sqrt(dy * dy + dx * dx);
}

function findPath(start, end) {
  const distances = {};
  const prev = {};
  const queue = [];

  for (const wp in waypoints) {
    distances[wp] = Infinity;
    prev[wp] = null;
  }

  distances[start] = 0;
  queue.push({ wp: start, dist: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift().wp;

    if (current === end) break;

    const neighbors = waypointGraph[current] || [];
    for (const neighbor of neighbors) {
      if (!(neighbor in waypoints)) continue; // 🔥 SKIP invalid neighbors

      const alt = distances[current] + distance(waypoints[current].coords, waypoints[neighbor].coords);
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        prev[neighbor] = current;
        queue.push({ wp: neighbor, dist: alt });
      }
    }
  }

  const path = [];
  let u = end;
  while (u) {
    path.unshift(u);
    u = prev[u];
  }
  return path;
}


function findClosestWaypoint(coords) {
  let closest = null;
  let minDist = Infinity;

  for (const [wp, data] of Object.entries(waypoints)) {
    const d = Math.hypot(coords[0] - data.coords[0], coords[1] - data.coords[1]);
    if (d < minDist) {
      closest = wp;
      minDist = d;
    }
  }

  return closest;
}

// Generate route between 2 ICAOs
function findRoute() {
  const dep = document.getElementById('dep-icao').value.toUpperCase();
  const arr = document.getElementById('arr-icao').value.toUpperCase();

  if (!(dep in airports) || !(arr in airports)) {
    alert("Invalid ICAO code(s).");
    return;
  }

  const depCoords = airports[dep].coords;
  const arrCoords = airports[arr].coords;

  const wpStart = findClosestWaypoint(depCoords);
  const wpEnd = findClosestWaypoint(arrCoords);

  console.log("Closest to DEP:", wpStart, depCoords);
  console.log("Closest to ARR:", wpEnd, arrCoords);

  if (!wpStart || !wpEnd) {
    alert("No close waypoint found for departure or arrival.");
    return;
  }

  const path = findPath(wpStart, wpEnd);

  if (!path || path.length === 0) {
    alert("No route found.");
    return;
  }

  const routeParts = [`DCT ${dep}`, ...path.map(p => `DCT ${p}`), `DCT ${arr}`];
  const route = routeParts.join(" ");
  document.getElementById("route-waypoints").value = route;

  // Remove previous route line if it exists
  if (window.routeLine) map.removeLayer(window.routeLine);

  const routeCoords = [
    depCoords,
    ...path.map(p => waypoints[p].coords),
    arrCoords
  ];

  // === Calculate PIN time and Total time ===
  const now = new Date();
  const pinTimeStr = now.toTimeString().split(" ")[0].slice(0, 5); // HH:MM

  // Estimate total distance in pixels
  let totalDist = 0;
  let prevCoord = depCoords;
  for (const wp of path) {
    const wpCoord = waypoints[wp].coords;
    totalDist += distance(prevCoord, wpCoord);
    prevCoord = wpCoord;
  }
  totalDist += distance(prevCoord, arrCoords);

  // Convert to time — assume 0.1 pixels = 1 km, speed = 278 km/h
  const pixelsPerKm = 0.1;
  const speedKmPerH = 278;
  const distKm = totalDist * pixelsPerKm;
  const timeHours = distKm / speedKmPerH;
  const totalMins = Math.ceil(timeHours * 60);

  // Update form fields
  document.getElementById("pin-time").value = pinTimeStr;
  document.getElementById("total-time").value = `${totalMins} min`;

  // Draw route line
  window.routeLine = L.polyline(routeCoords, {
    color: 'red',
    weight: 3,
    opacity: 0.8
  }).addTo(map);
}




function updateFullWeight() {
  const cargo = parseFloat(document.getElementById("cargo").value) || 0;
  const fuel = parseFloat(document.getElementById("fuel").value) || 0;
  const pax = parseInt(document.getElementById("pax").value) || 0;

  const fullWeight = cargo + fuel + pax;
  document.getElementById("full-weight").value = fullWeight.toFixed(1);
}

function exportBFP() {
  const data = {
    airline: document.getElementById("airline").value,
    flightNumber: document.getElementById("flight-number").value,
    aircraftType: document.getElementById("aircraft-type").value,
    variant: document.getElementById("variant").value,
    registration: document.getElementById("registration").value,
    fuelAmount: document.getElementById("fuel").value,
    emptyWeight: document.getElementById("empty-weight").value,
    fullWeight: document.getElementById("full-weight").value,
    pax: document.getElementById("pax").value,
    cargoWeight: document.getElementById("cargo").value,
    hazardous: document.getElementById("hazard").value,
    pinTime: document.getElementById("pin-time").value,
    totalTime: document.getElementById("total-time").value,
    departure: document.getElementById("dep-icao").value,
    arrival: document.getElementById("arr-icao").value,
    route: document.getElementById("route-waypoints").value
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "flightplan.bfp";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importBFP(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      document.getElementById("airline").value = data.airline || "";
      document.getElementById("flight-number").value = data.flightNumber || "";
      document.getElementById("aircraft-type").value = data.aircraftType || "";
      document.getElementById("variant").value = data.variant || "";
      document.getElementById("registration").value = data.registration || "";
      document.getElementById("fuel").value = data.fuelAmount || "";
      document.getElementById("empty-weight").value = data.emptyWeight || "";
      document.getElementById("full-weight").value = data.fullWeight || "";
      document.getElementById("pax").value = data.pax || "";
      document.getElementById("cargo").value = data.cargoWeight || "";
      document.getElementById("hazard").value = data.hazardous || "";
      document.getElementById("pin-time").value = data.pinTime || "";
      document.getElementById("total-time").value = data.totalTime || "";
      document.getElementById("dep-icao").value = data.departure || "";
      document.getElementById("arr-icao").value = data.arrival || "";
      document.getElementById("route-waypoints").value = data.route || "";
    } catch (err) {
      alert("Failed to import file. Please check the format.");
      console.error("Import error:", err);
    }
  };
  reader.readAsText(file);
}


function exportPOFP() {
  const content = `
  BRICK RIGS FLIGHT PLAN BRIEFING

  AIRLINE: ${document.getElementById("airline").value}
  FLIGHT NUMBER: ${document.getElementById("flight-number").value}
  TYPE OF AIRCRAFT: ${document.getElementById("aircraft-type").value}
  VARIANT: ${document.getElementById("variant").value}
  REGISTRATION: ${document.getElementById("registration").value}

  FUEL: ${document.getElementById("fuel").value}
  EMPTY WEIGHT: ${document.getElementById("empty-weight").value}
  FULL WEIGHT: ${document.getElementById("full-weight").value}
  PASSENGERS: ${document.getElementById("pax").value}
  CARGO WEIGHT: ${document.getElementById("cargo").value}
  HAZARDOUS MATERIALS: ${document.getElementById("hazard").value}
  PIN TIME: ${document.getElementById("pin-time").value}
  TOTAL TIME: ${document.getElementById("total-time").value}

  ROUTE: ${document.getElementById("route-waypoints").value}
  FROM ${document.getElementById("dep-icao").value} TO ${document.getElementById("arr-icao").value}
  `;

  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "briefing.pofp";
  a.click();
  URL.revokeObjectURL(a.href);
}

function openATCView() {
  document.body.classList.add("atc-view");
  document.getElementById("atc-panel").style.display = "block";
  document.getElementById("back-btn").style.display = "inline-block";

  // Populate ATC info
  document.getElementById("atc-pin-time").textContent = document.getElementById("pin-time").value;
  document.getElementById("atc-hold-ocean").textContent = "No"; // Customize logic as needed
  document.getElementById("atc-route").textContent = `${document.getElementById("dep-icao").value} → ${document.getElementById("arr-icao").value}`;
  document.getElementById("atc-waypoints").textContent = document.getElementById("route-waypoints").value;
  document.getElementById("atc-ac-type").textContent = document.getElementById("aircraft-type").value;
  document.getElementById("atc-callsign").textContent = document.getElementById("airline").value + document.getElementById("flight-number").value;
  document.getElementById("atc-reg").textContent = document.getElementById("registration").value;
}

function closeATCView() {
  document.body.classList.remove("atc-view");
  document.getElementById("atc-panel").style.display = "none";
  document.getElementById("back-btn").style.display = "none";
}


["cargo", "fuel", "pax"].forEach(id => {
  document.getElementById(id).addEventListener("input", updateFullWeight);
});

