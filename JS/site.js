require([
  'Canvas-Flowmap-Layer/CanvasFlowmapLayer',
  'esri/Graphic',
  'esri/Map',
  'esri/views/MapView',
  'dojo/domReady!'
], function(
  CanvasFlowmapLayer,
  Graphic,
  EsriMap,
  MapView
) {
  var view = new MapView({
    container: 'viewDiv',
    map: new EsriMap({
      // use a standard Web Mercator map projection basemap
      basemap: 'dark-gray-vector'
    }),
    ui: {
      components: ['zoom', 'attribution', 'compass']
    }
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

    view.map.layers.add(canvasFlowmapLayer);

    // get access to the CanvasFlowmapLayer's layerView to make modifications
    // of which O-D relationships are flagged for path display
    view.whenLayerView(canvasFlowmapLayer).then(function(canvasFlowmapLayerView) {
      // automatically select a few ORIGIN locations for path display
      // in order to demonstrate the flowmap functionality,
      // without being overwhelming and showing all O-D relationships

      // Reykjavík
      canvasFlowmapLayerView.selectGraphicsForPathDisplayById('From_Airport_Code', 5539, true, 'SELECTION_NEW');

      // Alexandria
      canvasFlowmapLayerView.selectGraphicsForPathDisplayById('From_Airport_Code', 7500, true, 'SELECTION_ADD');

      // Tokyo
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
});
