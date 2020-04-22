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
	markerDiv.id = "marker-div";

	scaleElement[0].parentNode.insertBefore(markerDiv, scaleElement[0].nextSibling);
}

function getLayer(_url, layer_name, isInit=false)
{
	var query, alpha;
	
	if(isInit) alpha = 0.8;
	else alpha = 0.3;

	require(["esri/layers/FeatureLayer"], function(FeatureLayer){
	
	$.ajax({
			url: _url,
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
							a: alpha
						},
						outline: {

							width: 1,
							color: {
								r: 255,
								g: 255,
								b: 0,
								a: alpha
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
				if(!isInit)
				{
					for(i=0;i < data.length; i++)if(data[i][0] == "=====") break; 
				}
				else {i = 0;}

				for(i=i+1; i < data.length; i++) 
				{
					if(data[i][0] == "=====") continue; // separator for simulated data
					if(data[i][0] == "-----") break;  // separator for edges
					if(data[i][9] == "0.0") continue; // Longitude					
					var year = data[i][11].slice(6,10)
					var day = data[i][11].slice(0,5);
					//var d = new Date(data[i][11]);
					var d = new Date(year+'-'+day);				
					//console.log(d);
					graphicsList.push({ 
						geometry: {
							type: "point",
							longitude: parseFloat(data[i][9]),
							latitude: parseFloat(data[i][10])
						},

						attributes: {
							ObjectID: i,
							id: data[i][0],
							name: data[i][1],
							s: parseInt(data[i][2]),
							i: parseInt(data[i][3]),
							r: parseInt(data[i][4]),
							d: parseInt(data[i][5]),
							population: parseInt(data[i][6]),
							tested: parseInt(data[i][7]),
							hospitalized: parseInt(data[i][8]),
							long: parseFloat(data[i][9]),
							lat: parseFloat(data[i][10]),
							date: d.getTime(),
							weight: 1.0
						}
					});	
				}

				for(i=i+2; i < data.length; i++)
				{

					if(edges[data[i][0]] && edges[data[i][0]].length > 0)
						edges[data[i][0]] += ",'" + data[i][1] + "'";
					else
						edges[data[i][0]] = "'" + data[i][1] + "'";
				}

				query = new FeatureLayer({
					source: graphicsList,
					objectIdField: "ObjectID",
					fields: [{
						name: "ObjectID",
						type: "oid"
					},{
						name: "id",
						type: "string"
					},{
						name: "name",
						type: "string"
					},{
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
						name: "tested",
						type: "integer"
					},{
						name: "hospitalized",
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
					},{
						name: "weight",
						type: "double",
						editable: true
					}],
					outFields: [ "*" ],
					useViewTime: true,
					geometryType: "point",
					popupEnabled: true,
					popupTemplate: popupTemplate,
					title: layer_name,
					id: "nodes",
					timeInfo: {
						startField: "date"
					},
					renderer: vRenderer
				});
			},
			dataType: "text",
			error: function(xhr) {
					alert("Failed to load data from server...");
			}
		});

	});
	
	return query;
}

function reconstruct(restricted_list, callback)
{
	// step 0 
	endRealTimeExtent = timeSlider.timeExtent.start;
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

			//layer.visible = false;
			
			//console.log(restricted_list[3]);
			if(queryLayer) 
			{	
				queryLayer.visible = false;
			}
			queryLayer = getLayer(restricted_list[3], "Query");
			view.map.layers.add(queryLayer);
			currentLayer = queryLayer;

			let timeLayerView2;

			view.whenLayerView(queryLayer).then(function(lv) {

				timeLayerView2 = lv;

				const fullTimeExtent = queryLayer.timeInfo.fullTimeExtent;
				// set up time slider properties
				timeSlider.fullTimeExtent = fullTimeExtent;
				timeSlider.stops = {
					interval: {
						value: 1,
						unit: "days"
					}
				};
				//timeSlider.mode = "time-window";
				//timeSlider.values = [restricted_list[2], timeSlider.fullTimeExtent.end];
			});

			timeSlider.watch("timeExtent", function(value){


				timeLayerView2.filter = {
					timeExtent: value
				};
			});

		});

	var markerDiv = document.getElementById("marker-div");
    if(markerDiv) markerDiv.parentNode.removeChild(markerDiv);

	setTimeout(addMarkerOnSlider, 5000);
}
