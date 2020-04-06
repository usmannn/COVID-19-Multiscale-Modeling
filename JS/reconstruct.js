// reconstructs the network
// reruns the prediction model on updated network
// updates the feature layer (data source) with new covid-19 spread prediction data
 
function addMarkerOnSlider()
{
	var marker = "|";
	
	var scaleElement = document.getElementsByClassName("esri-slider__segment esri-slider__segment-1");		
	var eleTransform = scaleElement[0].style.transform;
	console.log(eleTransform);
	var scaleList = eleTransform.split(" ");
	var scale = scaleList[1]+scaleList[2];
	console.log(scale);
	var markerDiv = document.createElement("div");
	markerDiv.style.color = "red";
	markerDiv.style.fontSize = "32px";
	markerDiv.style.transform = scale;
	markerDiv.innerHTML = marker;
	
	scaleElement[0].parentNode.insertBefore(markerDiv, scaleElement[0].nextSibling);
}

function reconstruct(restricted_list)
{
	alert("Reconstruct the Network (not implemented)\nExcluded Countries: " + restricted_list[0] + "\nExcluded Connections: " + restricted_list[1]);
	
	addMarkerOnSlider();
	
	
	// In this feature layer, the new prediction data needs to be updated
	/*
	var layer = new FeatureLayer("https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/Dummy_COVID19_Spread_Temporal_Data/FeatureServer/0",
	{
		outFields: [ "*" ]
	});
    	*/
}
