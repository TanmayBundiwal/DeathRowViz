class Barchart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 350,
      tooltipPadding: 15,
      margin: _config.margin || {top: 60, right: 20, bottom: 40, left: 50}
    }
    this.data = _data;
    this.initVis();
  }
  
 
  initVis() {

    let vis = this;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Initialize scales
    vis.xScale = d3.scaleLinear()
        .range([0, vis.width]);

    vis.yScale = d3.scaleBand()
        .range([0, vis.height])
        .paddingInner(0.15);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(6)
        .tickSizeOuter(0);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .tickSizeOuter(0);

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);
    
    // Append y-axis group 
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');

    // Append chart title
    vis.title = vis.svg.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('class', 'chartTitle')
      .attr('dy', '0.5em')
      .attr('dx', '0.3em')
      .style('alignment-baseline', 'before-edge')
      .text('Male vs Female Conviction Rates');
    
    // Append x-axis label  
    vis.xAxisTitle = vis.svg.append('text')
          .attr('x', vis.config.margin.left + vis.width)
          .attr('y', vis.config.containerHeight - vis.config.margin.bottom)
          .attr('dy', '1.8em')
          .attr('class', 'axis-title')
          .style('text-anchor', 'end')
          .style('alignment-baseline', 'before-edge')
          .text('Count');
    
    // Append y-axis label
    vis.yAxisTitle = vis.svg.append('text')
          .attr('x', vis.config.margin.left)
          .attr('y', vis.config.margin.top)
          .attr('class', 'axis-title')
          .style('text-anchor', 'end')
          .attr('dx', '-0.3em')
          .style('alignment-baseline', 'before-edge')
          .text('Gender');

    vis.updateVis();
  }


  updateVis() {
    let vis = this;

    // Filter the data to count the number of data points for each gender
    vis.maleCount = vis.data.filter(d => d.gender === "Male").length;
    vis.femaleCount = vis.data.filter(d => d.gender === "Female").length;

    // Get all distinct values of the race attribute
    vis.genderValues = d3.rollups(vis.data, v => v.length, d => d.gender);

    // Create data to use for the barchart
    vis.genderData = [];
    for (let i = 0; i < vis.genderValues.length; i++) {
      let genderObject = {
        gender: vis.genderValues[i][0],
        count: vis.genderValues[i][1]
      }
      vis.genderData.push(genderObject);
    }

    // Set the scale input domains

    // The x domain is the sum of the male and female count so that, when filtering on a race, the male bar (which has the highest count) will also 
    // shift a bit (not just the axes will update), to make it easier to see that the chart actually updated
    vis.xScale.domain([0, (vis.maleCount + vis.femaleCount)])
    vis.genderDomain = vis.genderData.map(d => d.gender);
    vis.yScale.domain(vis.genderDomain);

    vis.renderVis();
}


  renderVis() {
    let vis = this;

    let barsGroups = vis.chart.selectAll('.bar-group')
        .data(vis.genderData)
        .join('g')
        .attr('class', 'bar-group');


    // Add rectangles
    let bars = barsGroups.selectAll('.bar')
        .data(d => [d])
      .join('rect')
        .attr('class', d => {
          if (genderFilter.includes(d.gender)) {
            return 'bar bar-active';
          } else {
            return 'bar';
          }
        })
        .attr('width', d => vis.xScale(d.count))
        .attr('height', vis.yScale.bandwidth())
        .attr('y', d => vis.yScale(d.gender))
        .attr('x', 0)
        .attr('fill', d => {
          if (d.gender === "Male") {
              return "steelblue";
          } else if (d.gender === "Female") {
              return "pink";
          } else {
            return "grey";
          }
        })
        // Add tooltip for bar chart
        .on('mouseover', (event, d) => {
          d3.select('#tooltip')
            .style('display', 'block')
            .html(`
            <div class='tooltip-title'>${d.gender}</div>
            <div>Count: ${d.count}</div>
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

    // Add click interactivity to the bars to filter the data on the gender attribute
    bars.on('click', function(event, d) {
      const isActive = genderFilter.includes(d.gender);
      if (isActive) {
        genderFilter = genderFilter.filter(f => f !== d.gender);
      } else {
        genderFilter.push(d.gender);
      }
      filterGenderData();
      d3.select(this).classed('bar-active', !isActive);      
    })
        
    
    // Update the axes because the underlying scales might have changed
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}