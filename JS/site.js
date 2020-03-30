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
  },
  layers: [layer]
});

var view = new MapView({
  container: "viewDiv",
  map: webmap
});

//view.popup.defaultPopupTemplateEnabled  = true;

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
		
view.whenLayerView(layer).then(function(lv) {
  const fullTimeExtent = layer.timeInfo.fullTimeExtent;
  
  
  // set up time slider properties
  timeSlider.fullTimeExtent = fullTimeExtent;
  timeSlider.stops = {
	interval: {
		value: 1,
		unit: "days"
	}
  };
  
  // why this is null ?? Slider's buttons are disabled for some reason
  console.log(layer.timeInfo.interval);
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

var button_reconstruct = document.getElementById("construct_button");
view.ui.add(button_reconstruct, "top-right");

});
