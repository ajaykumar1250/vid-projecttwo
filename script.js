// Create the Leaflet map
const map = L.map('map').setView([20, 0], 2);

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
streets.addTo(map);

// Base map toggle
document.getElementById("basemap-toggle").addEventListener("click", () => {
  document.getElementById("basemap-menu").classList.toggle("hidden");
});
document.querySelectorAll("input[name='basemap']").forEach(radio => {
  radio.addEventListener("change", e => {
    const selected = e.target.value;
    map.eachLayer(layer => map.removeLayer(layer));
    if (selected === "streets") streets.addTo(map);
    else if (selected === "satellite") satellite.addTo(map);
    else if (selected === "dark") dark.addTo(map);
    if (window.earthquakeLayer) map.addLayer(window.earthquakeLayer);
  });
});

// Earthquake markers
const quakeGroup = L.layerGroup();
window.earthquakeLayer = quakeGroup;

d3.csv('/vid-projecttwo/data/cleaned_earthquakes_2024_2025.csv').then(data => {
  data.forEach(d => {
    const lat = +d.latitude;
    const lon = +d.longitude;
    const magnitude = +d.mag;
    const depth = +d.depth;
    const place = d.place;
    const localTime = new Date(d.time).toLocaleString();

    const color = magnitude >= 6 ? '#ff0000' :
                  magnitude >= 5 ? '#ff8000' :
                  magnitude >= 4 ? '#ffff00' : '#00ff00';

    const radius = depth <= 10 ? 4 :
                   depth <= 30 ? 6 :
                   depth <= 70 ? 8 :
                   depth <= 300 ? 10 : 12;

    const circle = L.circleMarker([lat, lon], {
      radius,
      fillColor: color,
      color: "#222",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).bindTooltip(
      `<b>${place}</b><br/>Mag: ${magnitude}, Depth: ${depth} km<br/>${localTime}`,
      {
        direction: 'top',
        sticky: true,
        opacity: 0.9,
        className: 'quake-tooltip'
      }
    );

    quakeGroup.addLayer(circle);
  });

  quakeGroup.addTo(map);
});

// Legend toggle
document.getElementById("legend-toggle").addEventListener("click", () => {
  document.getElementById("legend-box").classList.toggle("hidden");
});

// Advanced Search Panel
let miniMap;
let miniQuakeLayer = L.layerGroup();
let countryGeoJSON;

d3.json('/vid-projecttwo/data/countries.geo.json').then(geoData => {
  countryGeoJSON = geoData;
  const countryNames = geoData.features.map(f => f.properties.name);

  const input = document.getElementById('country-input');
  const suggestionsBox = document.getElementById('suggestions');

  input.addEventListener('input', () => {
    const value = input.value.toLowerCase();
    suggestionsBox.innerHTML = '';
    if (value.length < 1) return;
    const matches = countryNames.filter(name =>
      name.toLowerCase().includes(value)
    );
    matches.slice(0, 5).forEach(name => {
      const div = document.createElement('div');
      div.textContent = name;
      div.addEventListener('click', () => {
        input.value = name;
        suggestionsBox.innerHTML = '';
      });
      suggestionsBox.appendChild(div);
    });
  });

  document.getElementById('country-search-btn').addEventListener('click', () => {
    const selectedCountry = input.value.trim();
    const feature = geoData.features.find(
      f => f.properties.name.toLowerCase() === selectedCountry.toLowerCase()
    );
    if (!feature) {
      alert('Country not found!');
      return;
    }

    // RESET: clean previous search
    document.getElementById('mini-map-container').classList.remove('hidden');
    // Remove old mini-map instance if it exists
if (miniMap) {
  miniMap.remove();
  miniMap = null;
}
document.getElementById('mini-map-container').innerHTML = '<div id="mini-map"></div>';


    if (window.countryHighlightLayer) {
      window.countryHighlightLayer.clearLayers();
    }

    if (miniQuakeLayer) miniQuakeLayer.clearLayers();

    // Create or reuse mini-map
    if (!miniMap) {
      miniMap = L.map('mini-map').setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(miniMap);
    }

    const boundary = L.geoJSON(feature).addTo(miniMap);
    miniMap.fitBounds(boundary.getBounds());
    // map.fitBounds(boundary.getBounds());

    boundary.setStyle({
      color: "#0077cc",
      weight: 2,
      fillOpacity: 0.05
    });

    const bounds = boundary.getBounds();
    let totalMag = 0, totalDepth = 0, count = 0;

    if (!window.countryHighlightLayer) {
      window.countryHighlightLayer = L.layerGroup().addTo(map);
    } else {
      window.countryHighlightLayer.clearLayers();
    }

    d3.csv('/vid-projecttwo/data/cleaned_earthquakes_2024_2025.csv').then(data => {
      data.forEach(d => {
        const lat = +d.latitude;
        const lon = +d.longitude;
        const magnitude = +d.mag;
        const depth = +d.depth;
        const place = d.place;
        const time = new Date(d.time).toLocaleString();

        if (!bounds.contains([lat, lon])) return;

        totalMag += magnitude;
        totalDepth += depth;
        count++;

        const color = magnitude >= 6 ? '#ff0000' :
                      magnitude >= 5 ? '#ff8000' :
                      magnitude >= 4 ? '#ffff00' : '#00ff00';
        const radius = depth <= 10 ? 4 :
                       depth <= 30 ? 6 :
                       depth <= 70 ? 8 :
                       depth <= 300 ? 10 : 12;

        const miniCircle = L.circleMarker([lat, lon], {
          radius,
          fillColor: color,
          color: "#222",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).bindTooltip(
          `<b>${place}</b><br/>Mag: ${magnitude}, Depth: ${depth} km<br/>${time}`,
          { direction: 'top', sticky: true, opacity: 0.9, className: 'quake-tooltip' }
        );
        miniQuakeLayer.addLayer(miniCircle);

        const highlightCircle = L.circleMarker([lat, lon], {
          radius: 4,
          color: '#00ffff',
          fillColor: '#00ffff',
          fillOpacity: 0.6,
          weight: 1
        }).bindTooltip(`${place}<br>Mag: ${magnitude}, Depth: ${depth} km`);
        window.countryHighlightLayer.addLayer(highlightCircle);
      });

      miniQuakeLayer.addTo(miniMap);

      // Show stats
      const quakeCount = count;
      const avgMag = (totalMag / count).toFixed(2);
      const avgDepth = (totalDepth / count).toFixed(1);
      const statsHTML = `
        <p><strong>${quakeCount}</strong> earthquakes found in <strong>${selectedCountry}</strong></p>
        <p><strong>Average Magnitude:</strong> ${avgMag}</p>
        <p><strong>Average Depth:</strong> ${avgDepth} km</p>
      `;
      const statsDiv = document.createElement('div');
      statsDiv.innerHTML = statsHTML;
      document.getElementById('mini-map-container').appendChild(statsDiv);
    });
  });
});

// Toggle panel
document.getElementById("advanced-search-toggle").addEventListener("click", () => {
  document.getElementById("advanced-search-panel").classList.toggle("hidden");
});

// Close panel button
document.getElementById("close-search-panel").addEventListener("click", () => {
  document.getElementById("advanced-search-panel").classList.add("hidden");
});

// Clear search
document.getElementById('clear-search-btn').addEventListener('click', () => {
  document.getElementById('country-input').value = '';
  document.getElementById('suggestions').innerHTML = '';
  document.getElementById('mini-map-container').classList.add('hidden');

  if (miniMap) {
    miniMap.eachLayer(layer => {
      if (layer instanceof L.TileLayer) return;
      miniMap.removeLayer(layer);
    });
    miniQuakeLayer.clearLayers();
  }

  if (window.countryHighlightLayer) {
    map.removeLayer(window.countryHighlightLayer);
  }
});
