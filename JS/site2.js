require([
  'Canvas-Flowmap-Layer/CanvasFlowmapLayer',
  'esri/Graphic',
  'esri/WebMap',
  'esri/views/MapView',
  'esri/widgets/TimeSlider',
  'esri/widgets/LayerList',
  'esri/widgets/Expand',
  'esri/widgets/Legend',
  'esri/layers/FeatureLayer',
  'esri/widgets/Popup',
  'dojo/domReady!'
], function(
  CanvasFlowmapLayer,
  Graphic,
  WebMap,
  MapView,
  TimeSlider,
  LayerList,
  Expand,
  Legend,
  FeatureLayer,
  Popup
) {
    
// popup configuration
var popupTemplate = {
    title: "Country: {Country_name}",
      actions: [
      {
        title: "Remove from Predictions",
        id: "removeFromPrediction"
      }
      ],
    content: [
    {
      type: "fields",
      fieldInfos: [                  
	  {
	    fieldName: "Active",
	    label: "Active Cases"
	  },
	  {
	    fieldName: "Death",
	    label: "Total Deaths"
	  },
	  {
	    fieldName: "Recover",
	    label: "Total Recovered"
	  }
	]
    }
    ]
};
		
  //const layer = webmap.findLayerById('40b129da4bd84efa9993b768b8c6ead6');		
  var layer = new FeatureLayer("https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/Dummy_COVID19_Spread_Temporal_Data/FeatureServer/0",
    {
      outFields: [ "*" ],
      useViewTime: true,
      popupEnabled: true,
      popupTemplate: popupTemplate
    }
  );
  
 var view = new MapView({
    container: 'viewDiv',
    map: new WebMap({
      // use a standard Web Mercator map projection basemap
      //basemap: 'dark-gray-vector'
      portalItem: {
	id: "9abddb687df74894878b7cc1ef90a902"
      },
      layers: [layer]
    }),
    ui: {
      components: ['zoom', 'attribution']
    }
  });

  // time slider widget initialization
const timeSlider = new TimeSlider({
  container: "timeSlider",
  //mode: "time-window",
  mode: "instant",
  view: view
});

console.log(timeSlider);
view.ui.add(timeSlider, "manual");

// add the UI for titles, stats and chart.
view.ui.add("titleDiv", "top-right");

// accessing layer with temporal data from the webmap
let timeLayerView;		
view.whenLayerView(layer).then(function(lv) {
  timeLayerView = lv;
  const fullTimeExtent = layer.timeInfo.fullTimeExtent;
  // set up time slider properties
  timeSlider.fullTimeExtent = fullTimeExtent;
  timeSlider.stops = {
	interval: {
		value: 1,
		unit: "days"
	}
  };
});

timeSlider.watch("timeExtent", function(value){
  timeLayerView.filter = {
    timeExtent: value
  };
});

var layerList = new LayerList({
    view: view
  });		

  const layersExpand = new Expand({
    expandIconClass: "esri-icon-collection",
    expandTooltip: "Layers",
    view: view,
    content: layerList,
    expanded: false
  });

  // Adding selected feature to restricted country list when removeFromPrediction is clicked 
view.when(function() {
	var popup = view.popup;
	popup.viewModel.on("trigger-action", function(event) {
		if (event.action.id === "removeFromPrediction") {
						
			var attributes = popup.viewModel.selectedFeature.attributes;
			//console.log(attributes);
			//alert("Action called: removeFromPrediction() | object id: " + attributes.ObjectId);
			
			// if not already exist, add the id to selected_ids list
			if(!selected_ids.includes(attributes.ObjectId))
			{
				selected_ids.push(attributes.ObjectId);
				
				// make an entry for the selected feature in restricted countries panel
				var table = document.getElementById("table_restricted_countries");
				var row = table.insertRow(-1);
				
				var cell_id = row.insertCell(-1);
				cell_id.innerHTML = attributes.ObjectId;
				cell_id.style.visibility = 'hidden';
				
				var cell_name = row.insertCell(-1);
				cell_name.innerHTML = attributes.Country_name;
				cell_name.style.fontWeight = "bold";
				
				var cell_action = row.insertCell(-1);
				cell_action.innerHTML = "<button type=\"button\" class=\"btn btn-primary\" onclick=\"clearCountrySelection(this)\"> Clear </button>";
			}
		}
	});
});
	
view.ui.add(layersExpand, "top-left");
view.ui.add("titleDiv", "top-right");
var button_reconstruct = document.getElementById("construct_button");
view.ui.add(button_reconstruct, "top-right");
	
// Listen to the click event on the map view.
view.on("click", function(event) {
   var screenPoint = {
	x: event.x,
	y: event.y
   };
   view.hitTest(screenPoint).then(function(response) {
	if (!response.results.length) {
		return;
	}
	// check if the graphic(s) belongs to the layer of interest
	// and mark them as selected for Bezier path display
	response.results.forEach(function(result) {
		if (result.graphic.layer === layer) {
			//alert("FeatureLayer object selected...");
						
			layer.when(function() {
				var query = layer.createQuery();
				console.log(result.graphic.attributes.Country_name);
				query.where = "Country_name <> '" + result.graphic.attributes.Country_name + "'";
				console.log(query);
				return layer.queryFeatures(query);
			}).then(getValues);
		}
   	});
    });
});
	
function getValues(response)
{
	console.log("Results found: " + results.features.length);
    	console.log(results.features);
}
 
view.when(function() {
    // here we use Papa Parse to load and read the CSV data
    // we could have also used another library like D3js to do the same
    Papa.parse('Data/flight_routes_processed_v2_flowmap_reduced.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: handleCsvParsingComplete
    });
  });
  function handleCsvParsingComplete(results) {
    var graphicsFromCsvRows = results.data.map(function(datum) {
      return new Graphic({
        geometry: {
          type: 'point',
          longitude: datum.From_Longitude,
          latitude: datum.From_Latitude
        },
        attributes: datum
      });
    });
    var canvasFlowmapLayer = new CanvasFlowmapLayer({
      // array of Graphics
      graphics: graphicsFromCsvRows,
      // information about the uniqe origin-destinatino fields and geometries
      originAndDestinationFieldIds: {
        originUniqueIdField: 'From_Airport_Code',
        originGeometry: {
          x: 'From_Longitude',
          y: 'From_Latitude',
          spatialReference: {
            wkid: 4326
          }
        },
        destinationUniqueIdField: 'To_Airport_Code',
        destinationGeometry: {
          x: 'To_Longitude',
          y: 'To_Latitude',
          spatialReference: {
            wkid: 4326
          }
        }
      }
    });
    canvasFlowmapLayer.title = "Flowmap Connections";
    view.map.layers.add(canvasFlowmapLayer);
        
    // get access to the CanvasFlowmapLayer's layerView to make modifications
    // of which O-D relationships are flagged for path display
    view.whenLayerView(canvasFlowmapLayer).then(function(canvasFlowmapLayerView) {
      // automatically select a few ORIGIN locations for path display
      // in order to demonstrate the flowmap functionality,
      // without being overwhelming and showing all O-D relationships
      // Herat Airport
      //canvasFlowmapLayerView.selectGraphicsForPathDisplayById('From_Airport_Code', 5539, true, 'SELECTION_NEW');
      // Tirana International Airport Mother Teresa
      //canvasFlowmapLayerView.selectGraphicsForPathDisplayById('From_Airport_Code', 13755, true, 'SELECTION_ADD');
      // establish a hitTest to try to select new O/D relationships
      // for path display from user interaction;
      // try either 'pointer-move' or 'click' to see the effects
      view.on('pointer-move', function(event) {
      // view.on('click', function(event) {
        var screenPoint = {
          x: event.x,
          y: event.y
        };
        view.hitTest(screenPoint).then(function(response) {
          if (!response.results.length) {
            return;
          }
          // check if the graphic(s) belongs to the layer of interest
          // and mark them as selected for Bezier path display
          response.results.forEach(function(result) {
            if (result.graphic.layer === canvasFlowmapLayer) {
              if (result.graphic.isOrigin) {
                canvasFlowmapLayerView.selectGraphicsForPathDisplayById(
                  'From_Airport_Code',
                  result.graphic.attributes.From_Airport_Code,
                  result.graphic.attributes.isOrigin,
                  'SELECTION_NEW'
                );
              } else {
                canvasFlowmapLayerView.selectGraphicsForPathDisplayById(
                  'To_Airport_Code',
                  result.graphic.attributes.To_Airport_Code,
                  result.graphic.attributes.isOrigin,
                  'SELECTION_NEW'
                );
              }
		    
	      var edges = canvasFlowmapLayer.graphics.find(function(graphic) {
		return graphic.attributes.From_Airport_Code === result.graphic.attributes.From_Airport_Code;
	      });
		    
	      console.log(edges);
            }
          });
        });
      });
    });
  }
});
