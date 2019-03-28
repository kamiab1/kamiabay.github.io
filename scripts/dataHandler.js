var url1 = "./data/station.csv";
var url2 = "./data/trip.csv";
var url3 = "./data/weather.csv";
var url4 = "./data/bay_area_cities.geojson";

var q = d3_queue.queue(1)
  .defer(d3.csv, url1)
  .defer(d3.csv, url2)
  .defer(d3.csv, url3)
  .defer(d3.json, url4)
  .awaitAll(draw);

function draw(error, data) {

    // important: First argument it expects is error
    if (error) throw error;

    var stationNames = [];

    data[0].forEach(function(d) {
        stationNames.push(d.name);
        /*
        if (d.city == "San Francisco")
            stationNames.push(d.name);*/
    });

    var filteredTrips = [];

    data[1].forEach(function(d) {
        var row = stationNames.indexOf(d.start_station_name);
        var column = stationNames.indexOf(d.end_station_name);

        if (row != -1 && column != -1) {
            filteredTrips.push(d);
        }
    });

    initCharts(data[0], data[1], data[2], data[3]);
}
