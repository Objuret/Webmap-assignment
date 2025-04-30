let weatherLayer = L.layerGroup().addTo(map);
function refreshWeather() {
  weatherLayer.clearLayers();
  cities.forEach(c=>{
    fetch(`/weather?lat=${c.lat}&lon=${c.lng}&city=${c.name}`)
     .then(r=>r.json()).then(d=>{
        const m=L.marker([c.lat,c.lng]).addTo(weatherLayer);
        m.bindPopup(`<b>${c.name}</b><br>${d.current.temp}°C`);
     });
  });
}

function toggleClusters(){
  if(map.hasLayer(schoolLayer)){map.removeLayer(schoolLayer);return;}
  fetch('/clusters').then(r=>r.json()).then(fc=>{
    schoolLayer=L.geoJSON(fc,{pointToLayer:(f,ll)=>L.circleMarker(ll,{
      radius:6, color:['red','blue','green'][f.properties.label]
    })}).addTo(map);
  });
}