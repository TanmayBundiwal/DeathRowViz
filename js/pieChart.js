class PieChart {

  constructor(_config, _data) {
    this.config = {
        parentElement: _config.parentElement,
        containerWidth: 600,
        containerHeight: 350,
        tooltipPadding: 15,
        margin: {top: 50, right: 250, bottom: 20, left: 0},
      legendWidth: 120,
      legendHeight: 8,
      legendRadius: 5
      }
      this.data = _data;
      this.initVis();
  }
  
  initVis() {
    let vis = this;

    // Calculate container width and height 
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    vis.chartRadius = Math.min(vis.width, vis.height) / 2;

    // Initialize color scale for pie chart 
    vis.raceData = d3.rollups(vis.data, v => v.length, d => d.race);
    vis.raceDomain = vis.raceData.sort((a, b) => b[0] - a[0]);
    vis.raceDomain = vis.raceDomain.map(d => d[0]);
    vis.raceDomain = vis.raceDomain.sort();

    // Had to make domain static as we wanted to maintain the colours for each race even when filtering the data 
    vis.colorScale = d3.scaleOrdinal()
      .domain(vis.raceDomain)
      .range(['#000fff', '#fad000', '#dc7633', '#633974', '#009900', '#bf2c34']);

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
      .attr('class', 'chart')
      .attr('transform', `translate(${vis.config.margin.left + (vis.width / 2)},${vis.config.margin.top + (vis.height/2)})`);

    vis.arcGenerator = d3.arc()
      .innerRadius(0)
      .outerRadius(vis.chartRadius);

    // Append chart title
    vis.title = vis.svg.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('dx', '0.5em')
      .attr('dy', '0.3em')
      .attr('class', 'chartTitle')
      .style('alignment-baseline', 'before-edge')
      .text('Proportion of Races Among Incarcerated');
    
    // Append group for legend 
    vis.legend = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left + vis.width},${vis.config.containerHeight / 2})`);

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    // Group disasters by race 
    vis.raceData = d3.rollups(vis.data, v => v.length, d => d.race);

    vis.pie = d3.pie().value(function(d) {
      return d[1];
    });

    vis.pieData = vis.pie(vis.raceData);

    vis.renderVis();
    vis.renderLegend();
}

  renderVis() {
    let vis = this;

    let wedgeGroups = vis.chartArea.selectAll('.wedgeGroups')
      .data(vis.pieData)
      .join('g')
        .attr('class', 'wedgeGroups');

    // Render wedges for the pie chart
    let wedges = wedgeGroups.selectAll('.wedge')
    .data(d => [d])
    .join('path')
      .attr('class', d => {
        if (raceFilter.includes(d.data[0])) {
          return 'wedge wedge-active';
        } else {
          return 'wedge';
        }
      })
      .attr('fill', function(d) {
        return vis.colorScale(d.data[0]);
      })
      .attr('d', vis.arcGenerator)
    // Add tooltip for pie chart 
    .on('mouseover', (event, d) => {
        d3.select('#tooltip')
          .style('display', 'block')
          .html(`
          <div class='tooltip-title'>${d.data[0]}</div>
          <div>Count: ${d.data[1]}</div>
          `);
      })
      .on('mousemove', (event) => {
        d3.select('#tooltip')
          .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
          .style('top', (event.pageY + vis.config.tooltipPadding) + 'px');
      })
      .on('mouseleave', () => {
        d3.select('#tooltip').style('display', 'none');
      });

    // Add click interactivity to the pie chart wedges to filter the data
    wedges.on('click', function(event, d) {
      const isActive = raceFilter.includes(d.data[0]);
      if (isActive) {
        raceFilter = raceFilter.filter(f => f !== d.data[0]);
      } else {
        raceFilter.push(d.data[0]);
      }
      filterRaceData();
      d3.select(this).classed('wedge-active', !isActive);
    })
  }

  renderLegend() {

    let vis = this;

    // Create array that represents the legend values and their respective categories
    let legendData = vis.raceData.map(d => d[0]);

    // Create groups for each legend entry 
    const entry = vis.legend.selectAll('.legend-entry')
        .data(legendData)
      .join('g')
        .attr('class', 'legend-entry')
        .attr('transform', (d, index) => {
          let x = 0;
          if (index % 2 != 0) {
            x = vis.config.legendWidth;
          }
          let y = Math.floor(index / 2) * (vis.config.legendHeight + 8);
          return `translate(${x},${y})`;
        });

    // Create legend entry label
    const entryLabel = entry.selectAll('.legend-entry-label')
      .data(d => [d])
        .join('text')
        .attr('class', 'legend-entry-label')
        .style('alignment-baseline', 'before-edge')
        .attr('x', 12)
        .text(d => d);

    // Render the circle that represents the corresponding color in the pie chart for each race category
    const colorLabel = entry.selectAll('.legend-entry-circle')
      .data(d => [d])
        .join('circle')
        .attr('class', 'legend-entry-circle')
        .attr('cy', vis.config.legendHeight)
        .attr('fill', d => vis.colorScale(d))
        .attr('r', vis.config.legendRadius);
  }
}