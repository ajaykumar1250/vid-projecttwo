// Create the Leaflet map
const map = L.map('map').setView([20, 0], 2); // Center of the world

// Define base map layers
const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
});

const satellite = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenTopoMap contributors'
});

const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; CartoDB'
});

// Add default base layer
streets.addTo(map);

// Toggle menu display
document.getElementById("basemap-toggle").addEventListener("click", () => {
  document.getElementById("basemap-menu").classList.toggle("hidden");
});

// Handle base map changes
document.querySelectorAll("input[name='basemap']").forEach(radio => {
  radio.addEventListener("change", e => {
    const selected = e.target.value;
    map.eachLayer(layer => map.removeLayer(layer)); // Remove everything

    // Add selected base layer
    if (selected === "streets") streets.addTo(map);
    else if (selected === "satellite") satellite.addTo(map);
    else if (selected === "dark") dark.addTo(map);

    // Re-add earthquake layer
    if (window.earthquakeLayer) map.addLayer(window.earthquakeLayer);
  });
});

// Create a global layer group for earthquake markers
const quakeGroup = L.layerGroup();
window.earthquakeLayer = quakeGroup;

// Load earthquake CSV data
d3.csv('/data/cleaned_earthquakes_2024_2025.csv').then(data => {
  data.forEach(d => {
    const lat = +d.latitude;
    const lon = +d.longitude;
    const magnitude = +d.mag;
    const depth = +d.depth;
    const place = d.place;
    const utcTime = new Date(d.time);
    const localTime = utcTime.toLocaleString();

    // Color by magnitude
    const color = magnitude >= 6 ? '#ff0000' :
                  magnitude >= 5 ? '#ff8000' :
                  magnitude >= 4 ? '#ffff00' : '#00ff00';

    // Create circle marker
    const circle = L.circleMarker([lat, lon], {
      radius: 4 + magnitude,
      fillColor: color,
      color: "#222",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    });

    // Hover tooltip
    circle.bindTooltip(
      `<b>${place}</b><br/>
       Mag: ${magnitude}, Depth: ${depth} km<br/>
       ${localTime}`, 
      {
        direction: 'top',
        permanent: false,
        sticky: true,
        opacity: 0.9,
        className: 'quake-tooltip'
      }
    );

    quakeGroup.addLayer(circle);
  });

  quakeGroup.addTo(map);
});
