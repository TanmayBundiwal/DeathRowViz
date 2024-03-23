let countyData = [];

d3.csv("data/county-state.csv").then(function(data) {
  data.forEach((d) => {
    const stateCode = d.StateCode;
    const countyName = d.CountyName.replace(" County", "");
    countyData.push({county: countyName, state: getStateName(stateCode)});
    //console.log(countyName + ", " +getStateName(stateCode));
  });
});

function getState(countyName) {
  // Searching in array I just made
  const countyObj = countyData.find(function(d) {
    return d.county === countyName;
  });
  
  return countyObj ? countyObj.state : null;
}