class GeoMap {

    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 1100,
        containerHeight: _config.containerHeight || 660,
        margin: _config.margin || {top: 30, right: 0, bottom: 10, left: 0},
        tooltipPadding: 10,
        legendBottom: 50,
        legendLeft: 50,
        legendRectHeight: 12, 
        legendRectWidth: 150
      }
      this.data = _data;
      this.initVis();
    }
    
  
    initVis() {
      let vis = this;
  
      // Defining chart area size
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      // Defining svg area
      vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);
  
      // Appending group element for map
      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
      // Defining scale and translating map projection to center of area
      vis.projection = d3.geoAlbersUsa() 
      .scale(1000)
      .translate([vis.width / 2, vis.height / 2]);
      vis.geoPath = d3.geoPath().projection(vis.projection);
      
      // Not using pure black and pure white 
      vis.colorScale = d3.scaleLinear()
        .range(['#d1d1d1', '#1f1f1f'])
        .interpolate(d3.interpolateHcl);
  
      // Initializing gradient
      vis.linearGradient = vis.svg.append('defs').append('linearGradient')
          .attr("id", "legend-gradient");
  
      // Appending legend
      vis.legend = vis.chart.append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${vis.config.legendLeft},${vis.height - vis.config.legendBottom})`);
      
      vis.legendRect = vis.legend.append('rect')
          .attr('width', vis.config.legendRectWidth)
          .attr('height', vis.config.legendRectHeight);
  
      vis.legendTitle = vis.legend.append('text')
          .attr('class', 'legend-title')
          .attr('dy', '.35em')
          .attr('y', -10)
          .text('Death penalties')
      
      // Appending title
      vis.title = vis.svg.append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '0.5em')
          .attr('dx', '0.3em')
          .attr('class', 'chartTitle')
          .style('alignment-baseline', 'before-edge')
          .text('Number of Convicts in each US State');
  
      vis.updateVis();
    }

    updateData(newData) {
      this.data = newData;
      this.updateVis();
    }

    updateVis() {
      let vis = this;
    
      const popDensityExtent = d3.extent(vis.data.objects.states.geometries, d => d.properties.pop_density);
    
      // Updating colour scale for updated domain
      vis.colorScale.domain(popDensityExtent);
    
      // Defining gradiant
      vis.legendStops = [
        { color: '#d1d1d1', value: popDensityExtent[0], offset: 0},
        { color: '#1f1f1f', value: popDensityExtent[1], offset: 100},
      ];
    
      vis.renderVis();
    }
    
  
  
    renderVis() {
      let vis = this;
  
      // Converting compressed TopoJSON to GeoJSON format
      const states = topojson.feature(vis.data, vis.data.objects.states)
  
      // Defining the scale of the projection so that the geometry fits within the SVG area
      vis.projection.fitSize([vis.width, vis.height], states);
  
      // Appending map
      const countryPath = vis.chart.selectAll('.country')
          .data(states.features)
        .join('path')
          .attr('class', 'country')
          .attr('d', vis.geoPath)
          .attr('fill', d => {
            if (d.properties.pop_density) {
              return vis.colorScale(d.properties.pop_density);
            } else {
              return 'url(#lightstripe)';
            }
          });
  
      // Adding tooltips 
      countryPath
          .on('mousemove', (event,d) => {
            const popDensity = d.properties.pop_density ? `<strong>${d.properties.pop_density}</strong> Death penalties` : 'No data available'; 
            d3.select('#tooltip')
              .style('display', 'block')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
              .html(`
                <div class="tooltip-title">${d.properties.name}</div>
                <div>${popDensity}</div>
              `);
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('display', 'none');
          });
  
      // Adding legend labels
      vis.legend.selectAll('.legend-label')
          .data(vis.legendStops)
        .join('text')
          .attr('class', 'legend-label')
          .attr('text-anchor', 'middle')
          .attr('dy', '.35em')
          .attr('y', 20)
          .attr('x', (d,index) => {
            return index == 0 ? 0 : vis.config.legendRectWidth;
          })
          .text(d => Math.round(d.value * 10 ) / 10);
  
      // Updating gradient for legend
      vis.linearGradient.selectAll('stop')
          .data(vis.legendStops)
        .join('stop')
          .attr('offset', d => d.offset)
          .attr('stop-color', d => d.color);
  
      vis.legendRect.attr('fill', 'url(#legend-gradient)');
    }
  }