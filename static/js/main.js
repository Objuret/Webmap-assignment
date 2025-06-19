document.addEventListener('DOMContentLoaded', () => {
    /* ----------  Map & base layers  ---------- */
    const map = L.map('map').setView([60.6058, 15.6272], 10);
    const osm  = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    { attribution: '© OpenStreetMap' }).addTo(map);
    const esri = L.tileLayer(
                    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    { attribution: '© Esri' });
    L.control.layers(
        { OpenStreetMap: osm, 'Esri World Imagery': esri },
        {}                                          // task layers added later
    ).addTo(map);

    /* ----------  Sidebar & task panels  ---------- */
    const sidebar = L.control.sidebar({ container: 'sidebar', position: 'right' })
                    .addTo(map);

    sidebar.addPanel({
        id   : 'intro',
        tab  : '<i class="fa-solid fa-bars"></i>',
        title: 'Webmap Tasks',
        pane : '<p>Select a task tab to begin.</p>'
    });
    // sidebar.addPanel({
    //     id   : 'taskInfo',                            // a fixed id
    //     tab  : '<i class="fa fa-info-circle"></i>',
    //     title: 'Task Description',
    //     pane : '<div id="task-info" class="p-2"></div>'   // we’ll overwrite this
    // });
    // sidebar.addPanel({
    //     id   : 'poi',                            // a fixed id
    //     tab  : '<i class="fa fa-info-circle"></i>',
    //     title: 'Details',
    //     pane : '<div id="poi-body" class="p-2"></div>'   // we’ll overwrite this
    // });


     /* ----------  Task definitions & sidebar tabs  ---------- */
    const taskDefs = Array.from({ length: 7 }, (_, i) => ({
        id   : `task${i + 1}`,
        label: `Task ${i + 1}`
    }));


    taskDefs.forEach(t =>
        sidebar.addPanel({
            id   : t.id,
            tab  : t.label.split(' ')[1],      // “1”, “2”, …
            title: t.label,
            pane : `
            <div class="task-body"></div>    <!-- description goes here -->
            <div class="task-info">Select a feature …</div>`
        })
    );

    /* ----------  Feature-groups per task & add to layer control  ---------- */
    const taskLayers = Object.fromEntries(
        taskDefs.map(t => [t.id, L.featureGroup()])
    );
    

    /* ----------  Shared housekeeping helpers  ---------- */
    let activeTask  = null;
    let activeGroup = null;
    let toolCtrl    = null;                   // holds current toolbar/control

    const clearTools = () => {
        if (toolCtrl) { map.removeControl(toolCtrl); toolCtrl = null; }
        map.off(L.Draw.Event.CREATED);          // detach any draw handler
    };
        
    const layerCtrl = L.control.layers(null, taskLayers).addTo(map); // task layer control

    const clearLayers = () => {
        Object.values(taskLayers).forEach(g => map.removeLayer(g));
        activeGroup = null;
    };

    function attachOnce(eventName, handler) {
        map.off(eventName, handler);
        map.on (eventName, handler);
    }

    function showInfo(taskId, html) {
        document.querySelector(`#${taskId} .task-info`).innerHTML = html;
        sidebar.open(taskId);                       // jump to the right tab
    }

    /* ----------  Task-specific init functions  ---------- */
    function initTask1() {
        initTask1.desc = 'Create point, line and polygon features; each shows an image pop-up.';
        activeGroup = taskLayers.task1;
        map.addLayer(activeGroup);

        toolCtrl = new L.Control.Draw({
        draw : { marker: true, polyline: true, polygon: true },
        edit : { featureGroup: activeGroup }
        }).addTo(map);

        attachOnce(L.Draw.Event.CREATED, e => activeGroup.addLayer(e.layer));
    }


    function initTask2() {
        initTask2.desc = 'Show five POIs in Falun, list their info in the sidebar and measure distance.';
        // Define 5 locations of interest in Falun
        const falunLocations = [
            { name: "Falun Mine", lat: 60.5989, lng: 15.6122,img  : '/static/img/gruvan.jpg', description: "UNESCO World Heritage Site and former copper mine." }, 
            { name: "Lugnet Sports Complex", lat: 60.6179, lng: 15.6554,img  : '/static/img/lugnet.jpg', description: "Large sports complex." },
            { name: "Falun City Hall", lat: 60.6078, lng: 15.6297,img  : '/static/img/stadshuset.jpg', description: "Historic town hall on Stora Torget." }, 
            { name: "Stora Kopparbergs Church", lat: 60.6077, lng: 15.6306,img  : '/static/img/kyrkan.jpg', description: "The main church in Falun." }, 
            { name: "Dalarna Museum", lat: 60.6058, lng: 15.6272,img  : '/static/img/dalarnasmuseum.jpg', description: "Museum of Dalarna's history and culture." } 
        ];

        // show Task 2 layer
        activeGroup = taskLayers.task2;
        map.addLayer(activeGroup);

        // ruler button (defaults: top-right, metres → km, measurements stay visible)
        toolCtrl = L.control.polylineMeasure({
            position: 'topright',
            unit: 'km',
            clearMeasurementsOnStop: false,   // ⟵ keeps the polylines
            showClearControl: true,           // small ✖ button
            showUnitControl: true,            // km / mi toggle
            tooltipText: 'Click to start measuring',
            position: 'topleft'
        }).addTo(map);

        falunLocations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng])
                            .bindPopup(`<b>${loc.name}</b><br>${loc.description}`) // Bind popup with location info
                            .addTo(activeGroup);
        });
    }

  function initTask3() {  initTask3.desc =
    'Load supermarket.geoJSON, build 1 km buffers, highlight non-overlapping ones.';
  /* TODO: fetch GeoJSON → L.geoJSON → turf.buffer → style */}
  function initTask4() {  initTask4.desc =
    'Overlay a georeferenced image on the basemap anywhere in Sweden.';
  /* TODO: L.imageOverlay with bounds */}
  function initTask5() {  initTask5.desc =
    'Cluster fuel.geoJSON points with Leaflet.markercluster; pop-ups show station names.';
  /* TODO: fetch fuel.geoJSON → L.markerClusterGroup */}
  function initTask6() {  initTask6.desc =
    'Display current and forecast weather for five cities in pop-ups and sidebar.';
  /* TODO: fetch weather API → markers + sidebar update */}
  function initTask7() {  initTask7.desc =
    'Load school_locations.csv, run k-means and plot clusters.';
  /* TODO: parse CSV → k-means (e.g. turf.clustersKmeans) → L.geoJSON */}

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
//   function selectTask(id) {
//     if (activeTask === id) {                // same tab toggles sidebar
//       sidebar.close();
//       return;
//     }

//     activeTask = id;
//     clearTools();
//     clearLayers();

//     if (initFunctions[id]) {                      // real task
//       initFunctions[id]();

//         if (activeGroup && activeGroup.getLayers().length) {
//         map.fitBounds(activeGroup.getBounds(), { padding: [25, 25] });
//         }
//     }
//   }
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

