
// Create the 'basemap' tile layer that will be the background of our map.
let basemap = L.tileLayer(
    "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    {
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    });
  
  // grayscale layer
  
  let grayscale = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
  });

  // water color layer
  var waterColor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
    minZoom: 1,
    maxZoom: 16,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'jpg'
  });

  // topography
  let topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  }); 


 // make basemap object
 let basemaps = {
    Default: grayscale,
    GrayScale: grayscale,
    "Water Color": waterColor,
    "Topography": topoMap,
 };
    
  // Create the map object with center and zoom options.
  let map = L.map("map", {
    center: [
      36.7783, -119.4179
    ],
    zoom: 6,
    layers: [basemap, grayscale, waterColor,topoMap]

  });

  // Then add the 'basemap' tile layer to the map.
  basemap.addTo(map);
 d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(
    (data)=>{
        console.log(data);
    }
  );

  // get data for the techtonic plates and draw on the map
  // variable to hole the techonic plates layer

  let tectonicplates = new L.layerGroup();

  // call the api to get the info for the tectonic plates

  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/refs/heads/master/GeoJSON/PB2002_boundaries.json").then(
    (plateData)=>{
        console.log(plateData);
        L.geoJson(plateData, {
            color: "yellow",
            weight: 5
        }).addTo(tectonicplates);
    }
  );

  // add the tectonic plates to the map
  tectonicplates.addTo(map);

  // create the tectionic plates to the map
  let earthquakes = new L.layerGroup();

  // get the data for the earthquakes and add layergroups
  // make a call the USGS GeoJson API
  d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
    .then(
      function(earthquakeData){
        // console log to make sure the data is loaded
        // console.log(earthquakeData);
        // plot circles, where the radius is dependant on the magnitude
        // and the color is depends on the depth

        // function that chooses the color of the data point
        function dataColor(depth){
          if (depth > 90)
              return "red";
          else if(depth > 70)
              return "#fc4903";
          else if(depth > 50)
              return "#fc8403";
          else if(depth > 30)
              return "#fcad03";
          else if(depth > 10)
              return "#cafc03";
          else 
              return "green";

        }
        
        // make a function to determine the size of the redius
        function radiusSize(mag){
            if (mag == 0)
                return 1;  // make sure smaller magnitude earthquakes shows up
            else
                return mag * 5; // make sure the circle are seen within the map

        }

        // add on the stlye for each data point
        function dataStyle(feature)
        {
            return{
                opacity: 0.5,
                fillOpacity: 0.5,
                fillColor: dataColor(feature.geometry.coordinates[2]), // using index 2 for depth
                color: "000000", // black outline
                radius: radiusSize(feature.properties.mag), // pulls the magnitude
                weight: 0.5,
                stroke: true
            }
        }
        // add the GeoJson info
        L.geoJson(earthquakeData, {
            // make each feature a marker that's on the map, each will be a circle
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            // set the style for the markers
            style: dataStyle, // call the data style function and bring in the earthquake data
            // add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.properties.place}</b>`);
            }
        }).addTo(earthquakes);
      }  
  );

  // add the earthquake layer to the map
  earthquakes.addTo(map);

  // add the overlay for the tectonic plates for the earthquakes
  let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
  };

   // add the Layer control
   L.control
   .layers(basemaps, overlays)
   .addTo(map);

   // add a legend to the map
   let legend = L.control({
       position: "bottomright"
   });

   // add properties for the legend
   legend.onAdd = function() {
      // div for the legend to show on the page
      let div = L.DomUtil.create("div", "info legend");

      // show the the intervals
      let intervals = [-10, 10, 30, 50, 70, 90];
      // reflect colors for the intervals
      let colors = [
          "green",
          "#cafc03",
          "#fcad03",
          "#fc8403",
          "#fc4903",
          "red"

      ];

      // loop thru the intervals and colors and generate a label
      // with a colored square for each interval
      for(var i = 0; i < intervals.length; i++)
      {
          // inner html that sets the square for each interval and label
          div.innerHTML += "<i style='background: "
              + colors[i]
              + "'></i> "
              + intervals[i] // selects the text
              + (intervals [i + 1] ? "&ndash;"  + intervals[i + 1] + "<br>" : "+");
              // + (intervals [i + 1] ? "km &ndash km;" + intervals[i + 1] + "km<br>" : "+");

      }

      return div;
   };

   // add the legend to the map
   legend.addTo(map);