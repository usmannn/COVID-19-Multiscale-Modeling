// reconstructs the network
// reruns the prediction model on updated network
// updates the feature layer (data source) with new covid-19 spread prediction data

function addMarkerOnSlider()
{
	var marker = "|";

	var scaleElement = document.getElementsByClassName("esri-slider__segment esri-slider__segment-1");		
	var eleTransform = scaleElement[0].style.transform;

	var scaleList = eleTransform.split(" ");
	var scale = scaleList[0]+scaleList[1];

	var markerDiv = document.createElement("div");
	markerDiv.style.color = "red";
	markerDiv.style.fontSize = "32px";
	markerDiv.style.transform = scale;
	markerDiv.innerHTML = marker;

	scaleElement[0].parentNode.insertBefore(markerDiv, scaleElement[0].nextSibling);
}

function getLayer(_url)
{
	var query;
	require(["esri/layers/FeatureLayer"], function(FeatureLayer){

	$.ajax({
			url: _url,
			//url: "file://D:/Workspace/ArcGIS/COVID-19-Multiscale-Modeling/Data/download.csv",
			async: false,
			success: function(response) {
				var data = $.csv.toArrays(response);
				var graphicsList = [];
				var vRenderer = {
					type: "simple", 
					symbol: {
						type: "simple-marker",
						style: "circle",
						size: 10,
						color: {
							r: 255,
							g: 0,
							b: 0,
							a: 0.3
						},
						outline: {

							width: 1,
							color: {
								r: 255,
								g: 255,
								b: 0,
								a: 0.3
							},
							style: "solid"
						}

					},
					visualVariables:[
					{

						type: "size",
						field: "i",
						valueUnit: "unknown",
						minDataValue: 0,
						maxDataValue: 308850,
						minSize: 8,
						maxSize: 50
					}]
				};

				//step 1

				var i;
				for(i=1; i < data.length; i++) 
				{
					if(data[i][0] == "-----")break;
					if(data[i][6] == "None")continue;
					var d = new Date(data[i][8]);
					//console.log(d);
					graphicsList.push(
						{  geometry: {
							type: "point",
							longitude: parseFloat(data[i][6]),
							latitude: parseFloat(data[i][7])
						},

						attributes: {
							OBJECTID: i,
							id: data[i][0],
							s: parseInt(data[i][1]),
							i: parseInt(data[i][2]),
							r: parseInt(data[i][3]),
							d: parseInt(data[i][4]),
							population: parseInt(data[i][5]),
							long: parseFloat(data[i][6]),
							lat: parseFloat(data[i][7]),
							date: d.getTime()}


						});	
				}
				/*
				for(i=i+2; i < data.length; i++)
				{
					if(edges[data[i][0]] == undefined)edges[data[i][0]] = [];
					edges[data[i][0]].push({to: data[i][1], weight: parseInt(data[i][2])})
				}
				console.log(edges);
				*/

					


				query = new FeatureLayer({
					source: graphicsList,
					objectIdField: "ObjectId",
					fields: [{
						name: "ObjectId",
						type: "oid"
					}, {
						name: "id",
						type: "string"
					}, {
						name: "s",
						type: "integer"
					},{
						name: "i",
						type: "integer"
					},{
						name: "r",
						type: "integer"
					},{
						name: "d",
						type: "integer"
					},{
						name: "population",
						type: "integer"
					},{
						name: "long",
						type: "double"
					},{
						name: "lat",
						type: "double"
					},{
						name: "date",
						type: "date"
					}],
					outFields: [ "*" ],
					useViewTime: true,
					geometryType: "point",
					popupEnabled: true,
					popupTemplate: popupTemplate,
					title: "query",
					id: "nodes",
					timeInfo: {
						startField: "date"
					},
					renderer: vRenderer
				}

				);

				console.log(query);


				

			},
			dataType: "text",
			error: function(xhr) {
					//Do Something to handle error
				}
		});

});
return query;
}

function reconstruct(restricted_list)
{
	addMarkerOnSlider();
	

// step 0 

// send request to Xun's API
require([
	"esri/WebMap",
	"esri/views/MapView",
	"esri/widgets/LayerList",
	"esri/widgets/TimeSlider",
	"esri/widgets/Expand",
	"esri/widgets/Legend",
	"esri/Graphic",
	"esri/core/Collection",
	"esri/layers/FeatureLayer",
	"esri/TimeExtent",
	"esri/layers/support/TimeInfo",
	"esri/widgets/Popup",
	"esri/widgets/Feature",
	"esri/views/layers/support/FeatureFilter"
	
	], function(WebMap, MapView, LayerList, TimeSlider, Expand, Collection,Graphic, Legend, FeatureLayer, Popup, Feature, FeatureFilter) {

		
		
		
	layer.visible = false;
				
				var query = getLayer("Data/download.csv");
				console.log(query);
				webmap.add(query);
				let timeLayerView2;

				view.whenLayerView(query).then(function(lv) {

					timeLayerView2 = lv;

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


					timeLayerView2.filter = {
						timeExtent: value
					};
				});

	});
}
