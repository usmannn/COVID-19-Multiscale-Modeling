require([
  'Canvas-Flowmap-Layer/CanvasFlowmapLayer',
  'esri/Graphic',
  'esri/Map',
  'esri/views/MapView',
  'esri/widgets/LayerList',
  'esri/widgets/Expand',
  'esri/widgets/Legend',
  'esri/layers/FeatureLayer',
  'esri/TimeExtent',
  'esri/layers/support/TimeInfo',
  'esri/widgets/Popup',
  'esri/widgets/TimeSlider',
  'dojo/domReady!'
], function(
  CanvasFlowmapLayer,
  Graphic,
  EsriMap,
  MapView,
  LayerList,
  Expand,
  Legend,
  FeatureLayer,
  TimeSlider
) {
  var view = new MapView({
    container: 'viewDiv',
    map: new EsriMap({
      // use a standard Web Mercator map projection basemap
      basemap: 'dark-gray-vector'
    }),
    ui: {
      components: ['zoom', 'attribution']
    }
  });
  
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
  var featureLayer = new FeatureLayer("https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/Dummy_COVID19_Spread_Temporal_Data/FeatureServer/0",
    {
      outFields: [ "*" ],
      useViewTime: true,
      popupEnabled: true,
      popupTemplate: popupTemplate
    }
  );
  
  view.map.layers.add(featureLayer);

  // time slider widget initialization
  const timeSlider = new TimeSlider({
    container: "timeSlider",
    //mode: "time-window",
    mode: "instant",
    view: view
  });
  
  // accessing layer with temporal data from the webmap
  let timeLayerView;		
  view.whenLayerView(featureLayer).then(function(lv) {
    timeLayerView = lv;
    const fullTimeExtent = featureLayer.timeInfo.fullTimeExtent;
    // set up time slider properties
    timeSlider.fullTimeExtent = fullTimeExtent;
    timeSlider.stops = {
      interval: {
	value: 1,
	unit: "days"
      }
    };
  });

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
      canvasFlowmapLayerView.selectGraphicsForPathDisplayById('From_Airport_Code', 5539, true, 'SELECTION_NEW');

      // Tirana International Airport Mother Teresa
      canvasFlowmapLayerView.selectGraphicsForPathDisplayById('From_Airport_Code', 13755, true, 'SELECTION_ADD');

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
            }
          });
        });
      });
    });
  }
  
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

  view.ui.add(layersExpand, "top-left");
  view.ui.add("titleDiv", "top-right");
  var button_reconstruct = document.getElementById("construct_button");
  view.ui.add(button_reconstruct, "top-right");
  view.ui.add(timeSlider, "manual");
});
