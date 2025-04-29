// // In main.js
// let map;
// let drawnItems = new L.FeatureGroup();
// let currentTask = null;

// function initMap() {
//     map = L.map('map').setView([59.85, 17.65], 13); // Uppsala, Sweden
    
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         attribution: '&copy; OpenStreetMap contributors'
//     }).addTo(map);
    
//     map.addLayer(drawnItems);
// }

// function showTask1() {
//     resetMap();
//     currentTask = 1;
    
//     // Add draw control
//     const drawControl = new L.Control.Draw({
//         draw: {
//             polygon: true,
//             polyline: true,
//             rectangle: false,
//             circle: false,
//             circlemarker: false,
//             marker: true
//         },
//         edit: {
//             featureGroup: drawnItems
//         }
//     });
//     map.addControl(drawControl);
    
//     // Listen for drawing completion
//     map.on('draw:created', function(e) {
//         const layer = e.layer;
        
//         // Determine feature type for popup content
//         let featureType = '';
//         if (layer instanceof L.Marker) {
//             featureType = 'Point';
//         } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
//             featureType = 'Line';
//         } else if (layer instanceof L.Polygon) {
//             featureType = 'Polygon';
//         }
        
//         // Add popup with image and info
//         layer.bindPopup(`
//             <div>
//                 <h3>${featureType} Feature</h3>
//                 <img src="${getImageForFeature(featureType)}" width="200">
//                 <p>This is a ${featureType.toLowerCase()} feature that was drawn on the map.</p>
//                 <p>Created: ${new Date().toLocaleString()}</p>
//             </div>
//         `);
        
//         drawnItems.addLayer(layer);
//     });
    
//     // Update sidebar
//     document.getElementById('info').innerHTML = `
//         <div class="info-container">
//             <h3>Task 1: Draw Features</h3>
//             <p>Use the drawing tools to create points, lines, and polygons on the map.</p>
//             <p>Click on a feature to see its popup with information and an image.</p>
//         </div>
//     `;
// }

// function getImageForFeature(featureType) {
//     // Return appropriate image URL based on feature type
//     switch(featureType) {
//         case 'Point':
//             return "{{ url_for('static', filename='images/point.png') }}";
//         case 'Line':
//             return "{{ url_for('static', filename='images/line.png') }}";
//         case 'Polygon':
//             return "{{ url_for('static', filename='images/polygon.png') }}";
//         default:
//             return "{{ url_for('static', filename='images/default.png') }}";
//     }
// }

// // Add this to main.js
// function showTask2() {
//   resetMap();
//   currentTask = 2;
  
//   // Set view to Stockholm
//   map.setView([59.33, 18.06], 12);
  
//   // Add polyline measure control
//   const polylineMeasure = L.control.polylineMeasure({
//       position: 'topleft',
//       unit: 'metres',
//       showBearings: true,
//       clearMeasurementsOnStop: false,
//       showMeasurementsClearControl: true
//   }).addTo(map);
  
//   // Define POIs
//   const pois = [
//       {
//           name: "Vasa Museum",
//           location: [59.3280, 18.0914],
//           description: "Maritime museum with a preserved 17th-century ship",
//           image: "vasa.jpg"
//       },
//       {
//           name: "Stockholm City Hall",
//           location: [59.3274, 18.0543],
//           description: "Famous building and venue of the Nobel Prize banquet",
//           image: "city-hall.jpg"
//       },
//       {
//           name: "Skansen",
//           location: [59.3270, 18.1057],
//           description: "Open-air museum and zoo showcasing Swedish history",
//           image: "skansen.jpg"
//       },
//       {
//           name: "Royal Palace",
//           location: [59.3268, 18.0714],
//           description: "Official residence of the Swedish monarch",
//           image: "royal-palace.jpg"
//       },
//       {
//           name: "Fotografiska",
//           location: [59.3179, 18.0860],
//           description: "Contemporary photography museum",
//           image: "fotografiska.jpg"
//       }
//   ];
  
//   // Add markers to map
//   const poiMarkers = [];
//   pois.forEach((poi, index) => {
//       const marker = L.marker(poi.location)
//           .bindPopup(`<b>${poi.name}</b><br>${poi.description}`)
//           .addTo(map);
      
//       marker.on('click', function() {
//           updateSidebarWithPOI(poi);
//       });
      
//       poiMarkers.push(marker);
//   });
  
//   // Update sidebar with POI list
//   let poiListHTML = '<div class="info-container"><h3>Stockholm Points of Interest</h3>';
//   poiListHTML += '<p>Click on a location to see details. Use the Polyline Measure tool to measure distances.</p>';
//   poiListHTML += '<ul>';
  
//   pois.forEach((poi, index) => {
//       poiListHTML += `<li>
//           <a href="#" onclick="focusMarker(${index})">${poi.name}</a>
//       </li>`;
//   });
  
//   poiListHTML += '</ul></div>';
//   document.getElementById('info').innerHTML = poiListHTML;
  
//   // Store markers globally for the focus function
//   window.task2Markers = poiMarkers;
// }

// function focusMarker(index) {
//   const markers = window.task2Markers;
//   if (markers && markers[index]) {
//       map.setView(markers[index].getLatLng(), 14);
//       markers[index].openPopup();
      
//       // Also update sidebar with POI details
//       const pois = [
//           /* same POI data as above */
//       ];
//       updateSidebarWithPOI(pois[index]);
//   }
// }

// function updateSidebarWithPOI(poi) {
//   const poiInfo = `
//       <div class="info-container">
//           <h3>${poi.name}</h3>
//           <img src="{{ url_for('static', filename='images/') }}${poi.image}" width="100%">
//           <p>${poi.description}</p>
//           <p>Location: ${poi.location[0].toFixed(4)}, ${poi.location[1].toFixed(4)}</p>
//       </div>
//   `;
  
//   // Append this to the existing list
//   const infoElement = document.getElementById('info');
  
//   // Keep the list at the top, replace any existing details
//   const listContainer = infoElement.querySelector('.info-container');
//   infoElement.innerHTML = '';
//   infoElement.appendChild(listContainer);
//   infoElement.innerHTML += poiInfo;
// }

// function showTask3() {
//   resetMap();
//   currentTask = 3;
  
//   // Set view to a central location in Sweden
//   map.setView([59.85, 17.65], 10);
  
//   // Add info to sidebar
//   document.getElementById('info').innerHTML = `
//       <div class="info-container">
//           <h3>Task 3: Supermarkets with Buffers</h3>
//           <p>Displaying supermarkets with 1km buffers.</p>
//           <p>Non-overlapping buffers are highlighted in green.</p>
//       </div>
//   `;
  
//   // Load supermarket data
//   fetch('/api/supermarkets')
//       .then(response => response.json())
//       .then(data => {
//           // Add markers for each supermarket
//           L.geoJSON(data, {
//               pointToLayer: function(feature, latlng) {
//                   return L.marker(latlng);
//               },
//               onEachFeature: function(feature, layer) {
//                   const name = feature.properties.name || 'Unnamed Supermarket';
//                   layer.bindPopup(`<b>${name}</b>`);
//               }
//           }).addTo(map);
          
//           // Load buffer analysis
//           return fetch('/api/supermarkets/buffer');
//       })
//       .then(response => response.json())
//       .then(bufferData => {
//           // Display buffers
//           bufferData.forEach(buffer => {
//               // Create a 1km circle
//               const circle = L.circle(
//                   [buffer.coordinates[1], buffer.coordinates[0]], 
//                   {
//                       radius: 1000,  // 1km in meters
//                       fillColor: buffer.overlaps ? '#ff7800' : '#00ff00',
//                       fillOpacity: 0.3,
//                       color: buffer.overlaps ? '#ff7800' : '#00ff00',
//                       weight: 1
//                   }
//               ).addTo(map);
              
//               // Add popup
//               circle.bindPopup(`<b>${buffer.name}</b><br>1km buffer zone`);
//           });
//       })
//       .catch(error => {
//           console.error('Error loading supermarket data:', error);
//           document.getElementById('info').innerHTML += `
//               <div class="info-container error">
//                   <p>Error loading supermarket data. Please try again.</p>
//               </div>
//           `;
//       });
// }

// function showTask4() {
//   resetMap();
//   currentTask = 4;
  
//   // Center on Stockholm
//   map.setView([59.33, 18.06], 13);
  
//   // Define image bounds (adjust based on your specific image and location)
//   const imageBounds = [
//       [59.335, 18.04],  // Southwest corner
//       [59.325, 18.08]   // Northeast corner
//   ];
  
//   // Add image overlay
//   const imageUrl = "{{ url_for('static', filename='images/stockholm_overlay.png') }}";
//   const overlay = L.imageOverlay(imageUrl, imageBounds).addTo(map);
  
//   // Add info to sidebar
//   document.getElementById('info').innerHTML = `
//       <div class="info-container">
//           <h3>Task 4: Image Overlay</h3>
//           <p>An image has been overlaid on the map of Stockholm, Sweden.</p>
//           <p>The overlay shows a historical map of the area.</p>
//           <img src="${imageUrl}" width="100%">
//       </div>
//   `;
// }

// function showTask5() {
//   resetMap();
//   currentTask = 5;
  
//   // Set view to a central location in Sweden
//   map.setView([59.33, 18.06], 10);
  
//   // Add info to sidebar
//   document.getElementById('info').innerHTML = `
//       <div class="info-container">
//           <h3>Task 5: Fuel Stations with Clustering</h3>
//           <p>Fuel stations are displayed with marker clustering.</p>
//           <p>Zoom in to see individual stations or click on clusters to expand.</p>
//           <p>Click on individual markers to see station names.</p>
//       </div>
//   `;
  
//   // Create a marker cluster group
//   const markers = L.markerClusterGroup();
  
//   // Load fuel station data
//   fetch('/static/data/fuel.geojson')
//       .then(response => response.json())
//       .then(data => {
//           // Process each fuel station
//           data.features.forEach(feature => {
//               if (feature.geometry && feature.geometry.type === "Point") {
//                   const coords = feature.geometry.coordinates;
//                   const name = feature.properties.name || 'Unnamed Fuel Station';
                  
//                   // Create marker and add to cluster group
//                   const marker = L.marker([coords[1], coords[0]])
//                       .bindPopup(`<b>${name}</b>`);
                  
//                   markers.addLayer(marker);
//               }
//           });
          
//           // Add the marker cluster group to the map
//           map.addLayer(markers);
//       })
//       .catch(error => {
//           console.error('Error loading fuel station data:', error);
//           document.getElementById('info').innerHTML += `
//               <div class="info-container error">
//                   <p>Error loading fuel station data. Please try again.</p>
//               </div>
//           `;
//       });
// }

// function showTask6() {
//   resetMap();
//   currentTask = 6;
  
//   // Set view to show all of Sweden
//   map.setView([62.0, 15.0], 5);
  
//   // Load weather data
//   fetch('/api/weather')
//       .then(response => response.json())
//       .then(cities => {
//           // Update sidebar with city list
//           let cityListHTML = `
//               <div class="info-container">
//                   <h3>Weather Information</h3>
//                   <p>Click on a city marker for current weather, or select from the list:</p>
//                   <ul>
//           `;
          
//           cities.forEach((city, index) => {
//               cityListHTML += `<li>
//                   <a href="#" onclick="showCityWeather(${index})">${city.name}</a>
//               </li>`;
              
//               // Add marker for each city
//               const marker = L.marker(city.coordinates)
//                   .bindPopup(getWeatherPopupContent(city))
//                   .addTo(map);
              
//               // Store the city data with the marker
//               marker.cityData = city;
//               marker.cityIndex = index;
              
//               // Add click event to update sidebar
//               marker.on('click', function() {
//                   showCityWeather(this.cityIndex);
//               });
//           });
          
//           cityListHTML += `</ul></div>`;
//           document.getElementById('info').innerHTML = cityListHTML;
          
//           // Store cities data globally for the weather display function
//           window.weatherCities = cities;
//       })
//       .catch(error => {
//           console.error('Error loading weather data:', error);
//           document.getElementById('info').innerHTML = `
//               <div class="info-container error">
//                   <p>Error loading weather data. Please try again.</p>
//               </div>
//           `;
//       });
// }

// function getWeatherPopupContent(city) {
//   return `
//       <div>
//           <h3>${city.name}</h3>
//           <p><b>Current:</b> ${city.current.temp}°C, ${city.current.condition}</p>
//           <p>Humidity: ${city.current.humidity}%</p>
//           <p>Wind: ${city.current.wind_speed} km/h</p>
//       </div>
//   `;
// }

// function showCityWeather(index) {
//   const cities = window.weatherCities;
//   if (cities && cities[index]) {
//       const city = cities[index];
      
//       // Create weather info for sidebar
//       let weatherHTML = `
//           <div class="info-container">
//               <h3>${city.name} Weather</h3>
//               <div class="current-weather">
//                   <h4>Current Conditions</h4>
//                   <p>Temperature: ${city.current.temp}°C</p>
//                   <p>Condition: ${city.current.condition}</p>
//                   <p>Humidity: ${city.current.humidity}%</p>
//                   <p>Wind Speed: ${city.current.wind_speed} km/h</p>
//               </div>
//               <div class="forecast">
//                   <h4>Forecast</h4>
//                   <table width="100%">
//                       <tr>
//                           <th>Day</th>
//                           <th>High</th>
//                           <th>Low</th>
//                           <th>Condition</th>
//                       </tr>
//       `;
      
//       city.forecast.forEach(day => {
//           weatherHTML += `
//               <tr>
//                   <td>${day.day}</td>
//                   <td>${day.high}°C</td>
//                   <td>${day.low}°C</td>
//                   <td>${day.condition}</td>
//               </tr>
//           `;
//       });
      
//       weatherHTML += `
//                   </table>
//               </div>
//           </div>
//       `;
      
//       // Add after the city list
//       const infoElement = document.getElementById('info');
//       const listContainer = infoElement.querySelector('.info-container');
      
//       // Keep the list at the top
//       infoElement.innerHTML = '';
//       infoElement.appendChild(listContainer);
//       infoElement.innerHTML += weatherHTML;
//   }
// }

// function showTask7() {
//   resetMap();
//   currentTask = 7;
  
//   // Set view to a central location in Sweden
//   map.setView([59.85, 17.65], 10);
  
//   // Add info to sidebar
//   document.getElementById('info').innerHTML = `
//       <div class="info-container">
//           <h3>Task 7: School Clustering</h3>
//           <p>K-means clustering has been applied to school locations.</p>
//           <p>Each color represents a different cluster.</p>
//           <p>Larger markers indicate cluster centers.</p>
//       </div>
//   `;
  
//   // Load clustered school data
//   fetch('/api/schools/clusters')
//       .then(response => response.json())
//       .then(data => {
//           // Define colors for clusters
//           const colors = ['red', 'blue', 'green', 'purple', 'orange', 'yellow', 'cyan', 'magenta'];
          
//           // Add school markers
//           data.schools.forEach(school => {
//               const cluster = school.cluster;
//               const color = colors[cluster % colors.length];
              
//               L.circleMarker([school.ycoord, school.xcoord], {
//                   radius: 5,
//                   fillColor: color,
//                   color: 'white',
//                   weight: 1,
//                   opacity: 1,
//                   fillOpacity: 0.8
//               })
//               .bindPopup(`<b>${school.Name}</b><br>${school.descriptio || ''}`)
//               .addTo(map);
//           });
          
//           // Add cluster centers
//           data.centers.forEach((center, i) => {
//               const color = colors[i % colors.length];
              
//               L.circleMarker([center[1], center[0]], {
//                   radius: 10,
//                   fillColor: color,
//                   color: 'black',
//                   weight: 2,
//                   opacity: 1,
//                   fillOpacity: 0.8
//               })
//               .bindPopup(`<b>Cluster ${i+1} Center</b>`)
//               .addTo(map);
//           });
          
//           // Update sidebar with cluster information
//           let clusterInfo = `
//               <div class="info-container">
//                   <h3>Cluster Information</h3>
//                   <ul>
//           `;
          
//           // Count schools per cluster
//           const clusterCounts = {};
//           data.schools.forEach(school => {
//               const cluster = school.cluster;
//               clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;
//           });
          
//           Object.keys(clusterCounts).forEach(cluster => {
//               const color = colors[cluster % colors.length];
//               clusterInfo += `
//                   <li>
//                       <span style="display:inline-block; width:15px; height:15px; background-color:${color}; margin-right:5px;"></span>
//                       Cluster ${parseInt(cluster)+1}: ${clusterCounts[cluster]} schools
//                   </li>
//               `;
//           });
          
//           clusterInfo += `</ul></div>`;
//           document.getElementById('info').innerHTML += clusterInfo;
//       })
//       .catch(error => {
//           console.error('Error loading school cluster data:', error);
//           document.getElementById('info').innerHTML += `
//               <div class="info-container error">
//                   <p>Error loading school cluster data. Please try again.</p>
//               </div>
//           `;
//       });
// }

// function resetMap() {
//   // Clear existing layers
//   map.eachLayer(layer => {
//       if (!(layer instanceof L.TileLayer)) {
//           map.removeLayer(layer);
//       }
//   });
  
//   // Reset feature group
//   drawnItems.clearLayers();
  
//   // Remove controls
//   map.removeControl(map.drawControl);
//   map.removeControl(map.polylineMeasure);
  
//   // Re-add feature group
//   map.addLayer(drawnItems);
// }

// // Initialize map on page load
// document.addEventListener('DOMContentLoaded', function() {
//   initMap();
// });