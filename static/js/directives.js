'use strict';

app.directive('donutpercent', function() {
    var link = function(scope, element, attrs) {
        d3.select('donutpercent').append('svg');
        var svg = d3.selectAll("svg");
        console.log(svg)
        svg.append('circle')
        .attr('cx', 1)
        .attr('cy', 1)
        .attr('r', 20)
    };

    return {
        restrict: 'E',
        link: link
    }
});