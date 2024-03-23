// var fs = require('fs');
const periods = [
  { start: 1976, end: 1980 },
  { start: 1980, end: 1984 },
  { start: 1984, end: 1988 },
  { start: 1988, end: 1992 },
  { start: 1992, end: 1996 },
  { start: 1996, end: 2000 },
  { start: 2000, end: 2004 },
  { start: 2004, end: 2008 },
  { start: 2008, end: 2012 },
  { start: 2012, end: 2016 },
  { start: 2016, end: 2019 }
];

let statePeriodCounts = {};
let output = [];

d3.csv('data/the-condemed-data.csv').then(_data => {
  _data.forEach(d => {
    d.sentencing_year = +d.sentencing_year;
    d.County = d.County;
    const state = getState(d.County) ? getState(d.County) : getStateName(d.state);
    //Took help from here: https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-and-arrays-by-string-path and 
    if (state && d.sentencing_year >= periods[0].start && d.sentencing_year <= periods[periods.length-1].end) {
      //Took help from here: https://stackoverflow.com/questions/15997879/get-the-index-of-the-object-inside-an-array-matching-a-condition
      const periodIndex = periods.findIndex(period => period.start <= d.sentencing_year && d.sentencing_year < period.end);
      if (!(state in statePeriodCounts)) {
        statePeriodCounts[state] = new Array(periods.length).fill(0);
      }
      statePeriodCounts[state][periodIndex]++;
    }
  });


  const Outputdata = periods.map((period, index) => {
    const periodCounts = Object.keys(statePeriodCounts)
      .map(state => ({
        region: state,
        year: `${period.start}-${period.end}`, //Took help from here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
        pop_density: statePeriodCounts[state][index]
      }));

    return periodCounts;
  }).flat();

  // console.log(Outputdata);

  output = d3.csvFormat(Outputdata);

  // console.log(output);
});
