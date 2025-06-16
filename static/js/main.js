let map;
let currentMapLayers = L.layerGroup(); // Group to manage task-specific layers
let mapControls = {}; // Object to store references to added controls
const sidebarInfo = document.getElementById('info');

// Base path for static images (if needed, otherwise direct paths are fine)
// const staticBasePath = "/static"; // Flask serves static folder at root

function initMap() {
    map = L.map('map').setView([59.85, 17.65], 6); // Initial view (e.g., Sweden)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    currentMapLayers.addTo(map); // Add the layer group to the map
}

function resetMapAndSidebar() {
    currentMapLayers.clearLayers(); // Clears all layers added to this group

    // Remove specific controls if they exist and were stored
    if (mapControls.drawControl) {
        map.removeControl(mapControls.drawControl);
        mapControls.drawControl = null;
        map.off(L.Draw.Event.CREATED); // Remove specific event listener
    }
    if (mapControls.polylineMeasure) {
        map.removeControl(mapControls.polylineMeasure);
        mapControls.polylineMeasure = null;
    }
    // Add other controls here if you add them dynamically

    sidebarInfo.innerHTML = '<p>Select a task from the buttons above.</p>';
    // map.setView([59.85, 17.65], 6); // Optionally reset view
}

function getImageForFeature(featureType) {
    // Corrected paths - relative to the domain root where Flask serves 'static'
    switch (featureType.toLowerCase()) {
        case 'point':
            return "/static/images/point.png"; // Assuming you have these images
        case 'line':
            return "/static/images/line.png";
        case 'polygon':
            return "/static/images/polygon.png";
        default:
            return "/static/images/default.png";
    }
}

function showTask1() {
    resetMapAndSidebar();
    map.setView([59.3293, 18.0686], 10); // Stockholm area

    sidebarInfo.innerHTML = `
        <div class="info-container">
            <h3>Task 1: Draw Features</h3>
            <p>Use the drawing tools (top left) to create points, lines, and polygons. Click on a feature to see its popup.</p>
        </div>`;

    // Add Leaflet.Draw control
    mapControls.drawControl = new L.Control.Draw({
        edit: { featureGroup: currentMapLayers }, // Allow editing of drawn items
        draw: {
            polygon: true,
            polyline: true,
            rectangle: false, // As per your original
            circle: false,
            circlemarker: false,
            marker: true
        }
    });
    map.addControl(mapControls.drawControl);

    map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        let featureType = '';
        let popupContent = "A drawn feature.";

        if (layer instanceof L.Marker) featureType = 'Point';
        else if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle)) featureType = 'Polygon'; // L.Rectangle is a L.Polygon
        else if (layer instanceof L.Polyline) featureType = 'Line';


        const imageUrl = getImageForFeature(featureType); // Get image based on type

        popupContent = `
            <h4>${featureType}</h4>
            <p>This is a ${featureType.toLowerCase()} feature.</p>
            <img src="${imageUrl}" alt="${featureType}" style="width:100px; height:auto;">
        `;
        layer.bindPopup(popupContent);
        currentMapLayers.addLayer(layer);
    });
}

function showTask2() {
    resetMapAndSidebar();
    // Set view to cover the general Uppsala area, including a bit north for Gamla Uppsala.
    // We can also use map.fitBounds later if preferred, once markers are added.
    map.setView([59.875, 17.635], 12); // Centered more broadly to see all POIs initially

    // Add PolylineMeasure control
    mapControls.polylineMeasure = L.control.polylineMeasure({
        position: 'topleft',
        unit: 'kilometres', // As per assignment
        showBearings: true,
        clearMeasurementsOnStop: false,
        showClearControl: true,
        showUnitControl: true
    });
    map.addControl(mapControls.polylineMeasure);

    const pois = [
        {
            name: "Uppsala Domkyrka (Cathedral)",
            coords: [59.85805, 17.63369],
            info: "Scandinavia's largest cathedral, a Gothic masterpiece and historic landmark.",
            image: "/static/images/uppsala_cathedral.jpg"
        },
        {
            name: "Uppsala Slott (Castle)",
            coords: [59.85495, 17.63538],
            info: "A 16th-century royal castle with a distinctive pink facade, overlooking the city.",
            image: "/static/images/uppsala_castle.JPG"
        },
        {
            name: "Gustavianum (University Museum)",
            coords: [59.85765, 17.63217],
            info: "Oldest Uppsala University building, famed for its Anatomical Theatre.",
            image: "/static/images/gustavianum.JPG"
        },
        {
            name: "Carolina Rediviva (University Library)",
            coords: [59.85540, 17.63098],
            info: "Sweden's oldest university library, housing the precious Codex Argenteus.",
            image: "/static/images/carolina_rediviva.jpg"
        },
        {
            name: "Gamla Uppsala (Old Uppsala)",
            coords: [59.89750, 17.63250], // Centered on the mounds area
            info: "Major Iron Age archaeological site with royal burial mounds and Viking history.",
            image: "/static/images/gamla_uppsala.JPG"
        }
    ];

    let poiListHTML = `<div class="info-container">
        <h3>Task 2: Uppsala Landmarks</h3>
        <p>Click a marker or a name in the list. Use the measure tool (top left) for distances.</p><ul>`;

    const poiMarkersGroup = []; // To collect markers for fitting bounds

    pois.forEach((poi, index) => {
        const marker = L.marker(poi.coords)
            .bindPopup(`<b>${poi.name}</b>`)
            .on('click', () => updateSidebarWithPOI(poi, pois, index)); // Pass all POIs and index
        currentMapLayers.addLayer(marker);
        poiMarkersGroup.push(marker); // Add marker to the group
        poiListHTML += `<li><a href="#" onclick="focusAndShowPOI(${index}); return false;">${poi.name}</a></li>`;
    });
    poiListHTML += `</ul></div><div id="poi-details"></div>`; // poi-details will be filled by updateSidebarWithPOI
    sidebarInfo.innerHTML = poiListHTML;

    // Store POIs globally for focusAndShowPOI function
    window.task2POIs = pois;
    // Store markers. Since currentMapLayers is cleared and then only these markers are added,
    // this should be fine. Alternatively, use the poiMarkersGroup directly.
    window.task2Markers = currentMapLayers.getLayers();


    // Fit map to the bounds of all POI markers
    if (poiMarkersGroup.length > 0) {
        const group = L.featureGroup(poiMarkersGroup);
        map.fitBounds(group.getBounds().pad(0.2)); // pad(0.2) adds some padding around the bounds
    }
}

// The updateSidebarWithPOI and focusAndShowPOI functions from the previous complete main.js
// should work as they are, but ensure they are present in your main.js:

function updateSidebarWithPOI(poi, allPOIs, currentIndex) {
    // Regenerate the list part to keep it
    let poiListHTML = `<div class="info-container">
        <h3>Task 2: Uppsala Landmarks</h3>
        <p>Click a marker or a name in the list. Use the measure tool (top left) for distances.</p><ul>`;
    allPOIs.forEach((p, index) => {
        poiListHTML += `<li><a href="#" onclick="focusAndShowPOI(${index}); return false;">${p.name}</a></li>`;
    });
    poiListHTML += `</ul></div>`;

    // Add details of the clicked POI
    const detailHTML = `
        <div class="info-container" id="poi-details-content">
            <h4>${poi.name}</h4>
            <img src="${poi.image}" alt="${poi.name}" style="width:100%; max-width:200px; margin-bottom:10px;">
            <p><b>Location:</b> ${poi.coords[0].toFixed(5)}, ${poi.coords[1].toFixed(5)}</p>
            <p>${poi.info}</p>
        </div>`;
    // Replace the entire sidebar content or append to a specific details section
    // Assuming sidebarInfo is the main container for all sidebar task content:
    sidebarInfo.innerHTML = poiListHTML + detailHTML;
}

function focusAndShowPOI(index) {
    const poi = window.task2POIs[index];
    // Ensure task2Markers is correctly populated with the actual marker instances
    // If currentMapLayers.getLayers() was used, it should be fine.
    const marker = window.task2Markers[index];

    if (poi && marker) {
        map.setView(marker.getLatLng(), 15); // Zoom in a bit more when focusing
        marker.openPopup();
        updateSidebarWithPOI(poi, window.task2POIs, index); // Update sidebar as well
    }
}


// async function showTask3() {
//     resetMapAndSidebar();
//     sidebarInfo.innerHTML = `<div class="info-container"><h3>Task 3: Supermarkets & Buffers</h3><p>Loading data...</p></div>`;
//     map.setView([59.3293, 18.0686], 10); // General Sweden view

//     try {
//         // Fetch supermarket data (can use your /api/supermarkets or direct fetch)
//         const response = await fetch('/static/data/supermarket.geojson'); // Ensure this file exists
//         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//         const supermarketsData = await response.json();

//         if (!supermarketsData.features || supermarketsData.features.length === 0) {
//             sidebarInfo.innerHTML = `<div class="info-container error">No supermarket features found.</div>`;
//             return;
//         }

//         const supermarketBuffers = [];
//         const supermarketMarkers = [];

//         // First, create all markers and buffers
//         supermarketsData.features.forEach((feature, index) => {
//             if (feature.geometry && feature.geometry.type === "Point") {
//                 const marker = L.marker(L.GeoJSON.coordsToLatLng(feature.geometry.coordinates))
//                     .bindPopup(feature.properties.name || `Supermarket ${index + 1}`);
//                 supermarketMarkers.push({ marker: marker, feature: feature }); // Store marker and original feature

//                 const buffer = turf.buffer(feature.geometry, 1, { units: 'kilometers' });
//                 supermarketBuffers.push({ bufferGeoJSON: buffer, originalFeature: feature });
//             }
//         });
        
//         // Now, check for overlaps and add to map
//         supermarketMarkers.forEach((sm, smIndex) => {
//             let isOverlapping = false;
//             const currentBufferGeoJSON = supermarketBuffers[smIndex].bufferGeoJSON;

//             for (let i = 0; i < supermarketBuffers.length; i++) {
//                 if (i === smIndex) continue; // Don't compare with itself

//                 // turf.intersect returns null if no intersection, or a feature/featurecollection if they do
//                 const intersection = turf.intersect(currentBufferGeoJSON, supermarketBuffers[i].bufferGeoJSON);
//                 if (intersection) {
//                     isOverlapping = true;
//                     break;
//                 }
//             }

//             // Add supermarket marker
//             currentMapLayers.addLayer(sm.marker);

//             // Add buffer layer, styled based on overlap
//             const bufferLayer = L.geoJSON(currentBufferGeoJSON, {
//                 style: {
//                     color: isOverlapping ? 'orange' : 'green', // Highlight non-overlapping in green
//                     weight: 2,
//                     opacity: 0.6,
//                     fillOpacity: 0.2
//                 }
//             }).bindPopup(`${sm.feature.properties.name || 'Supermarket'}: ${isOverlapping ? 'Overlapping Buffer' : 'Non-overlapping Buffer'}`);
//             currentMapLayers.addLayer(bufferLayer);

//             if (!isOverlapping) {
//                 // Optionally, make the non-overlapping supermarket marker more prominent
//                 sm.marker.setIcon(L.icon({
//                     iconUrl: '/static/images/green_pin.png',
//                     iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
//                 }));

//                  L.circleMarker(sm.marker.getLatLng(), {radius:10, color: 'lime', weight:3, fill:false}).addTo(currentMapLayers);
//             }
//         });

//         if (supermarketMarkers.length > 0) {
//              map.fitBounds(L.featureGroup(supermarketMarkers.map(sm => sm.marker)).getBounds().pad(0.1));
//         }
//         sidebarInfo.innerHTML = `<div class="info-container">
//             <h3>Task 3: Supermarkets & Buffers</h3>
//             <p>Supermarkets are shown with 1 KM buffers. Non-overlapping supermarkets/buffers are highlighted (e.g., green buffers or distinct markers).</p>
//             </div>`;

//     } catch (error) {
//         console.error("Error in Task 3:", error);
//         sidebarInfo.innerHTML = `<div class="info-container error">Error loading or processing supermarket data: ${error.message}</div>`;
//     }
// }
async function showTask3() {
    resetMapAndSidebar();
    sidebarInfo.innerHTML = `<div class="info-container"><h3>Task 3: Supermarkets & Buffers</h3><p>Loading data... Supermarkets are yellow pins. Non-overlapping are highlighted green. Features in "Task Features" layer.</p></div>`;
    map.setView([59.3293, 18.0686], 10); // General Sweden view

    try {
        const response = await fetch('/static/data/supermarket.geojson');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const supermarketsData = await response.json();

        if (!supermarketsData.features || supermarketsData.features.length === 0) {
            sidebarInfo.innerHTML = `<div class="info-container error">No supermarket features found.</div>`;
            return;
        }

        // --- Define your custom yellow icon here ---
        const yellowIcon = L.icon({
            iconUrl: '/static/images/yellow_pin.png', // Path to your yellow pin image
            iconRetinaUrl: '/static/images/marker-yellow-2x.png', // Optional, for high-res displays
            shadowUrl: '/static/images/marker-shadow.png',      // Standard shadow for the pin
            iconSize: [25, 41], // Size of the icon
            iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
            popupAnchor: [1, -34], // Point from which popups will "open", relative to the icon anchor
            shadowSize: [41, 41] // Size of the shadow
        });

        // --- Define your custom green icon here (if not already handled in the loop) ---
        // You might already have marker-green.png but ensure the icon definition matches
        const greenIcon = L.icon({
            iconUrl: '/static/images/green_pin.png', // Path to your green pin image
            iconRetinaUrl: '/static/images/marker-green-2x.png', // Optional
            shadowUrl: '/static/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });


        const supermarketBuffers = [];
        const supermarketMarkers = []; // To store our marker objects and their original features

        // First, create all markers and buffers
        supermarketsData.features.forEach((feature, index) => {
            if (feature.geometry && feature.geometry.type === "Point") {
                // --- MODIFICATION: Use L.marker with your custom yellowIcon ---
                const marker = L.marker(L.GeoJSON.coordsToLatLng(feature.geometry.coordinates), {
                    icon: yellowIcon // Assign the custom yellow icon
                }).bindPopup(feature.properties.name || `Supermarket ${index + 1}`);
                // --- END MODIFICATION ---

                supermarketMarkers.push({ marker: marker, feature: feature }); // Store marker and original feature

                const buffer = turf.buffer(feature.geometry, 1, { units: 'kilometers' });
                supermarketBuffers.push({ bufferGeoJSON: buffer, originalFeature: feature });
            }
        });

        // Now, check for overlaps and add to map
        supermarketMarkers.forEach((sm, smIndex) => {
            let isOverlapping = false;
            const currentBufferGeoJSON = supermarketBuffers[smIndex].bufferGeoJSON;

            for (let i = 0; i < supermarketBuffers.length; i++) {
                if (i === smIndex) continue; // Don't compare with itself

                const intersection = turf.intersect(currentBufferGeoJSON, supermarketBuffers[i].bufferGeoJSON);
                if (intersection) {
                    isOverlapping = true;
                    break;
                }
            }

            // Add supermarket marker to the 'Task Features' layer
            currentMapLayers.addLayer(sm.marker);

            // Add buffer layer, styled based on overlap
            const bufferLayer = L.geoJSON(currentBufferGeoJSON, {
                style: {
                    color: isOverlapping ? 'orange' : 'green', // Buffer outline
                    weight: 2,
                    opacity: 0.6,
                    fillOpacity: 0.2
                }
            }).bindPopup(`${sm.feature.properties.name || 'Supermarket'}: ${isOverlapping ? 'Overlapping Buffer' : 'Non-overlapping Buffer'}`);
            currentMapLayers.addLayer(bufferLayer); // Add buffer to 'Task Features' layer

            // --- MODIFICATION: Highlight non-overlapping pins by changing to green icon ---
            if (!isOverlapping) {
                sm.marker.setIcon(greenIcon); // Change the pin to green
            }
            // --- END MODIFICATION ---
        });

        if (supermarketMarkers.length > 0) {
             map.fitBounds(L.featureGroup(supermarketMarkers.map(sm => sm.marker)).getBounds().pad(0.1));
        }
        sidebarInfo.innerHTML = `<div class="info-container">
            <h3>Task 3: Supermarkets & Buffers</h3>
            <p>Supermarkets are yellow pins. Non-overlapping ones are highlighted as green pins. Buffers are orange (overlapping) or green (non-overlapping). All features in "Task Features" layer.</p>
            </div>`;

    } catch (error) {
        console.error("Error in Task 3:", error);
        sidebarInfo.innerHTML = `<div class="info-container error">Error loading or processing supermarket data: ${error.message}</div>`;
    }
}

function showTask4() {
    resetMapAndSidebar();
    const stockholmBounds = [[59.32, 18.05], [59.34, 18.09]]; 
    map.fitBounds(stockholmBounds);

    const imageUrl = '/static/images/thumbs-up-facebook.svg';

    const imageOverlay = L.imageOverlay(imageUrl, stockholmBounds, {
        opacity: 0.7,
        attribution: "Custom Image Overlay © YourSource"
    });
    currentMapLayers.addLayer(imageOverlay);

    sidebarInfo.innerHTML = `
        <div class="info-container">
            <h3>Task 4: Image Overlay</h3>
            <p>An image has been overlaid on the basemap in the Stockholm area.</p>
            <img src="${imageUrl}" alt="Overlay Preview" style="width:100%; max-width:200px; margin-top:10px;">
        </div>`;
}

async function showTask5() {
    resetMapAndSidebar();
    sidebarInfo.innerHTML = `<div class="info-container"><h3>Task 5: Fuel Stations Cluster</h3><p>Loading data...</p></div>`;
    map.setView([62, 15], 5); // General Sweden view

    try {
        const response = await fetch('/static/data/fuel.geojson'); // Ensure this file exists
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const fuelData = await response.json();

        if (!fuelData.features || fuelData.features.length === 0) {
            sidebarInfo.innerHTML = `<div class="info-container error">No fuel station features found.</div>`;
            return;
        }

        const markers = L.markerClusterGroup({
             spiderfyOnMaxZoom: true,
             showCoverageOnHover: false,
             zoomToBoundsOnClick: true
        });

        const geoJsonLayer = L.geoJSON(fuelData, {
            onEachFeature: function (feature, layer) {
                let popupText = "Fuel Station";
                if (feature.properties) {
                    if (feature.properties.name_sv) popupText = feature.properties.name_sv;
                    else if (feature.properties.name) popupText = feature.properties.name;
                    else if (feature.properties.brand) popupText = feature.properties.brand;
                }
                layer.bindPopup(popupText);
            }
        });
        markers.addLayer(geoJsonLayer);
        currentMapLayers.addLayer(markers); // Add cluster group to our manageable layer group
        
        if (fuelData.features.length > 0) {
            map.fitBounds(markers.getBounds().pad(0.1));
        }
        sidebarInfo.innerHTML = `<div class="info-container">
            <h3>Task 5: Fuel Stations Cluster</h3>
            <p>Fuel stations from fuel.geojson are displayed using MarkerCluster. Zoom in to see individual markers.</p>
            </div>`;

    } catch (error) {
        console.error("Error in Task 5:", error);
        sidebarInfo.innerHTML = `<div class="info-container error">Error loading fuel station data: ${error.message}</div>`;
    }
}


// --- VG Tasks ---
async function showTask6() {
    resetMapAndSidebar();
    sidebarInfo.innerHTML = `<div class="info-container"><h3>Task 6: Weather API</h3><p>Fetching weather data...</p></div>`;
    map.setView([62, 15], 4); // Sweden

    const apiKey = '6ca44591ce89b2fcdf1d698171d5b41a';

    const cities = [
        { name: "Stockholm", lat: 59.3293, lon: 18.0686 },
        { name: "Gothenburg", lat: 57.7089, lon: 11.9746 },
        { name: "Malmö", lat: 55.6050, lon: 13.0038 },
        { name: "Uppsala", lat: 59.8586, lon: 17.6389 },
        { name: "Kiruna", lat: 67.8558, lon: 20.2253 }
    ];

    let weatherContent = `<div class="info-container"><h3>Task 6: Weather Information</h3>`;
    let promises = [];

    cities.forEach(city => {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric&cnt=5`; // 5 forecast periods (3-hour intervals)

        promises.push(
            Promise.all([fetch(weatherUrl).then(res => res.json()), fetch(forecastUrl).then(res => res.json())])
            .then(([current, forecastData]) => {
                if (current.cod !== 200) throw new Error(current.message || `Error fetching current weather for ${city.name}`);
                if (forecastData.cod !== "200") throw new Error(forecastData.message || `Error fetching forecast for ${city.name}`);

                const marker = L.marker([city.lat, city.lon])
                    .bindPopup(`<b>${city.name}</b><br>Temp: ${current.main.temp}°C<br>${current.weather[0].description}`)
                    .on('click', () => {
                        // Update sidebar specifically for this city on click
                        let detailHTML = `<div class="info-container"><h4>Weather for ${city.name}</h4>
                                        <p><img src="http://openweathermap.org/img/wn/${current.weather[0].icon}.png" alt="weather icon"> 
                                        Currently: ${current.main.temp}°C, ${current.weather[0].description}</p>
                                        <p>Humidity: ${current.main.humidity}% | Wind: ${current.wind.speed} m/s</p>
                                        <h5>Forecast (next ~15 hours):</h5><ul>`;
                        forecastData.list.slice(0, 5).forEach(f => { // Display first 5 forecast entries
                            detailHTML += `<li>${new Date(f.dt*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}: ${f.main.temp}°C, ${f.weather[0].description}</li>`;
                        });
                        detailHTML += `</ul></div>`;
                        document.getElementById('weather-details-sidebar').innerHTML = detailHTML; // Assume an element for this
                    });
                currentMapLayers.addLayer(marker);

                // Append to general sidebar content
                weatherContent += `<div><h4>${city.name}</h4>
                                    <p><img src="http://openweathermap.org/img/wn/${current.weather[0].icon}.png" alt="weather icon"> 
                                    Currently: ${current.main.temp}°C, ${current.weather[0].description}</p></div>`;
            })
            .catch(error => {
                 console.error(`Weather fetch error for ${city.name}:`, error);
                 weatherContent += `<div><h4>${city.name}</h4><p class="error">Could not load weather data.</p></div>`;
            })
        );
    });
    
    Promise.allSettled(promises).then(() => {
         weatherContent += `</div><div id="weather-details-sidebar"></div>`; // Placeholder for clicked city details
         sidebarInfo.innerHTML = weatherContent;
    });
}


async function showTask7() {
    resetMapAndSidebar();
    sidebarInfo.innerHTML = `<div class="info-container"><h3>Task 7: School K-Means Clustering</h3><p>Loading and clustering school data...</p></div>`;
    map.setView([59.85, 17.65], 7); // Adjust view for Sweden schools

    try {
        // Your Flask backend endpoint handles the CSV reading and K-Means
        const response = await fetch('/api/schools/clusters');
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.error) throw new Error(data.error);
        if (!data.schools || data.schools.length === 0) {
            sidebarInfo.innerHTML = `<div class="info-container error">No school data found or error in clustering.</div>`;
            return;
        }

        const colors = ['red', 'blue', 'green', 'purple', 'orange', 'darkred', 'cadetblue', 'darkgreen', 'darkpurple', 'lightred']; // More colors if needed
        let clusterSummaryHTML = "<h4>Cluster Summary:</h4><ul>";
        const clusterCounts = {};


        data.schools.forEach(school => {
            const clusterId = school.cluster; // From your backend
            const color = colors[clusterId % colors.length];
            clusterCounts[clusterId] = (clusterCounts[clusterId] || 0) + 1;

            L.circleMarker([school.ycoord, school.xcoord], { // Assuming ycoord is lat, xcoord is lon
                radius: 5,
                fillColor: color,
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(`<b>${school.Name || 'School'}</b><br>Cluster: ${clusterId + 1}<br>${school.descriptio || ''}`)
              .addTo(currentMapLayers);
        });

        data.centers.forEach((center, i) => {
            const color = colors[i % colors.length];
            L.circleMarker([center[1], center[0]], { // Assuming center format [lon, lat] from sklearn
                radius: 10,
                fillColor: color,
                color: 'black',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.6
            }).bindPopup(`<b>Cluster ${i + 1} Center</b>`).addTo(currentMapLayers);
            clusterSummaryHTML += `<li><span style="display:inline-block; width:12px; height:12px; background-color:${color}; margin-right: 5px;"></span>Cluster ${i+1}: ${clusterCounts[i] || 0} schools</li>`;
        });
        clusterSummaryHTML += "</ul>";

        sidebarInfo.innerHTML = `<div class="info-container">
            <h3>Task 7: School K-Means Clustering</h3>
            <p>Schools are clustered using K-Means (processed on the backend). Each color represents a different cluster. Larger markers are cluster centers.</p>
            ${clusterSummaryHTML}
            </div>`;
        
        // Fit map to bounds of school data if available
        if (currentMapLayers.getLayers().length > 0) {
            map.fitBounds(currentMapLayers.getBounds().pad(0.1));
        }


    } catch (error) {
        console.error("Error in Task 7:", error);
        sidebarInfo.innerHTML = `<div class="info-container error">Error processing school data: ${error.message}</div>`;
    }
}


// Initialize map on page load
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    // Optionally, display a default task or welcome message
    sidebarInfo.innerHTML = `<div class="info-container">
        <h2>Welcome!</h2>
        <p>Select a GIS task from the buttons on the left to begin.</p>
        <p>This application demonstrates various Leaflet.js functionalities with a Flask backend.</p>
        </div>`;
});