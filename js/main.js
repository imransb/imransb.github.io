$(document).ready(function() {
	var globalDateString = "";
	var countries;
	var map = L.map('map', {
		center: [12,3],
		zoom: 5,
		minZoom: 5,
		maxZoom:5
	});
	var last={};

	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);

	$.getJSON("data/map.json")
		.done(function(data){
			var info = processData(data);
			createPropSymbols(info.timestamps, data);
			createLegend();
			createSlider(info.timestamps);
		})
		.fail(function(){ alert("Serious wahala")});

function processData(data){
  var dates = [];
  for (var feature in data.features){
    var properties = data.features[feature].properties;

    for(var attribute in properties) {
      if(attribute != "id" && attribute != "name"){
        var timestamp=Date.parse(attribute);
        if (isNaN(timestamp)==false){
            dates.push(new Date(timestamp));
          }
      } 
    }
  }
  //console.log(dates);
  var maxDate=new Date(Math.max.apply(null,dates));
  var minDate=new Date(Math.min.apply(null,dates));
  return { //BE SURE TO PASS IN ALL THE DATA, PREDICTIONS INCLUDED 
    timestamps : dates,
    min : minDate,
    max : maxDate
  }
}

function createPropSymbols(timestamps, data){
	//dateString = getDateString(timestamps[0]);
	countries = L.geoJson(data, {style: style}).addTo(map);
	updatePropSymbols(timestamps[0]);

}
function isValidDate(d) {
  if ( Object.prototype.toString.call(d) !== "[object Date]" )
    return false;
  return !isNaN(d.getTime());
}

function updatePropSymbols(date){
	if(isValidDate(date)){	
		countries.eachLayer(function(layer){
		//console.log(layer.feature.properties.name);	
		var cases = layer.feature.properties[date.yyyymmdd()];	
			if(cases){
				layer.setStyle({fillColor: getColor(cases)})
				last[layer.feature.properties.name] = cases; //Something wrong, the last is not specific to a country; Now it is
			}else
				layer.setStyle({fillColor:getColor(last[layer.feature.properties.name])});
			});
}

}

function style(feature){
	return {
			//fillColor: getColor(feature.properties[dateString]),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7

		}

}
 Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + "-"+ (mm[1]?mm:"0"+mm[0]) + "-"+(dd[1]?dd:"0"+dd[0]); // padding
  };

function createLegend(){
	var legend = L.control({position: 'bottomleft'});

	legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10, 50, 100, 1000, 2000, 5000, 10000],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);
}


function getColor(d) {
    return d > 10000 ? '#800026' :
           d > 5000  ? '#BD0026' :
           d > 2000  ? '#E31A1C' :
           d > 1000  ? '#FC4E2A' :
           d > 100   ? '#FD8D3C' :
           d > 50   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
}

function createSlider(timestamps){
var sliderControl = L.control({ position: 'bottomright'} );
		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create("input", "range-slider");
	
			L.DomEvent.addListener(slider, 'mousedown', function(e) { 
				L.DomEvent.stopPropagation(e); 
			});
			$(slider)
				.attr({'type':'range', 
					'max': Date.parse(timestamps[timestamps.length-1]), // Convert date to timestamp as in number
					'min': Date.parse(timestamps[0]), 
					'step': 86400000, // Number of milliseconds in a week
					'value': Date.parse(timestamps[0])})
		  		.on('input change', function() {
		  		updatePropSymbols(new Date(parseInt($(this).val()))); // Convert timestamp back to date to query json
		  		$(".temporal-legend").text(new Date(parseInt(this.value))); // Text On Slider
		  	});
			return slider;
		}

		sliderControl.addTo(map); 
		createTemporalLegend(timestamps[0]);		
}
function createTemporalLegend(startTimestamp){
	var temporalLegend = L.control({position:'bottomright'});
	temporalLegend.onAdd = function(map){
		var output = L.DomUtil.create("output", "temporal-legend");
		$(output).text(startTimestamp)
		return output;
	}
	temporalLegend.addTo(map);
}

   // GRAPH 
    var linecolorobj = {};
    linecolorobj['movement'] = {'movement':'#79002B','movement forecast':'#af6680'};
    linecolorobj['worldpop'] = {'worldpop':'#ff8831','worldpop forecast':'#ffb883'};
    linecolorobj['previouscase'] = {'previouscase':'#c52f3f','previouscase forecast':'#dc828c'};
    //linecolorobj['all'] = {'All':'#003c81','All Forecast':'#668ab3'};
    var chart = c3.generate({
        bindto: '#chart',
        size: { height: 500 },
        padding: { right: 35, bottom: 42, left: 70 },
        point: { show: false },
        data: { 
        	x: 'week', 
        	colors: linecolorobj['movement'], 
        	url: 'csv/movement.csv', type: 'area'},
        	legend: {show: false},
        	axis :
        	 { x : 
        	 	{ 
        	 		type : 'timeseries', 
        	 		tick: 
        	 			{ 
        	 				fit: false, 
        	 				count: 2, 
        	 				format: "%m/%d/%y"
        	 			}, 
        	 		height: 77
        	 	}
        	 }
    });
    var accuracy = {};
    accuracy["movement"] = "16.2%";
    accuracy["worldpop"] = "8%";
    accuracy["previouscase"] = "22.14%";

    $('#radioButtons').on('change', 'input[name=optionsRadios]:radio', function (e) {
    var source = $(this).attr('id');
    var csvfile = 'csv/' + source + '.csv';
    $('.accuracy').text('Percentage Difference: '+accuracy[source]);
    c3.generate({
            bindto: '#chart',
            size: { height: 500 },
            padding: { right: 35, bottom: 21, left: 70 },
            point: { show: false },
            data: { x: 'week', colors: linecolorobj[source], url: csvfile, type: 'area'},
            legend: { show: false},
            axis : { x : { type : 'timeseries', tick: { fit: false, count: 2, format: "%m/%d/%y"}, height: 77}}
        });
    console.log(linecolorobj[source]);
    });

})
  