// This is what you could consider the "central control" file

// global variables for our visualizations
//var flowDiagram = undefined;
//var scatterPlot = undefined;

//var groupedBarChart1 = undefined;
//var groupedBarChart2 = undefined;

var map = undefined;
var chordDiagram = undefined;

// only called once, to instantiate your charts
function initCharts(stations, trips, weathers, sfMap) {
    // instantiate the flow diagram, and send it the container it should exist in (.flow)
    //flowDiagram = new FlowDiagram(d3.select('.flow'), data);

    // instantiate the scatter plot, and send it the container it should exist in (.scatter)
    //scatterPlot = new ScatterPlot(d3.select('.scatter'), data);

    //groupedBarChart1 = new GroupedBarChart(d3.select("#groupedBarChart1"), data, 1);
    //groupedBarChart2 = new GroupedBarChart(d3.select("#groupedBarChart2"), data, 2);
    map = new Map(d3.select("#map"), stations, trips, sfMap);
    chordDiagram = new ChordDiagram(d3.select("#chordDiagram"), stations, trips, weathers);
}

