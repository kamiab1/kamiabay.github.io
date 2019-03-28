
function Map(svg, stations, trips, sfMap) {

    var stationNames = [];

    stations.forEach(function(d) {
        stationNames.push(d.name);
    });

    var boundingBox = svg.node().getBoundingClientRect();

    //  grab the width and height of our containing SVG
    var height = boundingBox.height;
    var width = boundingBox.width;
    
    var validCities = ["San Jose", "Redwood City", "Mountain View", 
        "Palo Alto", "San Francisco"];

    var dockPerCity = {};
    var latLng = {};

    stations.forEach(function(d, i) {
        d.dock_count = +d.dock_count;
        d.long = +d.long;
        d.lat = +d.lat;
        if (dockPerCity[d.city] == undefined)
            dockPerCity[d.city] = d.dock_count;
        else
            dockPerCity[d.city] += d.dock_count;

        latLng[d.name] = [d.long, d.lat];
    });

    var toFromKeys = [];
    var toFrom = [];

    trips.forEach(function(d) {
        if (!toFromKeys.includes(d.start_station_name + d.end_station_name)) {
            toFromKeys.push(d.start_station_name + d.end_station_name);
            toFrom.push([d.start_station_name, d.end_station_name]);
        }
    });
    
    // D3 Projection
    var projection = d3.geoMercator()
    .translate([width/3, height/3])    // translate to center of screen
    .center(d3.geoCentroid(sfMap))
    .scale(40000);

    var path = d3.geoPath()
        .projection(projection);

    // color scale for the legend
    var color = d3.scaleOrdinal(d3.schemeBlues[5]);

    // define the tooltip behavior
    var tooltip = d3.select('#myTooltip');
    tooltip.style('display', 'none');

    // show tooltip function
    var showTooltip = function(d) {
        // make sure our tooltip is going to be displayed
        if (validCities.includes(d.properties.city)) {
            tooltip.style('display', 'block');

            // set the initial position of the tooltip
            tooltip.style('left', d3.event.pageX + 'px');
            tooltip.style('top', d3.event.pageY + 'px');

            tooltip.html("<strong>" + d.properties.city + "</strong>");
        }
    }

    // hide tooltip function
    var hideTooltip = function(d) {
        tooltip.style('display', 'none');
    }

    // create and append the map of the US
    var map = svg.selectAll('path')
        .data(sfMap.features)
        .enter()
        .append('path')
        .attr("class", function(d) {return d.properties.city;})
        .attr('d', path)
        .attr("fill", function(d){
            if (validCities.includes(d.properties.city))
                return color(dockPerCity[d.properties.city]);

            return "#EDF1F0";
        })/*
        .attr("opacity", function(d) {
            if (!validCities.includes(d.properties.city))
                return 0;

            return 1;
        })*/
        .style('stroke', function(d){
            if (validCities.includes(d.properties.city))
                return "black";

            return "#EDF1F0";
        })
        .style('stroke-width', 0.75)
        .on("mouseover", showTooltip)
        .on("mouseleave", hideTooltip);

    svg.selectAll("circle")
        .data(stationNames)
        .enter()
        .append("circle")
        .attr("cx", function (d) { 
            return projection(latLng[d])[0]; 
        })
        .attr("cy", function (d) { 
            return projection(latLng[d])[1]; 
        })
        .attr("r", "2px")
        .attr("fill", "red");

//     svg.selectAll("line")
//         .data(toFrom)
//         .enter()
//         .append("line")
//         .attr("stroke", "#ffd479")
//         .attr("x1", function(d) {
//             return projection(latLng[d[0]])[0];
//         })
//         .attr("y1", function(d) {
//             return projection(latLng[d[0]])[1];
//         })
//         .attr("x2", function(d) {
//             return projection(latLng[d[1]])[0];
//         })
//         .attr("y2", function(d) {
//             return projection(latLng[d[1]])[1];
//         });
 }
