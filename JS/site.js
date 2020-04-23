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

		// changing default scale to US: s_us
		overlayOff("s_us");
	});
}

function removeEdge(entry)
{
	var i = entry.parentNode.parentNode.rowIndex;
	var entry_row = document.getElementById("edge_list_table").rows[i];
	var entry_uid = entry_row.cells[0].id;
	//alert("Selected UID: " + entry_uid);
	
	// if not already exist, add the id to selected_ids list
	if(!selected_edge_ids .includes(entry_uid))
	{
		selected_edge_ids.push(entry_uid);

		// make an entry for the selected edge in restricted edges panel
		var table = document.getElementById("table_restricted_connections");
		var row = table.insertRow(-1);

		var cell_id = row.insertCell(-1);
		cell_id.id = entry_uid;
		cell_id.style.visibility = 'hidden';

		var cell_name = row.insertCell(-1);
		cell_name.innerHTML = "Remove:  <b>" + entry_row.cells[1].innerHTML + "</b>  ->  <b>" + entry_row.cells[2].innerHTML + "</b>";

		var cell_action = row.insertCell(-1);
		cell_action.innerHTML = "<button type=\"button\" class=\"btn btn-primary\" onclick=\"clearEdgeSelection(this)\"> Clear </button>";
	}
}

function editFeatureUpdate(entry){	

	var editWeight = document.getElementById("edit_weight_val");	
	var editTableRow = document.getElementById("edit_attributes").rows[0];
	var id = editTableRow.cells[0].id;
	// if not already exist, add the id to selected_ids list
	if(!selected_ids.includes(id))
	{
		selected_ids.push(id);

		// make an entry for the selected feature in restricted countries panel
		var table = document.getElementById("table_restricted_countries");
		var row = table.insertRow(-1);

		var cell_id = row.insertCell(-1);				
		cell_id.id = id + "_w_" + editWeight.value;
		cell_id.style.visibility = 'hidden';

		var cell_name = row.insertCell(-1);
		cell_name.innerHTML = "Update:  " + editTableRow.cells[1].innerHTML;
		cell_name.style.fontWeight = "bold";

		var cell_action = row.insertCell(-1);
		cell_action.innerHTML = "<button type=\"button\" class=\"btn btn-primary\" onclick=\"clearCountrySelection(this)\"> Clear </button>";
	}
}

function plotSIR(attributes, _layer, currentTimeExtent, plotExpand)
{	
	var _dd = new Date(timeSlider.timeExtent.start);
	var query = layer.createQuery();
	query.where = "date <= " + _dd.getTime() + " AND id = '"+attributes.id+"'";
	layer.queryFeatures(query)
	.then(function(response){

		var name = [];
		var s = [];
		var i = [];
		var r = [];
		var dh = [];
		var d = [];
		var test = [];
		var hosp = [];
		for (j = 0; j < response.features.length; j++)
		{
			name.push(response.features[j].attributes.name);
			s.push(response.features[j].attributes.s);
			i.push(response.features[j].attributes.i);
			r.push(response.features[j].attributes.r);
			dh.push(response.features[j].attributes.d);
			test.push(response.features[j].attributes.tested);
			hosp.push(response.features[j].attributes.hospitalized);
			var date = new Date(response.features[j].attributes.date)
			var month = '' + (date.getMonth() + 1), day = '' + date.getDate(), year = date.getFullYear();
			if (month.length < 2) month = '0' + month;
			if (day.length < 2) day = '0' + day;
			d.push([year,month,day].join('-'));
		}

		
		var plotDiv = document.getElementById("plotDiv");

		var traces = [
			//{x: d, y: s,name:'Susceptible', stackgroup: 'one', groupnorm:'percent'},
			//{x: d, y: s,name:'Susceptible', stackgroup: 'one'},
			{x: d, y: i,name:'Infected',mode: 'lines', line:{color: 'red'}},
			{x: d, y: r,name:'Recovered',mode: 'lines',line:{color: 'green'}},
			{x: d, y: dh,name:'Deaths',mode: 'lines',line:{color: 'black'}},
			{x: d, y: test,name:'Tested',mode: 'lines',line:{color: 'yellow'}},
			{x: d, y: hosp,name:'Hospitalized',mode: 'lines',line:{color: 'orange'}}
		];
		if (_dd <= endRealTimeExtent)
		{
			layout = {
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
        }
        else
        {
		
        	layout = {
        		title: 'Scale: '+attributes.name+')',
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

            	shapes: [{
            		type: 'line',
            		x0: endRealTimeExtent,
            		y0: 0,
            		x1: endRealTimeExtent,
            		y1: 1,
			yref: "paper",
            		line: {
            			color: 'pink',
            			width: 1.5,
            		}
            	}],
            	autosize: true,
            	showlegend: true
            };
        }

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
	 
	});
	
	if(_layer !== layer)
	{
		query = _layer.createQuery();
		query.where = "date <= " + _dd.getTime() + " AND id = '"+attributes.id+"'";
		_layer.queryFeatures(query)
		.then(function(response){
			var name = [];
			var s = [];
			var i = [];
			var r = [];
			var dh = [];
			var d = [];
			var test = [];
			var hosp = [];

			for (j = 0; j < response.features.length; j++)
			{
				name.push(response.features[j].attributes.name);
				s.push(response.features[j].attributes.s);
				i.push(response.features[j].attributes.i);
				r.push(response.features[j].attributes.r);
				dh.push(response.features[j].attributes.d);
				test.push(response.features[j].attributes.tested);
				hosp.push(response.features[j].attributes.hospitalized);
				var date = new Date(response.features[j].attributes.date)
				var month = '' + (date.getMonth() + 1), day = '' + date.getDate(), year = date.getFullYear();
				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;
				d.push([year,month,day].join('-'));
			}

			var plotDiv = document.getElementById("plotDiv");

			var traces = [
				//{x: d, y: s,name:'Susceptible', stackgroup: 'one', groupnorm:'percent'},
				//{x: d, y: s,name:'Susceptible', mode: 'lines',line: {dash: 'dot'}},
				{x: d, y: i,name:'Infected (P)', mode: 'lines',line: {dash: 'dot', color: 'red'}, showlegend: false},
				{x: d, y: r,name:'Recovered (P)', mode: 'lines',line: {dash: 'dot', color: 'green'}, showlegend: false},
				{x: d, y: dh,name:'Deaths (P)', mode: 'lines',line: {dash: 'dot', color: 'black'}, showlegend: false},
				{x: d, y: test,name:'Tested (P)', mode: 'lines',line: {dash: 'dot', color: 'yellow'}, showlegend: false},
				{x: d, y: hosp,name:'Hospitalized (P)', mode: 'lines',line: {dash: 'dot', color: 'orange'}, showlegend: false}
			];

			Plotly.addTraces(plotDiv, traces);		
		});
	}
	plotExpand.expanded = true;	
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
			},
			{
       
				title: "Edit feature",
				id: "edit-this",          
				className: "esri-icon-edit"        
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
				},
				{
					fieldName: "tested",
					label: "Total Tested"
				},
				{
					fieldName: "hospitalized",
					label: "Total Hospitalized"
				},
				{
					fieldName: "weight",
					label: "Weight"
				}
				]
			}
			]
		};
		
		url = "";
		var selectedFeature;
		
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

			url = "http://128.6.23.29:1919/?mode=get&node=CA";
		}
		else if(selection_id == "s_us")
		{
			var pt = new Point({
			  latitude: 40,
			  longitude: -100
			});

			view.goTo({
				target: pt,
				center: pt,
				zoom: 5
			}, {
			  duration: "5000"
			});

			url = "http://128.6.23.29:1919/?mode=get&node=US";
		}
		else
		{
			url = "http://128.6.23.29:1919/?mode=init";
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
		layers.push(layer);
		view.map.layers.add(layer);
		currentLayer = layer;

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

		var editDiv = document.getElementById("editDiv");
		var editExpand = new Expand({
			expandIconClass: "esri-icon-edit",
			expandTooltip: "Edit Attributes",
			content: editDiv,
			expanded: false
		});

		var undoDiv = document.getElementById("undoDiv");
		/*
		var editExpand = new Expand({
			expandIconClass: "esri-icon-undo",
			expandTooltip: "Undo Change",
			content: undoDiv,
			expanded: false
		});
		*/

		// accessing layer with temporal data from the webmap
		let timeLayerView, currentTimeExtent;
		const dateFormatIntlOptions = intl.convertDateFormatToIntlOptions("short-date");

		view.whenLayerView(currentLayer).then(function(lv) {
		timeLayerView = lv;
		const fullTimeExtent = currentLayer.timeInfo.fullTimeExtent;
		endRealTimeExtent = currentLayer.timeInfo.fullTimeExtent.end;
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

			// update data in SIR plot if opened
			if(plotExpand.expanded)
			{
				var plotDiv = document.getElementById("plotDiv");
				if(plotDiv.data) // => current data
				{
					plotSIR(selectedFeature.attributes,currentLayer,currentTimeExtent,plotExpand);
				}
			}
		});

		// Adding selected feature to restricted country list when removeFromPrediction is clicked 
		view.when(function() {
			var popup = view.popup;
			popup.viewModel.on("trigger-action", function(event) {
				var attributes = popup.viewModel.selectedFeature.attributes;
				var _layer = popup.viewModel.selectedFeature.layer;
				selectedFeature = popup.viewModel.selectedFeature;

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
						cell_id.id = attributes.id;
						cell_id.style.visibility = 'hidden';

						var cell_name = row.insertCell(-1);
						cell_name.innerHTML = "Remove:  " + attributes.name;
						cell_name.style.fontWeight = "bold";

						var cell_action = row.insertCell(-1);
						cell_action.innerHTML = "<button type=\"button\" class=\"btn btn-primary\" onclick=\"clearCountrySelection(this)\"> Clear </button>";
					}
				}
				if (event.action.id === "plotSIR") 
				{
					plotSIR(attributes, _layer, currentTimeExtent, plotExpand);
				}
				if (event.action.id === "edit-this")
				{
					if(!selected_ids.includes(attributes.id))
					{
						var _p = document.createElement("p");
						_p.innerHTML = "<b>ID: </b>" + attributes.id + "<br><br>";
						editDiv.appendChild(_p);

						var _t = document.createElement("table");
						_t.class = "table table-dark";
						_t.id = "edit_attributes";

						var row = _t.insertRow(-1);

						var cell_name_label = row.insertCell(-1);
						cell_name_label.id = attributes.id;
						cell_name_label.innerHTML = "<b>Name: </b>";
						
						var cell_name = row.insertCell(-1);
						cell_name.innerHTML = attributes.name;

						var row2 = _t.insertRow(-1);

						var cell_weight_label = row2.insertCell(-1);
						cell_weight_label.innerHTML = "<b>Weight: </b>";
						
						var cell_weight = row2.insertCell(-1);
						cell_weight.innerHTML = "<input type=\"text\" id=\"edit_weight_val\" size=\"3px;\" value=" + attributes.weight + "><br>"

						var row3 = _t.insertRow(-1);

						var cell_action_label = row3.insertCell(-1);
						cell_action_label.innerHTML = "";

						var cell_action = row3.insertCell(-1);
						cell_action.innerHTML = "<button type=\"button\" class=\"btn btn-primary\" onclick=\"editFeatureUpdate(this)\"> Update </button>";

						editDiv.appendChild(_t);
						editExpand.expanded = true;
					}
				}
			});
		});
		view.ui.add(undoDiv, "top-left");
		view.ui.add(layersExpand, "top-left");
		view.ui.add("titleDiv", "top-right");
		view.ui.add(plotExpand, "top-left");
		view.ui.add(editExpand, "top-left");
		var button_reconstruct = document.getElementById("externalDiv");
		view.ui.add(button_reconstruct, "top-right");

		// test: to render edges (polylines) between nodes	
		view.map.layers.add(new GraphicsLayer({ id: "connections", title: "Connections" }));
		const draw = new Draw({
			view: view
		});
		

		view.whenLayerView(currentLayer).then(function(layerView) {	
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

						editDiv.innerHTML = "";
						editExpand.expanded = false;

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

						if(editExpand.expanded)
						{
							editDiv.innerHTML = "";
							editExpand.expanded = false;
						}
						
						if (currentLayer.id === 'nodes')
						{
							var query = currentLayer.createQuery();
							var _dd = new Date(timeSlider.timeExtent.start);
							query.where = "date = " + _dd.getTime() + " AND id IN (" + edges[res.graphic.attributes.id] + ")";
							currentLayer.queryFeatures(query)
							.then(function(response){

								if(response.features.length > 0)
								{
									var query2 = layer.createQuery();
									query2.where = "date = " + _dd.getTime() + " AND id IN (" + edges[res.graphic.attributes.id] + ")";
									layer.queryFeatures(query2)
									.then(function(response2){

										if(layer !== currentLayer)
										{
											for(z=0; z < response2.features.length; z++)
												response.features.push(response2.features[z]);
										}

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
												_html +=  "<tr><td id=\""+ res.graphic.attributes.id+"->"+response.features[q].attributes.id + "\" style=\"visibility:hidden;\"></td><td>" + res.graphic.attributes.name + "</td><td>" + response.features[q].attributes.name + "</td>";
												_html += "<td><button type=\"button\" style=\"background-color:#6c757d; border-color:#6c757d;\" class=\"btn btn-dark\" onclick=\"removeEdge(this)\"> Remove </button></td></tr>";
												_tmpUIDs.push(res.graphic.attributes.id+"->"+response.features[q].attributes.id);
												
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
							});				
						}
						break;
					}		
				});
			});

			// Listen to the double-click event on the map view.
			view.on("double-click", function(event) {

				event.stopPropagation();

				var screenPoint = {
					x: event.x,
					y: event.y
				};
				
				view.hitTest(screenPoint).then(function(response) {				

					if (!response.results.length) {
						var edgesDiv = document.getElementById("edgesDiv");
						edgesDiv.innerHTML = "";
						
						plotExpand.expanded = false;

						editDiv.innerHTML = "";
						editExpand.expanded = false;

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
						
						if (currentLayer.id === 'nodes')
						{
							//alert(res.graphic.attributes.name);
							//layer.visible = false;
							
							if(queryLayer) 
							{	
								queryLayer.visible = false;
							}

							var pt = new Point({
								latitude: res.graphic.attributes.lat,
								longitude: res.graphic.attributes.long
							});

							view.goTo({
								target: pt,
								zoom: 7.5
							}, {
								duration: "3000"
							});
							
							var urlZoomed = "http://128.6.23.29:1919/?mode=get&node=" + res.graphic.attributes.name;
							var isInit = false;
							if(lastToDate.length > 1)
							{
								var _d = new Date(currentLayer.timeInfo.fullTimeExtent.end);
								var _formattedTimeExtent = (_d.getMonth()+1) + "-" + (_d.getDate()+1) + "-" + _d.getFullYear();
								urlZoomed += "&to_date=" + _formattedTimeExtent;
							}
							else
								isInit = true;
							
							queryLayer = getLayer(urlZoomed, "Query: " + res.graphic.attributes.name, isInit);
							layers.push(queryLayer);
							view.map.layers.add(queryLayer);
							currentLayer = queryLayer;

							let timeLayerView3;

							view.whenLayerView(queryLayer).then(function(lv) {

								timeLayerView3 = lv;

								const fullTimeExtent = queryLayer.timeInfo.fullTimeExtent;
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

								timeLayerView3.filter = {
									timeExtent: value
								};
							});
							
							return;
						}
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

function Undo()
{
	if(layers.length > 1)
	{
		var _currentLayer = layers.pop();
		_currentLayer.visible = false;

		currentLayer = layers[layers.length -1];
		currentLayer.visible = true;
		queryLayer = currentLayer;

		if(_currentLayer.timeInfo.fullTimeExtent.end !== currentLayer.timeInfo.fullTimeExtent.end)
		{
			var markerDiv = document.getElementById("marker-div");
    		if(markerDiv) markerDiv.parentNode.removeChild(markerDiv);

			const fullTimeExtent = currentLayer.timeInfo.fullTimeExtent;
			// set up time slider properties
			timeSlider.fullTimeExtent = fullTimeExtent;
			timeSlider.stops = {
				interval: {
					value: 1,
					unit: "days"
				}
			};
		}
	}
}