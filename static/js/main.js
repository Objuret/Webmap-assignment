document.addEventListener('DOMContentLoaded', () => {
    /* ----------  Map & base layers initialization  ---------- */
    // Initialize main map centered on Sandviken/Falun area with zoom level 10
    const map = L.map('map').setView([60.6058, 15.6272], 10);
    
    // Create OpenStreetMap base layer (default)
    const osm  = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    { attribution: '© OpenStreetMap' }).addTo(map);
    
    // Create Esri satellite imagery base layer
    const esri = L.tileLayer(
                    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    { attribution: '© Esri' });
    
    // Add layer control to switch between base layers
    L.control.layers(
        { OpenStreetMap: osm, 'Esri World Imagery': esri }, // Base layers
        {}                                                  // Overlay layers (task layers added later)
    ).addTo(map);

    // Track which base layer is currently active for mini-map functionality
    let currentBaseLayer = osm;
    map.on('baselayerchange', e => {
        currentBaseLayer = e.layer;
    });
    
    // Helper function to get the alternate base layer for mini-maps
    function getAlternateBase() {
        return currentBaseLayer === osm ? esri : osm;
    }

    /* ----------  Sidebar & task panels setup  ---------- */
    // Initialize right-side sidebar for task information
    const sidebar = L.control.sidebar({ container: 'sidebar', position: 'right' })
                    .addTo(map);

    // Add intro panel as landing page
    sidebar.addPanel({
        id   : 'intro',
        tab  : '<i class="fa-solid fa-bars"></i>',
        title: 'Webmap Tasks',
        pane : '<p>Select a task tab to begin.</p>'
    });

    /* ----------  Task definitions & sidebar tabs creation  ---------- */
    // Create 7 task definitions with consistent naming
    const taskDefs = Array.from({ length: 7 }, (_, i) => ({
        id   : `task${i + 1}`,
        label: `Task ${i + 1}`
    }));

    // Generate sidebar panels for each task
    taskDefs.forEach(t =>
        sidebar.addPanel({
            id   : t.id,
            tab  : t.label.split(' ')[1],      // Extract just the number "1", "2", etc.
            title: t.label,
            pane : `
            <div class="task-body"></div>    <!-- Task description goes here -->
            <div class="task-info">Select a feature …</div>` // Feature info displayed here
        })
    );

    /* ----------  Feature groups per task & layer control  ---------- */
    // Create separate feature groups for each task to organize layers
    const taskLayers = Object.fromEntries(
        taskDefs.map(t => [t.id, L.featureGroup()])
    );
    
    /* ----------  Shared housekeeping helpers  ---------- */
    let activeTask  = null;    // Currently selected task
    let activeGroup = null;    // Currently active feature group
    let toolCtrl    = null;    // Current toolbar/control reference
    let drawCreated = null;    // Reference to current draw event handler

    
    // Clean up tools and controls when switching tasks
    const clearTools = () => {
        if (toolCtrl?._dispose) toolCtrl._dispose();   // Custom dispose method if available
        if (toolCtrl) map.removeControl(toolCtrl);     // Remove control from map
        toolCtrl = null;
    };

    // Add task layer control to map
    const layerCtrl = L.control.layers(null, taskLayers).addTo(map);

    // Remove all task layers from map
    const clearLayers = () => {
        Object.values(taskLayers).forEach(g => map.removeLayer(g));
        activeGroup = null;
    };

    // Utility function to open sidebar and inject HTML content
    function showInfo(taskId, html) {
        document.querySelector(`#${taskId} .task-info`).innerHTML = html;
        sidebar.open(taskId);
    }
    
    // Helper to bind click events to features for sidebar display
    function clickedFeatureInfo(layer, taskId, data = {}) {
        layer.on('click', () => {
            const rows = Object.entries(data)
                .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
                .join('');
            showInfo(taskId, `<dl>${rows}</dl>`);
        });
    }

    /* ----------  Task 1: Drawing tools with mini-map popups  ---------- */
    function initTask1() {
        initTask1.desc =
            'Create point, line and polygon features; each shows a live mini-map pop-up.';

        // Activate task layer group
        activeGroup = taskLayers.task1;
        map.addLayer(activeGroup);

        // Configure measurement options for drawn features
        const measureOpts = {
            metric: true,
            tooltip: { permanent: true, direction: 'center' }
        };

        // Initialize Leaflet Draw control with various drawing tools
        toolCtrl = new L.Control.Draw({
            draw: {
                polyline:  measureOpts,
                polygon:   { ...measureOpts, showArea: true, allowIntersection: false },
                rectangle: { ...measureOpts, showArea: true },
                circle:    { ...measureOpts, showRadius: true },
                marker:    {}
            },
            edit: { featureGroup: activeGroup }
        }).addTo(map);

        let popupCounter = 0;

        // Handle creation of new drawn features
        const onDrawCreated = e => {
            const layer = e.layer;
            activeGroup.addLayer(layer);

            // Calculate feature properties based on geometry type
            const center = layer.getLatLng?.() || layer.getBounds().getCenter();
            const info = {
                Coordinates: `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`
            };

            // Add type-specific information
            if (layer instanceof L.Marker) {
                info.Type = "Point";
            } else if (layer instanceof L.Circle) {
                info.Type = "Circle";
                info.Radius = `${layer.getRadius().toFixed(1)} m`;
            } else if (layer instanceof L.Rectangle) {
                info.Type = "Rectangle";
                const b = layer.getBounds();
                const sw = b.getSouthWest(), ne = b.getNorthEast();
                const w = sw.distanceTo(L.latLng(sw.lat, ne.lng));
                const h = sw.distanceTo(L.latLng(ne.lat, sw.lng));
                info.Area = `${(w * h / 1e6).toFixed(2)} km²`;
            } else if (layer instanceof L.Polygon) {
                info.Type = "Polygon";
                const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
                info.Area = `${(area / 1e6).toFixed(2)} km²`;
            } else if (layer instanceof L.Polyline) {
                info.Type = "Line";
                const length = L.GeometryUtil.length(layer);
                info.Length = `${(length / 1000).toFixed(2)} km`;
            }

            // Create mini-map popup functionality
            const popupId = `mini-map-${popupCounter++}`;
            const size    = 200;
            layer.bindPopup(`
                <div style="margin-bottom: 8px;">
                    <strong>Type:</strong> ${info.Type || "Unknown"}<br>
                    <strong>Coordinates:</strong> ${info.Coordinates}
                    ${info.Area ? `<br><strong>Area:</strong> ${info.Area}` : ""}
                    ${info.Length ? `<br><strong>Length:</strong> ${info.Length}` : ""}
                    ${info.Radius ? `<br><strong>Radius:</strong> ${info.Radius}` : ""}
                </div>
                <div id="${popupId}" style="width:${size}px; height:${size}px;"></div>
             `);

            // Initialize mini-map when popup opens
            layer.on('popupopen', () => {
                setTimeout(() => {
                const miniMap = L.map(popupId, {
                    attributionControl: false,
                    zoomControl: false,
                    interactive: false
                }).setView(center, map.getZoom());
                
                // Use alternate base layer for mini-map
                const alt = getAlternateBase();
                L.tileLayer(alt._url, alt.options).addTo(miniMap);

                // Add feature to mini-map
                if (layer instanceof L.Circle) {
                    L.circle(layer.getLatLng(), { radius: layer.getRadius() }).addTo(miniMap);
                } else {
                    L.geoJSON(layer.toGeoJSON(), {
                        style: layer.options,
                        pointToLayer: (f, latlng) => L.marker(latlng, { icon: layer.options.icon })
                    }).addTo(miniMap);
                }
                }, 100);
            });

            // Handle click to show popup and sidebar info
            layer.on('click', () => {
                layer.openPopup();
                const rows = Object.entries(info)
                    .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
                    .join('');
                showInfo('task1', `<dl>${rows}</dl>`);
            });

            // Auto-show sidebar info for newly created features
            layer.fire('click');
        };

        // Bind draw event handler
        map.on(L.Draw.Event.CREATED, onDrawCreated);
        drawCreated = onDrawCreated;

        // Custom dispose method for cleanup
        toolCtrl._dispose = () => {
            map.off(L.Draw.Event.CREATED, onDrawCreated);
        };
    }

    /* ----------  Task 2: Points of Interest with distance measurement  ---------- */
    function initTask2() {
        initTask2.desc = 'Show five POIs in Falun, list their info in the sidebar and measure distance.';
        
        // Define 5 points of interest in Falun
        const falunLocations = [
            { name: "Falun Mine", lat: 60.5989, lng: 15.6122, img: '/static/images/gruvan.jpg', description: "UNESCO World Heritage Site and former copper mine." }, 
            { name: "Lugnet Sports Complex", lat: 60.6179, lng: 15.6554, img: '/static/images/lugnet.jpg', description: "Large sports complex." },
            { name: "Falun City Hall", lat: 60.6078, lng: 15.6297, img: '/static/images/stadshuset.jpg', description: "Historic town hall on Stora Torget." }, 
            { name: "Stora Kopparbergs Church", lat: 60.6077, lng: 15.6306, img: '/static/images/kyrkan.jpg', description: "The main church in Falun." }, 
            { name: "Dalarna Museum", lat: 60.6058, lng: 15.6272, img: '/static/images/dalarnasmuseum.jpg', description: "Museum of Dalarna's history and culture." } 
        ];

        activeGroup = taskLayers.task2;
        map.addLayer(activeGroup);
        
        // Add distance measurement tool
        toolCtrl = L.control.polylineMeasure({
            position: 'topleft',
            unit: 'km',
            clearMeasurementsOnStop: false,
            showClearControl: true,
            showUnitControl: true,
            permanent: false,
            tooltipText: 'Click to start measuring'
        }).addTo(map);
        
        let popupCounter = 0;

        // Create markers for each POI
        falunLocations.forEach(loc => {
            const marker = L.marker([loc.lat, loc.lng]).addTo(activeGroup);
            
            // Prepare information for sidebar display
            const info = {
                Name: loc.name,
                Description: loc.description,
                Coordinates: `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`,
                Image: `<hr><img src="${loc.img}" style="max-width:100%; max-height: 400px; display:block; margin-top:0.5em;">`
            };

            // Create popup with circular image
            marker.bindPopup(`
                <div style="text-align: center;">
                    <h4 style="margin: 5px 0;">${loc.name}</h4>
                    <img src="${loc.img}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
                </div>
            `);

            // Handle click to show popup and detailed sidebar info
            marker.on('click', () => {
                marker.openPopup();
                const rows = Object.entries(info)
                    .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
                    .join('');
                showInfo('task2', `<dl>${rows}</dl>`);
            });
        });
    }

    /* ----------  Task 3: Supermarket buffers with overlap detection  ---------- */
    function initTask3() {
        initTask3.desc = 'Load supermarket.geoJSON, build 1 km buffers, highlight non-overlapping ones.';
        
        activeGroup = taskLayers.task3;
        map.addLayer(activeGroup);
        
        // Load supermarket GeoJSON data
        fetch('/static/data/supermarket.geoJSON')
            .then(response => response.json())
            .then(data => {
                const supermarkets = [];
                const buffers = [];
                
                // Process each supermarket feature
                data.features.forEach(feature => {
                    const coords = feature.geometry.coordinates;
                    const latlng = [coords[1], coords[0]]; // Convert GeoJSON lng,lat to Leaflet lat,lng
                    const name = feature.properties.name || 'Supermarket';
                    
                    // Create marker for supermarket
                    const marker = L.marker(latlng)
                        .bindPopup(`<b>${name}</b>`)
                        .addTo(activeGroup);
                    
                    supermarkets.push({ marker, latlng, name });
                    
                    // Create 1km buffer using Turf.js library
                    const point = turf.point(coords);
                    const buffer = turf.buffer(point, 1, { unit: 'kilometers' });
                    buffers.push(buffer);
                    
                    // Add buffer visualization to map
                    const bufferLayer = L.geoJSON(buffer, {
                        style: {
                            color: 'blue',
                            weight: 2,
                            opacity: 0.6,
                            fillOpacity: 0.1
                        }
                    }).addTo(activeGroup);
                });
                
                // Check for buffer overlaps and highlight isolated supermarkets
                supermarkets.forEach((sm, i) => {
                    let hasOverlap = false;
                    
                    // Compare current buffer with all other buffers
                    for (let j = 0; j < buffers.length; j++) {
                        if (i !== j) {
                            try {
                                const intersection = turf.intersect(buffers[i], buffers[j]);
                                if (intersection) {
                                    hasOverlap = true;
                                    break;
                                }
                            } catch (e) {
                                // Handle geometry computation errors
                            }
                        }
                    }
                    
                    // Highlight non-overlapping supermarkets with red markers
                    if (!hasOverlap) {
                        sm.marker.setIcon(L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41]
                        }));
                    }
                    
                    // Add click handler for detailed information
                    clickedFeatureInfo(sm.marker, 'task3', {
                        Name: sm.name,
                        Coordinates: `${sm.latlng[0].toFixed(5)}, ${sm.latlng[1].toFixed(5)}`,
                        'Buffer Overlap': hasOverlap ? 'Yes' : 'No (Highlighted)'
                    });
                });
                
                // Fit map view to show all supermarkets
                if (supermarkets.length > 0) {
                    const group = new L.featureGroup(supermarkets.map(sm => sm.marker));
                    map.fitBounds(group.getBounds(), { padding: [25, 25] });
                }
            })
            .catch(error => {
                console.error('Error loading supermarket data:', error);
                showInfo('task3', '<p>Error loading supermarket data. Check file location.</p>');
            });
    }

    /* ----------  Task 4: Image overlay with opacity control  ---------- */
    function initTask4() {
        initTask4.desc = 'Overlay a georeferenced image on the basemap anywhere in Sweden.';
        
        activeGroup = taskLayers.task4;
        map.addLayer(activeGroup);
        
        // Define image overlay parameters
        const imageUrl = '/static/images/thumbs-up-facebook.svg';
        const imageBounds = [
            [60.58, 15.60], // Southwest corner (Falun area)
            [60.63, 15.66]  // Northeast corner
        ];
        
        // Create image overlay on map
        const imageOverlay = L.imageOverlay(imageUrl, imageBounds, {
            opacity: 0.7,
            interactive: true
        }).addTo(activeGroup);
        
        // Add click handler to show overlay information
        imageOverlay.on('click', () => {
            showInfo('task4', `
                <dl>
                    <dt>Type</dt><dd>Image Overlay</dd>
                    <dt>Location</dt><dd>Falun Area</dd>
                    <dt>Bounds</dt><dd>SW: ${imageBounds[0].join(', ')}<br>NE: ${imageBounds[1].join(', ')}</dd>
                    <dt>Opacity</dt><dd>70%</dd>
                </dl>
            `);
        });
        
        // Fit map to image bounds
        map.fitBounds(imageBounds, { padding: [25, 25] });
        
        // Create opacity control slider
        const opacityControl = L.control({ position: 'topleft' });
        opacityControl.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'leaflet-control-layers leaflet-control');
            div.innerHTML = `
                <label>Image Opacity: </label>
                <input type="range" min="0" max="100" value="70" id="opacity-slider">
                <span id="opacity-value">70%</span>
            `;
            
            const slider = div.querySelector('#opacity-slider');
            const valueSpan = div.querySelector('#opacity-value');
            
            // Handle opacity changes
            slider.addEventListener('input', (e) => {
                const opacity = e.target.value / 100;
                imageOverlay.setOpacity(opacity);
                valueSpan.textContent = `${e.target.value}%`;
            });
            
            return div;
        };
        
        toolCtrl = opacityControl.addTo(map);
    }

    /* ----------  Task 5: Fuel station clustering  ---------- */
    function initTask5() {
        initTask5.desc = 'Cluster fuel.geoJSON points with Leaflet.markercluster; pop-ups show station names.';
        
        activeGroup = taskLayers.task5;
        map.addLayer(activeGroup);
        
        // Create marker cluster group with configuration
        const markers = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50
        });
        
        // Load fuel station GeoJSON data
        fetch('/static/data/fuel.geoJSON')
            .then(response => response.json())
            .then(data => {
                // Process each fuel station
                data.features.forEach(feature => {
                    const coords = feature.geometry.coordinates;
                    const latlng = [coords[1], coords[0]]; // Convert GeoJSON to Leaflet format
                    const name = feature.properties.name || feature.properties.brand || 'Fuel Station';
                    
                    // Create marker with popup
                    const marker = L.marker(latlng)
                        .bindPopup(`
                            <div>
                                <h4>${name}</h4>
                                <p><strong>Coordinates:</strong> ${latlng[0].toFixed(5)}, ${latlng[1].toFixed(5)}</p>
                            </div>
                        `);
                    
                    // Add click handler for sidebar information
                    marker.on('click', () => {
                        showInfo('task5', `
                            <dl>
                                <dt>Station Name</dt><dd>${name}</dd>
                                <dt>Coordinates</dt><dd>${latlng[0].toFixed(5)}, ${latlng[1].toFixed(5)}</dd>
                                <dt>Type</dt><dd>Fuel Station</dd>
                            </dl>
                        `);
                    });
                    
                    // Add marker to cluster group
                    markers.addLayer(marker);
                });
                
                // Add clustered markers to active group
                activeGroup.addLayer(markers);
                
                // Fit map to show all markers
                if (markers.getLayers().length > 0) {
                    map.fitBounds(markers.getBounds(), { padding: [25, 25] });
                }
            })
            .catch(error => {
                console.error('Error loading fuel station data:', error);
                showInfo('task5', '<p>Error loading fuel station data. Check file location.</p>');
            });
        
        toolCtrl = markers; // Keep reference for cleanup
    }

    /* ----------  Task 6: Real-time weather data  ---------- */
    function initTask6() {
        initTask6.desc = 'Display current and forecast weather for five cities in pop-ups and sidebar.';
        
        activeGroup = taskLayers.task6;
        map.addLayer(activeGroup);
        
        // Define cities in Dalarna region for weather display
        const cities = [
            { name: 'Falun', lat: 60.6058, lng: 15.6272 },
            { name: 'Borlänge', lat: 60.4858, lng: 15.4362 },
            { name: 'Mora', lat: 61.0057, lng: 14.5420 },
            { name: 'Ludvika', lat: 60.1495, lng: 15.1875 },
            { name: 'Avesta', lat: 60.1447, lng: 16.1686 }
        ];
        
        const apiKey = '6ca44591ce89b2fcdf1d698171d5b41a'; // OpenWeatherMap API key
        
        cities.forEach(city => {
            // Create styled marker for each city
            const marker = L.marker([city.lat, city.lng], {
                icon: L.divIcon({
                    className: 'weather-marker',
                    html: `<div style="background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${city.name}</div>`,
                    iconSize: [60, 20],
                    iconAnchor: [30, 10]
                })
            }).addTo(activeGroup);
            
            // Construct API URLs for current weather and forecast
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lng}&appid=${apiKey}&units=metric`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${city.lat}&lon=${city.lng}&appid=${apiKey}&units=metric`;
            
            // Fetch weather data from both endpoints
            Promise.all([
                fetch(currentWeatherUrl).then(r => r.json()),
                fetch(forecastUrl).then(r => r.json())
            ])
            .then(([currentData, forecastData]) => {
                // Process current weather data
                const current = {
                    temp: Math.round(currentData.main.temp),
                    description: currentData.weather[0].description,
                    humidity: currentData.main.humidity,
                    windSpeed: Math.round(currentData.wind.speed * 3.6) // Convert m/s to km/h
                };
                
                // Process forecast data (extract next 3 days around noon)
                const forecast = [];
                const today = new Date().getDate();
                let dayCount = 0;
                
                for (let i = 0; i < forecastData.list.length && dayCount < 3; i++) {
                    const item = forecastData.list[i];
                    const itemDate = new Date(item.dt * 1000);
                    const hour = itemDate.getHours();
                    
                    // Get forecast around noon for different days
                    if (hour >= 11 && hour <= 13 && itemDate.getDate() !== today) {
                        const dayNames = ['Tomorrow', 'Day 2', 'Day 3'];
                        forecast.push({
                            day: dayNames[dayCount],
                            temp: Math.round(item.main.temp),
                            description: item.weather[0].description
                        });
                        dayCount++;
                    }
                }
                
                // Create popup content with weather information
                const popupContent = `
                    <div style="min-width: 200px;">
                        <h3>${city.name}</h3>
                        <div style="margin: 10px 0;">
                            <strong>Current Weather:</strong><br>
                            🌡️ ${current.temp}°C<br>
                            ☁️ ${current.description}<br>
                            💧 Humidity: ${current.humidity}%<br>
                            💨 Wind: ${current.windSpeed} km/h
                        </div>
                        <div>
                            <strong>3-Day Forecast:</strong><br>
                            ${forecast.map(day => 
                                `${day.day}: ${day.temp}°C, ${day.description}`
                            ).join('<br>')}
                        </div>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                
                // Add click handler for detailed sidebar display
                marker.on('click', () => {
                    const sidebarContent = `
                        <div>
                            <h3>${city.name} Weather</h3>
                            <div style="margin: 15px 0;">
                                <h4>Current Conditions</h4>
                                <dl>
                                    <dt>Temperature</dt><dd>${current.temp}°C</dd>
                                    <dt>Conditions</dt><dd>${current.description}</dd>
                                    <dt>Humidity</dt><dd>${current.humidity}%</dd>
                                    <dt>Wind Speed</dt><dd>${current.windSpeed} km/h</dd>
                                </dl>
                            </div>
                            <div>
                                <h4>Forecast</h4>
                                ${forecast.map(day => `
                                    <div style="margin: 5px 0; padding: 5px; background: #f0f0f0; border-radius: 3px;">
                                        <strong>${day.day}:</strong> ${day.temp}°C, ${day.description}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                    showInfo('task6', sidebarContent);
                });
            })
            .catch(error => {
                console.error(`Error fetching weather for ${city.name}:`, error);
                
                // Fallback popup on API error
                marker.bindPopup(`
                    <div>
                        <h3>${city.name}</h3>
                        <p>Weather data unavailable</p>
                        <p><small>Check API key or network connection</small></p>
                    </div>
                `);
                
                marker.on('click', () => {
                    showInfo('task6', `
                        <div>
                            <h3>${city.name}</h3>
                            <p>Unable to load weather data.</p>
                            <p>Please check your internet connection or API key.</p>
                        </div>
                    `);
                });
            });
        });
        
        // Fit map to show all cities
        const group = new L.featureGroup(activeGroup.getLayers());
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    /* ----------  Task 7: K-means clustering of school locations  ---------- */
    function initTask7() {
        initTask7.desc = 'Load school_locations.csv, run k-means and plot clusters.';
        activeGroup = taskLayers.task7;
        map.addLayer(activeGroup);

        // Load CSV data using fetch
        fetch('/static/data/school_locations.csv')
            .then(response => response.text())
            .then(csvText => {
                // Parse CSV using Papa Parse library
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: header => header.trim(), // Clean column headers
                    transform: (value, header) => value.trim(), // Clean cell values
                    complete: (result) => {
                        const schools = [];
                        const errors = [];

                        // Process each row of CSV data
                        result.data.forEach((row, index) => {
                            const lat = parseFloat(row.ycoord); // CSV uses ycoord for latitude
                            const lng = parseFloat(row.xcoord); // CSV uses xcoord for longitude
                            const name = row.Name || `School ${index + 1}`;

                            // Validate coordinate values
                            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                                schools.push({
                                    name: name,
                                    lat: lat,
                                    lng: lng,
                                    coordinates: [lng, lat] // GeoJSON format: [lng, lat]
                                });
                            } else {
                                errors.push(`Invalid data at row ${index + 2}: lat=${row.ycoord}, lng=${row.xcoord}`);
                            }
                        });

                        // Check if any valid schools were found
                        if (schools.length === 0) {
                            throw new Error('No valid school data found in CSV. Check file format and content.');
                        }

                        // Create GeoJSON feature collection for clustering
                        const schoolsGeoJSON = {
                            type: 'FeatureCollection',
                            features: schools.map(school => ({
                                type: 'Feature',
                                properties: { name: school.name },
                                geometry: {
                                    type: 'Point',
                                    coordinates: school.coordinates
                                }
                            }))
                        };

                        // Perform k-means clustering using Turf.js
                        const clustered = turf.clustersKmeans(schoolsGeoJSON, { numberOfClusters: 5 });

                        // Color scheme for clusters
                        const clusterColors = ['#FF5722', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0'];

                        // Add clustered points to map
                        L.geoJSON(clustered, {
                            pointToLayer: (feature, latlng) => {
                                const cluster = feature.properties.cluster || 0; // Fallback to 0 if undefined
                                return L.circleMarker(latlng, {
                                    radius: 6,
                                    fillColor: clusterColors[cluster] || '#333',
                                    color: '#000',
                                    weight: 1,
                                    opacity: 1,
                                    fillOpacity: 0.8
                                });
                            },
                            onEachFeature: (feature, layer) => {
                                const cluster = feature.properties.cluster || 0;
                                const name = feature.properties.name || 'Unknown School';

                                layer.bindPopup(`
                                    <div>
                                        <h4>${name}</h4>
                                        <p><strong>Cluster:</strong> ${cluster + 1}</p>
                                        <p><strong>Color:</strong> <span style="color: ${clusterColors[cluster]}">●</span></p>
                                    </div>
                                `);

                                layer.on('click', () => {
                                    showInfo('task7', `
                                        <dl>
                                            <dt>School Name</dt><dd>${name}</dd>
                                            <dt>Cluster ID</dt><dd>${cluster + 1}</dd>
                                            <dt>Cluster Color</dt><dd><span style="color: ${clusterColors[cluster]}; font-size: 20px;">●</span> ${clusterColors[cluster]}</dd>
                                            <dt>Coordinates</dt><dd>${feature.geometry.coordinates[1].toFixed(5)}, ${feature.geometry.coordinates[0].toFixed(5)}</dd>
                                        </dl>
                                    `);
                                });
                            }
                        }).addTo(activeGroup);

                        // Add legend
                        const legend = L.control({ position: 'bottomright' });
                        legend.onAdd = function(map) {
                            const div = L.DomUtil.create('div', 'legend');
                            div.innerHTML = '<h4>School Clusters</h4>';
                            for (let i = 0; i < 5; i++) {
                                div.innerHTML += `
                                    <div><span style="color: ${clusterColors[i]}; font-size: 18px;">●</span> Cluster ${i + 1}</div>
                                `;
                            }
                            div.style.background = 'white';
                            div.style.padding = '10px';
                            div.style.border = '2px solid #ccc';
                            div.style.borderRadius = '5px';
                            return div;
                        };

                        toolCtrl = legend.addTo(map);

                        // Fit map to show all schools
                        if (activeGroup.getLayers().length > 0) {
                            map.fitBounds(activeGroup.getBounds(), { padding: [25, 25] });
                        }

                        // Log any parsing errors for debugging
                        if (errors.length > 0) {
                            console.warn('CSV parsing issues:', errors);
                        }
                    },
                    error: (error) => {
                        throw new Error(`CSV parsing failed: ${error}`);
                    }
                });
            })
            .catch(error => {
                console.error('Error loading school data:', error);
                showInfo('task7', `<p>Error loading school data: ${error.message}. Check file location and format.</p>`);
            });
    }

    const initFunctions = {
        task1: initTask1,
        task2: initTask2,
        task3: initTask3,
        task4: initTask4,
        task5: initTask5,
        task6: initTask6,
        task7: initTask7
    };

     /* ----------  Core selector: fires on every tab open  ---------- */
    function selectTask(id) {
        if (activeTask === id) { sidebar.close(); return; }

        activeTask = id;
        clearTools();
        clearLayers();

        const init = initFunctions[id];
        if (init) {
            init();                                          // run the task

            // write description into the task-body once the pane exists
            const body = document.querySelector(`#${id} .task-body`);
            if (body) body.textContent = init.desc || '';

            if (activeGroup && activeGroup.getLayers().length)
            map.fitBounds(activeGroup.getBounds(), { padding:[25,25] });
        }
    }
    /* ----------  Event wiring  ---------- */
    sidebar.on('content', e => selectTask(e.id));

    /* ----------  Start on intro pane  ---------- */
    sidebar.open('intro');
});
