function ChordDiagram(svg, stations, trips, weathers) {

    var validCities = ["Mountain View", "Palo Alto", "Redwood City", 
        "San Francisco", "San Jose"],
        validMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
        validDays = [],
        stationToCity = {},
        zipToCity = {94107: "San Francisco", 94063: "Redwood City", 
            94301: "Palo Alto", 94041: "Mountain View", 95113: "San Jose"},
        cityToZip = {"San Francisco": 94107, "Redwood City": 94063, 
            "Palo Alto": 94301, "Mountain View": 94041, "San Jose": 95113},
        dateToMeanTemp = {"Mountain View": {}, "Palo Alto": {}, 
        "Redwood City": {}, "San Francisco": {}, "San Jose": {}};

    stations.forEach(function(d) {
        stationToCity[d.name] = d.city;
    });

    for (var i = 0; i < 31; i++) {
        validDays.push("" + (i + 1));
    }
/*
    weathers.forEach(function(d) {
        var cityName = zipToCity[d.zip_code];
        dateToMeanTemp[cityName][d.date] = +d.mean_temperature_f;
    })*/

    var current = this;
    //var stationFilter = crossfilter(stations);
    //var tripFilter = crossfilter(trips);

    var selectedCities = ["Mountain View"],
        stationFilter = crossfilter(stations),
        stationByCities = stationFilter.dimension(function(d) { return d.city; }),
        currentStations = [],
        filteredStations = [],
        matrix = [],
        selectedMonths = [],
        selectedDays = [],
        currentTrips = {94107: {}, 94063: {}, 
        94301: {}, 94041: {}, 95113: {}};

    var boundingBox = svg.node().getBoundingClientRect();

    //  grab the width and height of our containing SVG
    var svgHeight = boundingBox.height;
    var svgWidth = boundingBox.width;

    var margin = {
        top: 0,
        right: 40,
        bottom: 0,
        left: 40
      },
      width = svgWidth - margin.left - margin.right,
      height = svgHeight;

    this.svg = svg.append("g")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var innerRadius = height * 0.27;
    var outerRadius = height * 0.28;

    // define the tooltip behavior
    var tooltip = d3.select('#myTooltip');
    tooltip.style('display', 'none');

    // show tooltip function
    var showTooltip = function(g, i) {

        var entries = 0;
        var string = "";

        for (var j = 0; j < filteredStations.length; j++) {
            var size = matrix[i][j];

            if (size > 0) {

                if (j > 0 && string != "") {
                    string += "<br />";
                }

                string += "<strong>Start:</strong> " + filteredStations[i] + " (" + stationToCity[filteredStations[i]] + ")" + "<br />";
                string += "<strong>End:</strong> " + filteredStations[j] + " (" + stationToCity[filteredStations[j]] + ")" + "<br />";
                string += "<strong>Total # of riders:</strong> " + size + "<br />";

                entries++;
            }
        }

        if (entries > 0) {
            tooltip.style('display', 'block');

            // set the initial position of the tooltip
            tooltip.style('left', d3.event.pageX + 'px');
            tooltip.style('top', d3.event.pageY + 'px');

            tooltip.html(string);
        }

    }

    // hide tooltip function
    var hideTooltip = function() {
        tooltip.style('display', 'none');
    }

    // Returns an event handler for fading a given chord group.
    function fade(i, opacity) {
        svg.selectAll(".chord path")
            .filter(function(d) { 
                return d.source.index != i; 
            })
            .transition()
            .style("opacity", opacity);
    }

    var reference = undefined;

    this.draw = function(cities, months, days) {

        if (cities.length == 0) {
            alert("Please select at least one city.");
        } else {
            currentTrips = {};
            stationByCities.filterAll();
    
            stationByCities.filter(function(d) { 
                return cities.includes(d);
            });
    
            currentStations = [];
            filteredStations = [];
            stationByCities.top(Infinity).forEach(function(d) {
                currentStations.push(d.name);
            });
    
            var count = 0;
    
            if (cities.length > 1) {
                trips.forEach(function(d) {
                    // intersection ONLY
                    var startCity = stationToCity[d.start_station_name];
                    var endCity = stationToCity[d.end_station_name];
            
                    if (cities.includes(startCity) && cities.includes(endCity)) {
                        if (startCity != endCity) {
                            if (filteredStations.indexOf(d.start_station_name) == -1)
                                filteredStations.push(d.start_station_name);
    
                            if (filteredStations.indexOf(d.end_station_name) == -1)
                                filteredStations.push(d.end_station_name);
                        }
                    }
                });
            } else {
                filteredStations = currentStations;
            }
    
            matrix = [];
            
            for (var i = 0; i < filteredStations.length; i++) {
                matrix[i] = [];
                for (var j = 0; j < filteredStations.length; j++) {
                    matrix[i][j] = 0;
                }
            }
    
            trips.forEach(function(d) {
                var row = filteredStations.indexOf(d.start_station_name);
                var column = filteredStations.indexOf(d.end_station_name);
    
                var oneCity = true;
    
                // intersection ONLY
                if (cities.length > 1) {
                    var startCity = stationToCity[d.start_station_name];
                    var endCity = stationToCity[d.end_station_name];
        
                    if (startCity != endCity) {
                        oneCity = false;
                    }
                }
    
                if ((row != -1 && column != -1) && ((cities.length <= 1 && oneCity) || (cities.length > 1 && !oneCity))) {
                    // only filter by city
                    if (months.length == 0 && days.length == 0) {
                        if (currentTrips[d.start_date.split(" ")[0]] == undefined) {
                            currentTrips[d.start_date.split(" ")[0]] = {};
                        } 
                        currentTrips[d.start_date.split(" ")[0]][cityToZip[stationToCity[d.start_station_name]]] = d;
                        matrix[row][column] += 1;
                        count++;
                    }
                    // filter by month only
                    else if (months.length > 0 && days.length == 0) {
                        var date = d.start_date.split(" ")[0];
        
                        var month = +(date.split("/")[0]);
            
                        var monthName = validMonths[month - 1];
            
                        if (months.indexOf(monthName) != -1) {
                            if (currentTrips[d.start_date.split(" ")[0]] == undefined) {
                                currentTrips[d.start_date.split(" ")[0]] = {};
                            } 
                            currentTrips[d.start_date.split(" ")[0]][cityToZip[stationToCity[d.start_station_name]]] = d;
                            matrix[row][column] += 1;
                            count++;
                        }
                    }
                    // filter by day only
                    else if (months.length == 0 && days.length > 0) {
                        var date = d.start_date.split(" ")[0];
        
                        var day = date.split("/")[1];
            
                        if (days.indexOf(day) != -1) {
                            if (currentTrips[d.start_date.split(" ")[0]] == undefined) {
                                currentTrips[d.start_date.split(" ")[0]] = {};
                            }
                            currentTrips[d.start_date.split(" ")[0]][cityToZip[stationToCity[d.start_station_name]]] = d;
                            matrix[row][column] += 1;
                            count++;
                        }
                    }
                    // filter by both month and day
                    else {
                        var date = d.start_date.split(" ")[0];
        
                        var dateFormat = date.split("/");
                        var month = +dateFormat[0];
                        var day = dateFormat[1];
            
                        var monthName = validMonths[month - 1];
        
                        if (months.indexOf(monthName) != -1 && days.indexOf(day) != -1) {
                            if (currentTrips[d.start_date.split(" ")[0]] == undefined) {
                                currentTrips[d.start_date.split(" ")[0]] = {};
                            } 
                            currentTrips[d.start_date.split(" ")[0]][cityToZip[stationToCity[d.start_station_name]]] = d;
                            matrix[row][column] += 1;
                            count++;
                        }
                    }
                }
            });
    
            // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
            var res = d3.chord()
                .padAngle(0.05)     // padding between entities (black arc)
                .sortSubgroups(d3.descending)
                (matrix);
    
            if (count == 0) {
                alert("There's no data for this city(s), month(s), and day(s) combination.");
            } else if (count == 1) {
                alert("There's not enough data to render the graph. Please select more filters.");
            } else {
                if (reference != undefined)
                    reference.remove();
    
                reference = this.svg.append("g");
    
                // add the groups for the circle
                var group = reference.datum(res)
                    .append("g")
                    .attr("transform", "translate(" + width / 2.6 + "," + height / 2 + ")")
                    .selectAll("g")
                    .data(function(d) { return d.groups; })
                    .enter();
    
                // add the groups on the outer part of the circle
                group.append("g")
                    .append("path")
                    .style("fill", d => color(d.index))
                    .attr("stroke", d => color(d.index))
                    .attr("d", d3.arc()
                        .innerRadius(innerRadius)
                        .outerRadius(outerRadius)
                    )
                    .on("mouseover", function(d, i) { 
                        fade(i, 0.1);
                        showTooltip(d, i);
                    })
                    .on("mouseout", function(d, i) { 
                        fade(i, 1);
                        hideTooltip();
                    });
    
                // Add the links between groups
                reference.datum(res)
                    .append("g")
                    .attr("transform", "translate(" + width / 2.6 + "," + height / 2 + ")")
                    .attr("class", "chord")
                    .selectAll("path")
                    .data(function(d) { return d; })
                    .enter()
                    .append("path")
                    .attr("d", d3.ribbon().radius(innerRadius))
                    .attr("stroke", d => d3.rgb(color(d.source.index)).darker())
                    .attr("fill", d => color(d.source.index))
    
                group.append("text")
                    .each(d => {
                        d.angle = (d.startAngle + d.endAngle) / 2; 
                    })
                    .attr("font-size", 10)
                    .attr("fill", "black")
                    .attr("dy", ".35em")
                    .attr("transform", d => `
                        rotate(${(d.angle * 180 / Math.PI - 90)})
                        translate(${innerRadius + 15})
                        ${d.angle > Math.PI ? "rotate(180)" : ""}
                    `)
                    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
                    .text(d => filteredStations[d.index]);
            }
        }
    }

    this.draw(selectedCities, selectedMonths, selectedDays);

    var filterBox = this.svg.append("g")
        .attr("width", width / 3.5)
        .attr("height", height / 1.3)
        .attr("transform", "translate(" + width / 1.3 + "," + height / 8 + ")");

    filterBox.append("rect")
        .attr("width", width / 3.5)
        .attr("height", height / 1.3)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("fill", "#424242");
        
    var bWidth= 30; // rect to text
    var bHeight= 25; // rect to rect
    var x0= 20; //x offset
    var y0= 60; //y offset

    /**************** Filter by City ****************/
    var cityColor = "#0096ff";

    filterBox.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .attr("font-size", "20px")
        .attr("fill", "white")
        .text("Filter By City");

    var filterCities = filterBox.append("g")
        .selectAll("g")
        .data(validCities)
        .enter()
        .append("g")
        .attr("class", "buttonCities")
        .style("cursor","pointer")
        .on("click", cityfilterClicked);

    filterCities.append("rect")
        .attr("class", "buttonRectCities")
        .attr("x", x0)
        .attr("y", function(d, i) {
            return y0 - 15 + bHeight * i;
        })
        .attr("width", 20)
        .attr("height", 20)
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("fill", function(d) {
            if (selectedCities.includes(d))
                return cityColor;

            return "white";
        })
        .attr("stroke", "white")
        .attr("stroke-width", "2px");

    filterCities.append("text")
        .attr("class", "buttonTextCities")
        .attr("font-size", 14)
        .attr("x",function(d,i) {
            return x0 + bWidth;
        })
        .attr("y", function(d,i) { 
            return y0 + bHeight * i;
        })
        .attr("fill", "white")
        .text(function(d) {return d;})

    function cityfilterClicked(d) {
        if (!selectedCities.includes(d)) {
            d3.select(this).select(".buttonRectCities").attr("fill", cityColor);
            selectedCities.push(d);
        } else {
            d3.select(this).select(".buttonRectCities").attr("fill", "white");
            selectedCities.splice(selectedCities.indexOf(d), 1);
        }
    }

    /**************** Filter by Month ****************/
    var monthColor = "#ff9300";

    filterBox.append("text")
        .attr("x", 20)
        .attr("y", 200)
        .attr("font-size", "20px")
        .attr("fill", "white")
        .text("Filter By Month");
        
    var filterMonths = filterBox.append("g")
        .selectAll("g")
        .data(validMonths)
        .enter()
        .append("g")
        .attr("class", "buttonMonths")
        .style("cursor","pointer")
        .on("mouseover", monthfilterHover)
        .on("mouseleave", monthfilterNotHover)
        .on("click", monthfilterClick);

    filterMonths.append("rect")
        .attr("class", "buttonRectMonths")
        .attr("x", function(d, i) {
            return x0 + (bWidth + 20) * (i % 6);
        })
        .attr("y", function(d, i) {
            if (i >= 6)
                return y0 + 165 + bHeight;
            
            return y0 + 160;
        })
        .attr("width", 45)
        .attr("height", 25)
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("fill", "#424242")
        .attr("stroke", monthColor)
        .attr("stroke-width", "2px");

    filterMonths.append("text")
        .attr("class", "buttonTextMonths")
        .attr("font-size", 14)
        .attr("x",function(d,i) {
            return x0 + 10 + (bWidth + 20) * (i % 6);
        })
        .attr("y", function(d,i) { 
            if (i >= 6)
                return y0 + 182 + bHeight;
            
            return y0 + 177;
        })
        .attr("fill", monthColor)
        .text(function(d) {return d;})

    function monthfilterHover(d) {
        d3.select(this).select(".buttonRectMonths").attr("fill", monthColor);
        d3.select(this).select(".buttonTextMonths").attr("fill", "white");
    }

    function monthfilterNotHover(d) {
        if (!selectedMonths.includes(d)) {
            d3.select(this).select(".buttonRectMonths").attr("fill", "#424242");
            d3.select(this).select(".buttonTextMonths").attr("fill", monthColor);
        }
    }

    function monthfilterClick(d) {
        if (!selectedMonths.includes(d)) {
            d3.select(this).select(".buttonRectMonths").attr("fill", monthColor);
            d3.select(this).select(".buttonTextMonths").attr("fill", "white");
            selectedMonths.push(d);
        } else {
            d3.select(this).select(".buttonRectMonths").attr("fill", "#424242");
            d3.select(this).select(".buttonTextMonths").attr("fill", monthColor);
            selectedMonths.splice(selectedMonths.indexOf(d), 1);
        }
    }

    /**************** Filter by Day ****************/
    var dayColor = "#d783ff";

    filterBox.append("text")
        .attr("x", 20)
        .attr("y", 310)
        .attr("font-size", "20px")
        .attr("fill", "white")
        .text("Filter By Day");
        
    var filterDays = filterBox.append("g")
        .selectAll("g")
        .data(validDays)
        .enter()
        .append("g")
        .attr("class", "buttonDays")
        .attr("id", function(d) {return "buttonDays" + d; })
        .style("cursor","pointer")
        .on("mouseover", dayfilterHover)
        .on("mouseleave", dayfilterNotHover)
        .on("click", dayfilterClick);

    filterDays.append("rect")
        .attr("class", "buttonRectDays")
        .attr("x", function(d, i) {
            return x0 + (bWidth + 1)* (i % 10);
        })
        .attr("y", function(d, i) {
            if (i >= 10 && i <= 19)
                return y0 + 275 + bHeight;
            else if (i >= 20 && i <= 29)
                return y0 + 280 + (bHeight * 2);
            else if (i >= 30)
                return y0 + 285 + (bHeight * 3);

            return y0 + 270;
        })
        .attr("width", 25)
        .attr("height", 25)
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("fill", "#424242")
        .attr("stroke", dayColor)
        .attr("stroke-width", "2px");

    filterDays.append("text")
        .attr("class", "buttonTextDays")
        .attr("font-size", 14)
        .attr("x",function(d,i) {
            if (i >= 9 && i <= 18)
                return x0 + 7 + (bWidth + 1) * (i % 10);
            else if (i >= 19 && i <= 29)
                return x0 + 5 + (bWidth + 1) * (i % 10);
            else if (i >= 30)
                return x0 + 6 + (bWidth + 1) * (i % 10);

            return x0 + 8 + (bWidth + 1) * (i % 10);
        })
        .attr("y", function(d,i) { 
            if (i >= 10 && i <= 19)
                return y0 + 293 + bHeight;
            else if (i >= 20 && i <= 29)
                return y0 + 298 + (bHeight * 2);
            else if (i >= 30)
                return y0 + 303 + (bHeight * 3);
            
            return y0 + 288;
        })
        .attr("fill", dayColor)
        .text(function(d) {return d;});

    function dayfilterHover(d) {
        d3.select(this).select(".buttonRectDays").attr("fill", dayColor);
        d3.select(this).select(".buttonTextDays").attr("fill", "white");
    }

    function dayfilterNotHover(d) {
        if (!selectedDays.includes(d)) {
            d3.select(this).select(".buttonRectDays").attr("fill", "#424242");
            d3.select(this).select(".buttonTextDays").attr("fill", dayColor);
        }
    }

    function dayfilterClick(d) {
        if (!selectedDays.includes(d)) {
            d3.select(this).select(".buttonRectDays").attr("fill", dayColor);
            d3.select(this).select(".buttonTextDays").attr("fill", "white");
            selectedDays.push(d);
        } else {
            d3.select(this).select(".buttonRectDays").attr("fill", "#424242");
            d3.select(this).select(".buttonTextDays").attr("fill", dayColor);
            selectedDays.splice(selectedDays.indexOf(d), 1);
        }
    }

    /**************** Reset & Filter ****************/
    var dayColor = "#d783ff";

    var resetBox = filterBox.append("g")
        .style("cursor","pointer")
        .on("mouseover", resetHover)
        .on("mouseleave", resetNotHover)
        .on("click", resetClick);
    
    resetBox.append("rect")
        .attr("class", "buttonRectReset")
        .attr("x", 65)
        .attr("y", 600)
        .attr("width", 80)
        .attr("height", 40)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("fill", "#424242")
        .attr("stroke", "white")
        .attr("stroke-width", "2px");

    resetBox.append("text")
        .attr("class", "buttonTextReset")
        .attr("x", 79)
        .attr("y", 627)
        .attr("font-size", "20px")
        .attr("fill", "white")
        .text("Reset");

    var filterBox = filterBox.append("g")
        .style("cursor","pointer")
        .on("mouseover", filterHover)
        .on("mouseleave", filterNotHover)
        .on("click", filterClick);
    
    filterBox.append("rect")
        .attr("class", "buttonRectFilter")
        .attr("x", 190)
        .attr("y", 600)
        .attr("width", 80)
        .attr("height", 40)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("fill", "#424242")
        .attr("stroke", "white")
        .attr("stroke-width", "2px");

    filterBox.append("text")
        .attr("class", "buttonTextFilter")
        .attr("x", 208)
        .attr("y", 627)
        .attr("font-size", "20px")
        .attr("fill", "white")
        .text("Filter");

    function resetHover(d) {
        d3.select(this).select(".buttonRectReset").attr("fill", "white");
        d3.select(this).select(".buttonTextReset").attr("fill", "black");
    }

    function resetNotHover(d) {
        d3.select(this).select(".buttonRectReset").attr("fill", "#424242");
        d3.select(this).select(".buttonTextReset").attr("fill", "white");
    }
    function resetClick(d) {
        d3.selectAll(".buttonRectCities").attr("fill", "white");

        d3.selectAll(".buttonRectMonths").attr("fill", "#424242");
        d3.selectAll(".buttonTextMonths").attr("fill", monthColor);

        d3.selectAll(".buttonRectDays").attr("fill", "#424242");
        d3.selectAll(".buttonTextDays").attr("fill", dayColor);

        selectedCities = ["Mountain View"];
        selectedMonths = [];
        selectedDays = [];
        filterClick();

        d3.select(".buttonRectCities").attr("fill", cityColor);
    }

    function filterHover(d) {
        d3.select(this).select(".buttonRectFilter").attr("fill", "white");
        d3.select(this).select(".buttonTextFilter").attr("fill", "black");
    }

    function filterNotHover(d) {
        d3.select(this).select(".buttonRectFilter").attr("fill", "#424242");
        d3.select(this).select(".buttonTextFilter").attr("fill", "white");
    }

    function filterClick() {
        current.draw(selectedCities, selectedMonths, selectedDays);
        par.remove();
        drawParallel(currentTrips);
    }

    drawParallel(currentTrips);
}