function removeEdge(entry)
{
	var i = entry.parentNode.parentNode.rowIndex;
	var entry_row = document.getElementById("edge_list_table").rows[i];
	var entry_uid = entry_row.cells[0].innerHTML;
	//alert("Selected UID: " + entry_uid);
		
	// if not already exist, add the id to selected_ids list
	if(!selected_edge_ids .includes(entry_uid))
	{
		selected_edge_ids.push(entry_uid);

		// make an entry for the selected edge in restricted edges panel
		var table = document.getElementById("table_restricted_connections");
		var row = table.insertRow(-1);

		var cell_id = row.insertCell(-1);
		cell_id.innerHTML = entry_uid;
		cell_id.style.visibility = 'hidden';

		var cell_name = row.insertCell(-1);
		cell_name.innerHTML = "From: <b>" + entry_row.cells[1].innerHTML + "</b> To: <b>" + entry_row.cells[2].innerHTML + "</b>";

		var cell_action = row.insertCell(-1);
		cell_action.innerHTML = "<button type=\"button\" class=\"btn btn-primary\" onclick=\"clearEdgeSelection(this)\"> Clear </button>";
	}
}

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
  'esri/geometry/Polyline',
  'esri/views/draw/Draw',
  'esri/geometry/geometryEngine',
  'esri/symbols/SimpleLineSymbol',
  'esri/layers/GraphicsLayer',
  'esri/core/sql/WhereClause',
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
  Popup,
  Polyline,
  Draw,
  geometryEngine,
  SimpleLineSymbol,
  GraphicsLayer,
  WhereClause
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
  // https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/COVID_19_Spread/FeatureServer/0
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

//console.log(timeSlider);
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

// test: to render edges (polylines) between nodes	
view.map.layers.add(new GraphicsLayer({ id: "connections" }));
const draw = new Draw({
          view: view
        });
	

view.whenLayerView(layer).then(function(layerView) {	
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
		for (p=0; p < response.results.length; p++)
		{
			var res = response.results[p];
			//console.log(res);
			//console.log(layerView);
			//console.log(layerView.graphics);
			if (res.graphic.layer === layer)
			{
				var query = layer.createQuery();
				query.where = "Date = '3/21/2020'";				
				console.log(query);
				layer.queryFeatures(query)
				  .then(function(response){
				     console.log(response);			     
				     
					for(q=0; q < response.features.length; q++)
					{
						if(response.features[q].attributes.Country_name != res.graphic.attributes.Country_name)
						{
							console.log(response.features[q].attributes.Country_name);
						}
					}				     
				  });				
			}
			break;
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
      view.on('click', function(event) {
      // view.on('click', function(event) {
        var screenPoint = {
          x: event.x,
          y: event.y
        };
        view.hitTest(screenPoint).then(function(response) {
          if (!response.results.length) {
		  var edgesDiv = document.getElementById("edgesDiv");
	     	  edgesDiv.innerHTML = "";
		  
		  // remove previous selection
		  if(view.map.findLayerById("connections").graphics.length > 0)
		  {
		        view.map.findLayerById("connections").graphics.removeAll();
		  }
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
		
	      /*var flowCurves: {
			strokeStyle: 'rgba(255, 0, 51, 0.8)',
			lineWidth: 0.75,
			lineCap: 'round',
			shadowColor: 'rgb(255, 0, 51)',
			shadowBlur: 1.5
		      };
	       */
		    
	        //console.log(canvasFlowmapLayer);
		var edgesDiv = document.getElementById("edgesDiv");
		var _html = "<table id=\"edge_list_table\" class=\"table table-dark\" style=\"color:white;\" align=\"center\"><tr><th style=\"visibility:hidden;\">UID</th><th>From</th><th>To</th><th>Connection</th></tr>";
		
	    	 console.log(canvasFlowmapLayer.graphics.items);
		 console.log(canvasFlowmapLayer.graphics);
		 var z=1;
		 var _tmpUIDs = [];
		 
		 // remove previous selection
		 if(view.map.findLayerById("connections").graphics.length > 0)
			 view.map.findLayerById("connections").graphics.removeAll();
		    
		 for(k=0; k < canvasFlowmapLayer.graphics.items.length; k++)
		 {
			 if(!canvasFlowmapLayer.graphics.items[k].attributes.isOrigin && 
			    result.graphic.attributes.isOrigin && 
			    (canvasFlowmapLayer.graphics.items[k].attributes.From_Airport_Code == result.graphic.attributes.From_Airport_Code) &&
			    !_tmpUIDs.includes(canvasFlowmapLayer.graphics.items[k].uid))
			 {
				 console.log("inside loop... " + k);
				_html +=  "<tr><td style=\"visibility:hidden;\">" + canvasFlowmapLayer.graphics.items[k].uid + "</td><td>" + canvasFlowmapLayer.graphics.items[k].attributes.From_Airport_Code + "</td><td>" + canvasFlowmapLayer.graphics.items[k].attributes.To_Airport_Code + "</td>";
				_html += "<td><button type=\"button\" style=\"background-color:#6c757d; border-color:#6c757d;\" class=\"btn btn-dark\" onclick=\"removeEdge(this)\"> Remove </button></td></tr>";
				 
				 _tmpUIDs.push(canvasFlowmapLayer.graphics.items[k].uid);
				var geographicLine = new Polyline();
				geographicLine.addPath([
				    [result.graphic.attributes.From_Longitude, result.graphic.attributes.From_Latitude],
				    [canvasFlowmapLayer.graphics.items[k].attributes.To_Longitude, canvasFlowmapLayer.graphics.items[k].attributes.To_Latitude]
				  ]);

				// Create a symbol for drawing the line
				var lineSymbol = {
				  type: "simple-line", // autocasts as SimpleLineSymbol()
				  color: [255,0,0,0.5],
				  width: 0.75,
				  cap : "round"
				};

				// Create an object for storing attributes related to the line
				var lineAtt = {
				  id: canvasFlowmapLayer.graphics.items[k].uid
				};

				 var line = geometryEngine.geodesicDensify(geographicLine, 10000);
				 view.map.findLayerById("connections").add(new Graphic({
				   geometry: line,
				   symbol: lineSymbol,
				   attributes: lineAtt,
				   /*popupTemplate: {
				   	title: "Connection Info",
					actions: [
					      {
						title: "Remove from Predictions",
						id: "removeFromPredictionEdge"
					      }
				        ],
   					content: "" +
						"<p>From = " + result.graphic.attributes.From_Airport + "</p>" +
						"<p>" + result.graphic.attributes.From_Name + ", " + result.graphic.attributes.From_Country + "</p>" +
						"<p>To = " + canvasFlowmapLayer.graphics.items[k].attributes.To_Airport + "</p>" +
						"<p>" + canvasFlowmapLayer.graphics.items[k].attributes.To_Name + ", " + canvasFlowmapLayer.graphics.items[k].attributes.To_Country + "</p>"
				    }*/
				  }));
				 
				 z++;
			 }
		 }		  
		 _html += "</table>";
	    	  edgesDiv.innerHTML = _html;
		  view.ui.add(edgesDiv, "top-right");
	    	  //document.getElementByID("edge-list-uid").style.visibility = "hidden";
	        
	      }
	      else{
		     var edgesDiv = document.getElementById("edgesDiv");
		     edgesDiv.innerHTML = "";
		      
		      // remove previous selection
		      if (result.graphic.layer !== view.map.findLayerById("connections")) {
			      if(view.map.findLayerById("connections").graphics.length > 0)
			      {
				      view.map.findLayerById("connections").graphics.removeAll();
			      }
		      }
	      }
          });
        });
      });
    });
  } 
});
