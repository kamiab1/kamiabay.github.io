var par;

function drawParallel(currentTrips) {

    // var data = [];
    //
    // Object.entries(currentTrips).forEach(([key, value]) => {
    //     var keys = Object.keys(value);
    //     for (var i = 0; i < keys.length; i++) {
    //         data.push(value[keys[i]]);
    //     }
    // });


    var svg = d3.select("#parallel");
    var boundingBox = svg.node().getBoundingClientRect();

    //  grab the width and height of our containing SVG
    var svgHeight = boundingBox.height;
    var svgWidth = boundingBox.width;
    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 100, bottom: 10, left: 100},
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;
    var y = {};
//var data1 = 'https://gist.githubusercontent.com/Jerdak/5d37e36603bd4397ac51fe5032bcfe3e/raw/f07ba5cfb9c5bd6e423c304d2b25ee12620ed233/cars.csv';
    var foreground;
// append the svg object to the body of the page
    par = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    var dimensions = null;

    // Parse the Data
    d3.csv('data/weather.csv', function (data) {
    x = d3.scalePoint()
        .range([0, width]);

    x.domain(dimensions = d3.keys(data[0]).filter(function (d) {
        return d !== 'date' && (y[d] = d3.scaleLinear()
            .domain(d3.extent(data, function (p) {
                return  +p[d];
            }))
            .range([height, 0]));
    }));
    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {
        return d3.line()(dimensions.map(function (p) { return [x(p), y[p](d[p])];}));
    }



    var keys = Object.keys(currentTrips);
    // Add blue foreground lines for focus.
    foreground = par.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", path)
        .style("fill",'none' )
        .style("stroke", 'blue');

    // Draw the lines

    //
    //"start_date" && d !== "start_station_name" && d !== "end_date" && d !== "end_station_name"
    //             && d !== "subscription_type"
    //



    // Draw the axis:
    var g = par.selectAll(".dimension")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "dimension")
        .attr("transform", function (d) { return "translate(" + x(d) + ")";});

    g.append("g")
        .attr("class", "axis")
        .each(function (d) {
            d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d]));
        })
        .append("text")
        .attr("font-family", "Quicksand")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function (d) {
            return d;
        })
        .style("fill", "black");

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(y[d].brush = d3.brushY()
                .extent([[-10,0], [10,height]])
                .on("brush", brush)
                .on("end", brush)
            )
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);


    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        var actives = [];
        svg.selectAll(".brush")
            .filter(function(d) {
                y[d].brushSelectionValue = d3.brushSelection(this);
                return d3.brushSelection(this);
            })
            .each(function(d) {
                // Get extents of brush along each active selection axis (the Y axes)
                actives.push({
                    dimension: d,
                    extent: d3.brushSelection(this).map(y[d].invert)
                });
            });
        var selected = [];
        // Update foreground to only display selected values
        foreground.style("display", function(d) {
            return actives.every(function(active) {
                let result = active.extent[1] <= d[active.dimension] && d[active.dimension] <= active.extent[0];
                if(result)selected.push(d);
                return result;
            }) ? null : "none";
        });

    }


    });

}
drawParallel();