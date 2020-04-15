function load()
{

	require(["esri/views/MapView", "esri/WebMap"], function(MapView, WebMap) {

		webmap = new WebMap({
			// use a standard Web Mercator map projection basemap
			//basemap: 'dark-gray-vector'
		  	portalItem: {
			  	id: "9abddb687df74894878b7cc1ef90a902"
			  }
			}); 
		view = new MapView({
			container: 'viewDiv',
			map: webmap, 

			ui: {
				components: ['zoom', 'attribution']
			}
		});

	});
}

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

function plotSIR(attributes, _layer, currentTimeExtent, plotExpand)
{
	var query = _layer.createQuery();
	var _dd = new Date(timeSlider.timeExtent.start);
	query.where = "date <= " + _dd.getTime() + " AND id = '"+attributes.id+"'";
	_layer.queryFeatures(query)
	.then(function(response){

		console.log("Query executed...");
		console.log("Records found: " + response.features.length);
		var name = [];
		var s = [];
		var i = [];
		var r = [];
		var d = [];

		for (j = 0; j < response.features.length; j++)
		{
			name.push(response.features[j].attributes.name);
			s.push(response.features[j].attributes.s);
			i.push(response.features[j].attributes.i);
			r.push(response.features[j].attributes.r);
			var date = new Date(response.features[j].attributes.date)
			var month = '' + (date.getMonth() + 1), day = '' + date.getDate(), year = date.getFullYear();
			if (month.length < 2) month = '0' + month;
			if (day.length < 2) day = '0' + day;
			d.push([year,month,day].join('-'));
		}

		var plotDiv = document.getElementById("plotDiv");

		var traces = [
			{x: d, y: s,name:'Susceptible', stackgroup: 'one', groupnorm:'percent'},
			{x: d, y: i,name:'Infected', stackgroup: 'one'},
			{x: d, y: r,name:'Recovered', stackgroup: 'one'}
		];

		var layout = {
	        title: 'SIR Plot (Country: '+attributes.name+')',
	        xaxis: {
	            autorange: true,
	            //showgrid: false,
	            //zeroline: false,
	            showline: false,
	            autotick: true,
	            //ticks: '',
	            //showticklabels: false,
	            fixedrange: true
	        },
	        yaxis: {
	            autorange: true,
	            //showgrid: false,
	            //zeroline: false,
	            //showline: false,
	            autotick: true,
	            //ticks: '',
	            //showticklabels: false,
	            fixedrange: true
	        },
	        autosize: true,
	        showlegend: true
	    };

		var config = {
			toImageButtonOptions: {
	            format: 'svg', // one of png, svg, jpeg, webp
	            filename: 'SIR_Plot_'+currentTimeExtent,
	            height: 600,
	            width: 800,
	            scale: 1,
	        },
	        displayModeBar: true,
	        'displaylogo': false,
	        'modeBarButtonsToRemove': ['toggleSpikelines', 'pan2d', 'lasso2d', 'sendDataToCloud', 'editInChartStudio', 'select2d', 'zoomIn2d', 'zoom2d', 'zoomOut2d', 'autoScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian']
	    };
		
		Plotly.newPlot(plotDiv, traces, layout, config);
		plotExpand.expanded = true;
	});
}

function initialize(selection_id)
{

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
		'esri/intl',
		'esri/geometry/Point',
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
			WhereClause,
			intl,
			Point
			) {
			
		// popup configuration
		popupTemplate = {
			title: "Country: {name}",
			actions: [
			{
				title: "Remove from Predictions",
				id: "removeFromPrediction"
			},
			{
				title: "SIR Plot",
				id: "plotSIR"
			}
			],
			content: [
			{
				type: "fields",
				fieldInfos: [                  
				{
					fieldName: "id",
					label: "ID"
				},
				{
					fieldName: "name",
					label: "Name"
				},
				{
					fieldName: "s",
					label: "Susceptible"
				},
				{
					fieldName: "d",
					label: "Total Deaths"
				},
				{
					fieldName: "i",
					label: "Infectious"
				},
				{
					fieldName: "r",
					label: "Recovered"
				},	  
				{
					fieldName: "population",
					label: "Total Population"
				}
				]
			}
			]
		};
		
		url = "";
		
		if(selection_id == "s_ca")
		{
			var pt = new Point({
			  latitude: 53.9333,
			  longitude: -116.5765
			});

			view.goTo({
				target: pt,
				zoom: 5
			}, {
			  duration: "5000"
			});

			url = "https://128.6.23.29:1919/?mode=get&node=CA";
		}
		else if(selection_id == "s_us")
		{
			var pt = new Point({
			  latitude: 34.22333378,
			  longitude: -82.46170658
			});

			view.goTo({
				target: pt,
				zoom: 5
			}, {
			  duration: "5000"
			});

			url = "https://128.6.23.29:1919/?mode=get&node=US";
		}
		else
		{
			url = "https://128.6.23.29:1919/?mode=init";
		}

		/*
		//const layer = webmap.findLayerById('40b129da4bd84efa9993b768b8c6ead6');		
		layer = new FeatureLayer("https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/COVID_19_Spread_v2/FeatureServer/0",
		//layer = new FeatureLayer("https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/Dummy_COVID19_Spread_Temporal_Data/FeatureServer/0",
		{
			outFields: [ "*" ],
			useViewTime: true,
			popupEnabled: true,
			popupTemplate: popupTemplate,
			id: "nodes"
		});
		*/

		layer = getLayer(url, "Base Data", true);
		view.map.layers.add(layer);

		// time slider widget initialization
		timeSlider = new TimeSlider({
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
		let timeLayerView, currentTimeExtent;
		const dateFormatIntlOptions = intl.convertDateFormatToIntlOptions("short-date");

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

		timeSlider.watch("timeExtent", function(timeExtent){
		var _d = new Date(timeExtent.start);
		var formattedTimeExtent = intl.formatDate(_d .setDate(_d .getDate() + 1), dateFormatIntlOptions);
		currentTimeExtent = formattedTimeExtent;

		if (view.map.findLayerById("connections")) {
			if(view.map.findLayerById("connections").graphics.length > 0)
			{
				view.map.findLayerById("connections").graphics.removeAll();
			}
		}
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
		
		var plotExpand = new Expand({
			expandIconClass: "esri-icon-polyline",
			expandTooltip: "SIR Plot",
			content: plotDiv,
			expanded: false
		});

		// Adding selected feature to restricted country list when removeFromPrediction is clicked 
		view.when(function() {
			var popup = view.popup;
			popup.viewModel.on("trigger-action", function(event) {
				var attributes = popup.viewModel.selectedFeature.attributes;
				var _layer = popup.viewModel.selectedFeature.layer;
				if (event.action.id === "removeFromPrediction")
				{
					// if not already exist, add the id to selected_ids list
					if(!selected_ids.includes(attributes.id))
					{
						selected_ids.push(attributes.id);

						// make an entry for the selected feature in restricted countries panel
						var table = document.getElementById("table_restricted_countries");
						var row = table.insertRow(-1);

						var cell_id = row.insertCell(-1);				
						cell_id.innerHTML = attributes.id;
						cell_id.style.visibility = 'hidden';

						var cell_name = row.insertCell(-1);
						cell_name.innerHTML = attributes.name;
						cell_name.style.fontWeight = "bold";

						var cell_action = row.insertCell(-1);
						cell_action.innerHTML = "<button type=\"button\" class=\"btn btn-primary\" onclick=\"clearCountrySelection(this)\"> Clear </button>";
					}
				}
				if (event.action.id === "plotSIR") 
				{
					plotSIR(attributes, _layer, currentTimeExtent, plotExpand);
				}
			});
		});

		view.ui.add(layersExpand, "top-left");
		view.ui.add("titleDiv", "top-right");
		view.ui.add(plotExpand, "top-left");
		var button_reconstruct = document.getElementById("externalDiv");
		view.ui.add(button_reconstruct, "top-right");

		// test: to render edges (polylines) between nodes	
		view.map.layers.add(new GraphicsLayer({ id: "connections", title: "Connections" }));
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
					var edgesDiv = document.getElementById("edgesDiv");
					edgesDiv.innerHTML = "";
					
					plotExpand.expanded = false;

					// remove previous selection
					if(view.map.findLayerById("connections").graphics.length > 0)
					{
						view.map.findLayerById("connections").graphics.removeAll();
					}
					return;
				}
				for (p=0; p < response.results.length; p++)
				{
					var res = response.results[p];
					
					if(plotExpand.expanded)
					{
						plotSIR(res.graphic.attributes, res.graphic.layer, currentTimeExtent, plotExpand);
					}
					
					if (res.graphic.layer.id === 'nodes')
					{
						var query = layer.createQuery();
						var _dd = new Date(timeSlider.timeExtent.start);
						query.where = "date = " + _dd.getTime() + " AND id IN (" + edges[res.graphic.attributes.id] + ")";
						layer.queryFeatures(query)
						.then(function(response){							
							// Create a symbol for drawing the line
							var lineSymbol = {
							  type: "simple-line", // autocasts as SimpleLineSymbol()
							  color: [255,0,0,0.5],
							  width: 0.75,
							  cap : "round"
							};
							
							var edgesDiv = document.getElementById("edgesDiv");
							var _html = "<table id=\"edge_list_table\" class=\"table table-dark\" style=\"color:white;\" align=\"center\"><tr><th style=\"visibility:hidden;\">UID</th><th>From</th><th>To</th><th>Connection</th></tr>";		
							var _tmpUIDs = [];
							for(q=0; q < response.features.length; q++)
							{
								if(response.features[q].attributes.id != res.graphic.attributes.id &&
									!_tmpUIDs.includes(response.features[q].attributes.id))
								{
									_html +=  "<tr><td style=\"visibility:hidden;\">" + response.features[q].attributes.id + "</td><td>" + res.graphic.attributes.name + "</td><td>" + response.features[q].attributes.name + "</td>";
									_html += "<td><button type=\"button\" style=\"background-color:#6c757d; border-color:#6c757d;\" class=\"btn btn-dark\" onclick=\"removeEdge(this)\"> Remove </button></td></tr>";
									_tmpUIDs.push(response.features[q].attributes.id);
									
									var geographicLine = new Polyline();
									geographicLine.addPath([
										[res.graphic.attributes.long, res.graphic.attributes.lat],
										[response.features[q].attributes.long, response.features[q].attributes.lat]
										]);
									// Create an object for storing attributes related to the line
									var lineAtt = {
										From_ID: res.graphic.attributes.id,
										From: res.graphic.attributes.name,
										To_ID: response.features[q].attributes.id,
										To: response.features[q].attributes.name
									};

									var line = geometryEngine.geodesicDensify(geographicLine, 10000);
									view.map.findLayerById("connections").add(new Graphic({
										geometry: line,
										symbol: lineSymbol,
										attributes: lineAtt
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
								}
							}
							_html += "</table>";
							edgesDiv.innerHTML = _html;
							view.ui.add(edgesDiv, "top-right");
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

	});
}
