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
	"esri/widgets/Feature"
], function(WebMap, MapView, LayerList, TimeSlider, Expand, Collection, Legend, FeatureLayer, Popup, Feature) {

//const layer = webmap.findLayerById('40b129da4bd84efa9993b768b8c6ead6');		
var layer = new FeatureLayer("https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/Dummy_COVID19_Spread_Temporal_Data/FeatureServer/0",
	{
		outFields: [ "*" ],
		useViewTime: false,
		popupEnabled: true
	}
);

var webmap = new WebMap({
  portalItem: {
	id: "9abddb687df74894878b7cc1ef90a902"
  },
  layers: [layer]
});

var view = new MapView({
  container: "viewDiv",
  map: webmap
});

view.popup.defaultPopupTemplateEnabled  = true;

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

// time slider widget initialization
const timeSlider = new TimeSlider({
  container: "timeSlider",
  mode: "time-window",
  view: view
});
view.ui.add(timeSlider, "manual");

// add the UI for titles, stats and chart.
view.ui.add("titleDiv", "top-right");

// accessing layer with temporal data from the webmap
		
view.when().then(function() {

	// Create a default graphic for when the application starts
	const graphic = {
		popupTemplate: {
		  content: "Mouse over features to show details..."
		}
	};
	
	// Provide graphic to a new instance of a Feature widget
	/*
	const feature = new Feature({
		container: "selected-features",
		graphic: graphic,
		map: view.map,
		spatialReference: view.spatialReference
	});
	*/

	view.whenLayerView(layer).then(function(lv) {
	  const fullTimeExtent = layer.timeInfo.fullTimeExtent;
	  
	  
	  // set up time slider properties
	  timeSlider.fullTimeExtent = fullTimeExtent;
	  timeSlider.stops = {
		interval: layer.timeInfo.interval
	  };
	  
	  // why this is null ?? Slider's buttons are disabled for some reason
	  console.log(layer.timeInfo.interval);
	});
});

var button_div = document.getElementById("construct_button");
view.ui.add(button_div, "top-right");

});
