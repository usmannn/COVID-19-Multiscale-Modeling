// reconstructs the network
// reruns the prediction model on updated network
// updates the feature layer (data source) with new covid-19 spread prediction data
 
function addMarkerOnSlider()
{
	var marker = "|";
	var sliderTrack = document.getElementsByClassName("esri-slider__track");
	var childs = sliderTrack.childNodes;
	console.log(childs);
	console.log(sliderTrack);
	var lastChild = childs[sliderTrack.childNodes.length];
	
	var lastChildScale = lastChild.style.transform.split(" ");
	
	var markerDiv = document.createElement("div");
	markerDiv.style.color = "red";
	markerDiv.style.fontSize = "24px";
	markerDiv.style.transform = lastChildScale[2]+lastChildScale[3];
	markerDiv.innerHTML = marker;
	
	childs[1].appendChild(markerDiv);
	
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
