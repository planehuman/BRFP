const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -3,
  maxZoom: 4
});



const mapBounds = [[0, 0], [2000, 2000]];


const image = L.imageOverlay('map.png', mapBounds).addTo(map);

map.fitBounds(mapBounds);

const airportLayer = L.layerGroup().addTo(map);

function flipY(y) {
  return 2000 - y;
}






async function loadTFRs() {
  try {
    const response = await fetch("https://brfpb.onrender.com/airports");
    const data = await response.json();

    if (!data.tfrs || data.tfrs.length === 0) {
      console.log("No TFR zones found.");
      return;
    }

    data.tfrs.forEach(tfr => {
      if (!tfr.center || !tfr.radius || !tfr.color || !tfr.info) {
        console.warn("Incomplete TFR data:", tfr);
        return;
      }

      L.circle(tfr.center, {
        radius: tfr.radius,
        color: tfr.color,
        fillColor: tfr.color,
        fillOpacity: 0.3,
      }).addTo(map).bindPopup(tfr.info + (tfr.expires ? `<br><i>Expires: ${new Date(tfr.expires).toLocaleString()}</i>` : ''));
    });
  } catch (err) {
    console.error("Error loading TFR zones:", err);
  }
}


loadTFRs();


const staticMarkers = [
  { code: "OCNTRK1", name: "OCNTRK1", coords: [900, 600], notams: "UNCONTROLLED AIRSPACE, USE COMMS FOR TRAFFIC POSITION INFO. PARTICAL BVIA CONTROL" },
  { code: "OCNTRK2", name: "OCNTRK2", coords: [900, 600], notams: "UNCONTROLLED AIRSPACE, USE COMMS FOR TRAFFIC POSITION INFO. PARTICAL BVIA CONTROL" },
  { code: "OCNTRK4", name: "OCNTRK4", coords: [750, 390], notams: "UNCONTROLLED AIRSPACE, USE COMMS FOR TRAFFIC POSITION INFO. PARTICAL BVIA CONTROL" }
];

async function loadAirportData() {
  try {
    const response = await fetch("https://brfpb.onrender.com/airports");
    const data = await response.json();

    airportLayer.clearLayers();

    for (const code in airports) {
      if (staticMarkers.find(m => m.code === code)) continue; 

      const airport = airports[code];
      const backendInfo = data[code] || {};

      const metar = backendInfo.metar || airport.metar || "Unavailable";
      const notams = Array.isArray(backendInfo.notam)
                     ? backendInfo.notam.join("<br>")
                     : (Array.isArray(airport.notams) ? airport.notams.join("<br>") : airport.notams || "None");

      L.marker(airport.coords).addTo(airportLayer)
        .bindPopup(`
          <b>${airport.name}</b><br>
          METAR: ${metar}<br>
          NOTAMs:<br>${notams}<br>
          ${airport.image ? `<img src="${airport.image}" width="150">` : ""}
        `);
    }


    staticMarkers.forEach(({ code, name, coords, notams }) => {
      L.marker(coords).addTo(airportLayer)
        .bindPopup(`
          <b>${name}</b><br>
          NOTAMs:<br>${notams}<br>
        `);
    });

  } catch (error) {
    console.error("Error loading airport data:", error);
  }
}



loadAirportData(); 


document.getElementById("refreshBtn").addEventListener("click", loadAirportData);




const airports = {
  BRUY: { name: "BRUY", coords: [500, 1000], image: "BRUY.png" },
  BRYA: { name: "BRYA", coords: [250, 1100], image: "BRYA.png" },
  BVIA: { name: "BVIA", coords: [1525, 250], image: "BVIA.png" },
  BVTA: { name: "BVTA", coords: [1775, 400], image: "BVTA.png" },
  BREW: { name: "BREW", coords: [1885, 1700], image: "BREW.png" },
  BVER: { name: "BVER", coords: [315, 125], image: "BVER.png" },
};

for (const code in airports) {
  const a = airports[code];
  L.marker(a.coords).addTo(map)
    .bindPopup(`a
      <b>${a.name}</b><br>
      METAR: ${a.metar}<br>
      NOTAMs: ${a.notams}<br>
    `);
}

const atcZones = [
  { center: airports.BVIA.coords, radius: 750, name: "BVIA Center" },
  { center: airports.BVER.coords, radius: 150, name: "BVER Traffic" },
  { center: airports.BREW.coords, radius: 750, name: "BREW Center" },
  { center: airports.BVIA.coords, radius: 150, name: "BVIA Tower" },
  { center: airports.BRYA.coords, radius: 150, name: "BRYA Tower" },

  { center: airports.BRUY.coords, radius: 100, name: "BRUY Area Control (BRYA)" },
  { center: airports.BVER.coords, radius: 150, name: "BRYA Center" },
  { center: airports.BREW.coords, radius: 250, name: "BREW Center" },
  { center: airports.BVIA.coords, radius: 150, name: "BVIA Tower" },
  { center: airports.BVIA.coords, radius: 150, name: "BVIA Tower" },
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
  TREA: ["VILLE", "TRAM", "BRICK"],
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

const mapHeight = 2000;

function flipY(y) {
  return mapHeight - y;
}
const waypointGraph = graph;

const waypoints = {
  VILLE: { coords: [flipY(485), 406] },
  BRICK: { coords: [flipY(277), 641] },
  MIUT: { coords: [flipY(103), 904] },
  YTEN: { coords: [flipY(103), 1257] },
  READ: { coords: [flipY(227), 959] },
  TREA: { coords: [flipY(471), 870] },
  TRAM: { coords: [flipY(343), 1116] },
  ENRG: { coords: [flipY(227), 1444] },
  TRAC: { coords: [flipY(429), 1574] },
  EMRG: { coords: [flipY(284), 1790] },
  CANT: { coords: [flipY(544), 1767] },
  YNKE: { coords: [flipY(1587), 38] },
  RTEA: { coords: [flipY(1774), 160] },
  REAM: { coords: [flipY(1358), 1085] },
  YTFA: { coords: [flipY(1562), 1085] },
  RVDA: { coords: [flipY(1669), 959] },
  OCAE: { coords: [flipY(1867), 1280] },
  YANN: { coords: [flipY(1665), 1297] },
  WATE: { coords: [flipY(1505), 1335] },
  KEEP: { coords: [flipY(1415), 1265] },
  REAP: { coords: [flipY(1329), 1347] }
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
      if (!(neighbor in waypoints)) continue; 

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


  if (window.routeLine) map.removeLayer(window.routeLine);

  const routeCoords = [
    depCoords,
    ...path.map(p => waypoints[p].coords),
    arrCoords
  ];


  const now = new Date();
  const pinTimeStr = now.toTimeString().split(" ")[0].slice(0, 5); // HH:MM


  let totalDist = 0;
  let prevCoord = depCoords;
  for (const wp of path) {
    const wpCoord = waypoints[wp].coords;
    totalDist += distance(prevCoord, wpCoord);
    prevCoord = wpCoord;
  }
  totalDist += distance(prevCoord, arrCoords);

  // 0.1 pixels = 1 km, speed = 278 km/h
  const pixelsPerKm = 0.1;
  const speedKmPerH = 278;
  const distKm = totalDist * pixelsPerKm;
  const timeHours = distKm / speedKmPerH;
  const totalMins = Math.ceil(timeHours * 60);


  document.getElementById("pin-time").value = pinTimeStr;
  document.getElementById("total-time").value = `${totalMins} min`;


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


  document.getElementById("atc-pin-time").textContent = document.getElementById("pin-time").value;
  document.getElementById("atc-hold-ocean").textContent = "No";
  document.getElementById("atc-route").textContent = `${document.getElementById("dep-icao").value} → ${document.getElementById("arr-icao").value}`;
  document.getElementById("atc-waypoints").textContent = document.getElementById("route-waypoints").value;
  document.getElementById("atc-ac-type").textContent = document.getElementById("aircraft-type").value;
  document.getElementById("atc-callsign").textContent = document.getElementById("airline").value + document.getElementById("flight-number").value;
  document.getElementById("atc-reg").textContent = document.getElementById("registration").value;
}



async function handleGenerate() {
  const bfpData = {
    callsign: document.getElementById("registration").value,
    departure: document.getElementById("dep-icao").value,
    arrival: document.getElementById("arr-icao").value,
    aircraft: document.getElementById("aircraft-type").value
  };
  const airline = document.getElementById("airline").value;
  const flightNumber = document.getElementById("flight-number").value;
  const aircraftType = document.getElementById("aircraft-type").value;
  const variant = document.getElementById("variant").value;
  bfpData.callsign = `${airline}${flightNumber}`.trim();
  bfpData.aircraft = `${aircraftType} ${variant}`.trim();

  if (!bfpData.callsign || !bfpData.departure || !bfpData.arrival || !bfpData.aircraft) {
    alert("Missing flight plan data.");
    return;
  }

  try {
    const response = await fetch("https://brfpb.onrender.com/submit_flightplan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bfpData)
    });


    const data = await response.json();

    if (response.ok) {
      alert("Flight plan saved successfully!");


      exportBFP();
      exportPOFP();
    } else {
      alert("Error saving flight plan: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Failed to send flight plan to the server.");
  }
}





function closeATCView() {
  document.body.classList.remove("atc-view");
  document.getElementById("atc-panel").style.display = "none";
  document.getElementById("back-btn").style.display = "none";
}


["cargo", "fuel", "pax"].forEach(id => {
  document.getElementById(id).addEventListener("input", updateFullWeight);
});
