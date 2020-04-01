// site.js
// implements core functionality

// Using web map from ArcGIS online      
require([
	"esri/WebMap",
	"esri/views/MapView",
	"esri/widgets/LayerList",
	"esri/widgets/TimeSlider",
	"esri/widgets/Expand",
	"esri/widgets/Legend",
	"esri/core/Collection",
	"esri/layers/FeatureLayer",
	"esri/TimeExtent",
	"esri/layers/support/TimeInfo",
	"esri/widgets/Popup",
	"esri/widgets/Feature",
	"esri/views/layers/support/FeatureFilter",
	"Canvas-Flowmap-Layer/CanvasFlowmapLayer",
	"esri/Graphic",
	"dojo/domReady!"
], function(WebMap, MapView, LayerList, TimeSlider, Expand, Collection, Legend, FeatureLayer, Popup, Feature, FeatureFilter, CanvasFlowmapLayer,Graphic) {

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

var webmap = new WebMap({
  portalItem: {
	id: "9abddb687df74894878b7cc1ef90a902"
  }//,
  //layers: [layer]
});

var view = new MapView({
  container: "viewDiv",
  map: webmap
});

//view.popup.defaultPopupTemplateEnabled  = true;

view.when(function() {
    // here we use Papa Parse to load and read the CSV data
    // we could have also used another library like D3js to do the same
    Papa.parse('Data/Flowmap_Cities_one_to_many.csv', {
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
          //longitude: datum.From_Longitude,
	  //latitude: datum.From_Latitude
	  longitude: datum.s_lon,
	  latitude: datum.s_lat
        },
        attributes: datum
      });
    });

    var canvasFlowmapLayer = new CanvasFlowmapLayer({
      // array of Graphics
      graphics: graphicsFromCsvRows,

      // information about the uniqe origin-destinatino fields and geometries
      originAndDestinationFieldIds: {
        //originUniqueIdField: 'From_Airport_Code',
      originUniqueIdField: 's_city_id',
	originGeometry: {
		//x: 'From_Longitude',
		//y: 'From_Latitude',
		x: 's_lon',
		y: 's_lat',
		spatialReference: {
		wkid: 4326
	}
	},
	//destinationUniqueIdField: 'To_Airport_Code',
	destinationUniqueIdField: 'e_city_id',
	destinationGeometry: {
		//x: 'To_Longitude',
		//y: 'To_Latitude',
		x: 'e_lon',
		y: 'e_lat',
		spatialReference: {
		wkid: 4326
		}
	}
      }
    });

    view.map.layers.add(canvasFlowmapLayer);

    // get access to the CanvasFlowmapLayer's layerView to make modifications
    // of which O-D relationships are flagged for path display
    view.whenLayerView(canvasFlowmapLayer).then(function(canvasFlowmapLayerView) {
      // automatically select a few ORIGIN locations for path display
      // in order to demonstrate the flowmap functionality,
      // without being overwhelming and showing all O-D relationships

      // Reykjavík
      canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', 562, true, 'SELECTION_NEW');

      // Alexandria
      canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', 1, true, 'SELECTION_ADD');

      // Tokyo
      canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', 642, true, 'SELECTION_ADD');

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
                  's_city_id',
                  result.graphic.attributes.s_city_id,
                  result.graphic.attributes.isOrigin,
                  'SELECTION_NEW'
                );
              } else {
                canvasFlowmapLayerView.selectGraphicsForPathDisplayById(
                  'e_city_id',
                  result.graphic.attributes.e_city_id,
                  result.graphic.attributes.isOrigin,
                  'SELECTION_NEW'
                );
              }
            }
          });
        });
      });
    });
  }
});
