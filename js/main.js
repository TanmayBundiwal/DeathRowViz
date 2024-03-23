// Initialize helper function to convert date strings to date objects
const parseTime = d3.timeParse("%m/%d/%Y");

let raceFilter = [];

let genderFilter = [];

let yearFilter = [];

let data, pieChart, barChart, geoMap, geoData;

const usedAttributes = ['state', 'sentencing_date', 'sentencing_year', 'race', 'County', 'gender']

//Load data from CSV file asynchronously and render chart
d3.csv('data/the-condemed-data.csv').then(_data => {
  _data.forEach(d => {
    d.race = d.race.trim();
    d.sentencing_year = +d.sentencing_year;
    d.sentencing_date = parseTime(d.sentencing_date);
    d.gender = d.gender ? d.gender : 'Other';
    d.volunteer_execution = processBinaryAttribute("volunteer_execution", d);
    d.died = processBinaryAttribute("died", d);
    d.suicide = processBinaryAttribute("suicide", d);
    d.commuted = processBinaryAttribute("commuted", d);
    d.exonerated = processBinaryAttribute("exonerated", d);
    d.resentenced = processBinaryAttribute("resentenced", d);
    d.released = processBinaryAttribute("released", d);
  });

  data = _data;
  // We initially start off with the year starting on 1976.
  yearFilter = [1976, 1976 + 3]
  data1976 = data.filter(d => checkYear(d));

  // Initialize and show bar chart
  barChart = new Barchart({ parentElement: '#barchart'}, data1976);

  //Initialize and show pie chart
  pieChart = new PieChart({
    parentElement: '#piechart',
  }, data1976);
});

function processBinaryAttribute(attribute, item) {
    if (item[attribute] == "Y") {
        return true;
    } else {
        return false;
    }
}

//Map

function updateMap(startYear, geoData, countyData) {

  const filteredData = countyData.filter(d => +d["year"].split('-')[0] === startYear);
  
  // Combine both datasets by adding the population density to the TopoJSON file
  geoData.objects.states.geometries.forEach(d => {
    d.properties.pop_density = undefined;
    for (let i = 0; i < filteredData.length; i++) {
      if (d.properties.name == filteredData[i].region) {
        d.properties.pop_density = +filteredData[i].pop_density;
      }
    }
  });

  // Create GeoMap object and update the map
  geoMap = new GeoMap({
    parentElement: '#geochart'
  }, geoData);

  return geoMap;
}


function fetchData() { //To make sure we are only fetching once
  return Promise.all([
    d3.json('data/states.json'),
    d3.csv('data/interactive-data.csv')
  ]);
}

fetchData()   
  .then(data => {
    geoData = data[0];
    countyData = data[1];

    const startYear = 1976;

    geoMap = updateMap(startYear, geoData, countyData);
  })
  .catch(error => console.error(error));
  
// Filter and update bar and geo chart when specific category is picked
function filterRaceData() {
  if (raceFilter.length == 0 && yearFilter.length == 0) {
    barChart.data = data;
  } else if (raceFilter.length == 0 && yearFilter.length != 0) {
    barChart.data = data.filter(d => checkYear(d));
  } else if (raceFilter.length != 0 && yearFilter.length == 0) {
    barChart.data = data.filter(d => raceFilter.includes(d.race));
  } else {
    barChart.data = data.filter(d => raceFilter.includes(d.race) && checkYear(d));
  }
  barChart.updateVis();
}

//Filter and update pie and geo chart when specific category is picked
function filterGenderData() {
  if (genderFilter.length == 0 && yearFilter.length == 0) {
    pieChart.data = data;
  } else if (genderFilter.length == 0 && yearFilter.length != 0) {
    pieChart.data = data.filter(d => checkYear(d));
  } else if (genderFilter.length != 0 && yearFilter.length == 0) {
    pieChart.data = data.filter(d => genderFilter.includes(d.gender));
  } else {
    pieChart.data = data.filter(d => genderFilter.includes(d.gender) && checkYear(d));
  }
  pieChart.updateVis();
}

// Filters the bar, geo, and pie chart based on the year specified by the UI slider 
function filterYearData() {
  if (yearFilter.length == 0 && genderFilter.length == 0) {
    pieChart.data = data;
  } else if (genderFilter.length != 0) {
      pieChart.data = data.filter(d => checkYear(d) && genderFilter.includes(d.gender));
  } else {
      pieChart.data = data.filter(d => checkYear(d));
  }
  pieChart.updateVis();
}

// Filters the bar, geo, and pie chart based on the year specified by the UI slider 
function filterYearData2() {
  if (yearFilter.length == 0 && raceFilter.length == 0) {
    barChart.data = data;
  } else if (raceFilter.length != 0) {
      barChart.data = data.filter(d => checkYear(d) && raceFilter.includes(d.race));
  } else {
      barChart.data = data.filter(d => checkYear(d));
  }
  barChart.updateVis();
}

// Used to check whether a data point falls between the specified years 
function checkYear(d) {
  return d.sentencing_year <= yearFilter[1] && d.sentencing_year >= yearFilter[0]
}

 
//SLIDER
const svg = d3.select('svg');

// Initialize year variable
let year = 1976;

// Function to update the label with the selected year
function updateLabel() {
    d3.select('#value').text(year);
    
    // Fetch data from presidents.csv
    d3.csv('data/presidents.csv').then(function(data) {
        // Filter the data for the selected year
        const filteredData = data.filter(d => parseInt(d.Years) === year);
        
        // Update the President and Party labels with the corresponding data
        if (filteredData.length > 0) {
            d3.select('#president').text(filteredData[0].President);
            d3.select('#party').text(filteredData[0].Party);
            // Update the font color based on the party value
            if (filteredData[0].Party === 'Republican') {
                d3.select('#party').style('color', 'red');
                d3.select('#president').style('color', 'red');
            } else if (filteredData[0].Party === 'Democrat') {
                d3.select('#party').style('color', 'blue');
                d3.select('#president').style('color', 'blue');
            }
          }
    }).catch(error => console.error(error));
}


// Event listener for the year slider
d3.select('#slider').on('input', function() {
    // Update the year variable
    year = parseInt(this.value);
    yearFilter = [year, year + 3];
    filterYearData();
    filterYearData2();

    // Update the label with the selected year
    updateLabel();

    //Update the GeoMap
    d3.select('#geochart').html(''); 
    geoMap = updateMap(year, geoData, countyData);
});



// Initial label update
updateLabel();

// Add click interactivity to the title of the chart, that will undo all filters
d3.select('#title').on('click', function(event, d) {
  raceFilter = [];
  genderFilter = [];
  yearFilter = [];
  filterGenderData();
  filterRaceData();
  filterYearData();
  //Update the GeoMap
  d3.select('#geochart').html(''); 
  geoMap = updateMap(2020, geoData, countyData);
})
