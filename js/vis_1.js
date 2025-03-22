// vis_1.js

// 1) Set chart dimensions and margins
const margin = { top: 30, right: 30, bottom: 50, left: 60 },
      width  = 800 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

// 2) Create an SVG container in the #danceability-chart div
const svg = d3.select("#danceability-chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 3) Define a dictionary of historical events to highlight
const historicalEvents = {
  1914: "World War I begins",
  1939: "World War II begins",
  1955: "Vietnam War escalates",
  2008: "Global Recession",
  // Add more if desired...
};

// 4) Create a tooltip reference (assuming you have a <div id="tooltip"> in your HTML)
const tooltip = d3.select("#tooltip");

// 5) Load the CSV data
d3.csv("data/ClassicHit.csv").then(data => {
  // 5a) Parse the CSV data
  data.forEach(d => {
    d.Year = +d.Year;             // Convert Year to number
    d.Danceability = +d.Danceability; // Convert Danceability to float
  });

  // 5b) Group by year and compute the mean danceability
  //     Using d3.rollups -> returns an array of [year, meanValue]
  const yearlyData = d3.rollups(
    data,
    v => d3.mean(v, d => d.Danceability), // aggregator for mean
    d => d.Year                           // key to group by (the year)
  )
  // Convert each pair [year, meanDance] into an object {Year, Danceability}
  .map(([year, meanDance]) => ({
    Year: year,
    Danceability: meanDance
  }))
  // Sort by Year so the line draws chronologically
  .sort((a, b) => a.Year - b.Year);

  // 6) Create scales for x (Year) and y (mean Danceability)
  const x = d3.scaleLinear()
    .domain(d3.extent(yearlyData, d => d.Year)) // [minYear, maxYear]
    .range([0, width]);

  // If you know Danceability is always between 0 and 1, you can hard-code [0,1].
  // Or dynamically set the upper bound from your data:
      // update: yes, the data is always between 0 and 1, but I'll set the range from 0.25 to 0.7


  const y = d3.scaleLinear()
    .domain([0.25, 0.7])  
    .range([height, 0]);

  // 7) Add the x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Show full year (e.g., 1923)

  // 8) Add the y-axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // 9) Create a line generator
  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.Danceability));

  // 10) Append the line path using the aggregated data
  svg.append("path")
    .datum(yearlyData)
    .attr("fill", "none")
    .attr("stroke", "#3498db")
    .attr("stroke-width", 2)
    .attr("d", line);

  // 11) Add circles for each data point (one per year now)
  svg.selectAll("circle")
    .data(yearlyData)
    .enter()
    .append("circle")
      .attr("cx", d => x(d.Year))
      .attr("cy", d => y(d.Danceability))
      .attr("r", 4)
      .attr("fill", "#2980b9")
      .on("mouseover", (event, d) => {
        // Check if there's a special historical event for this year
        const eventText = historicalEvents[d.Year]
          ? `<strong>${d.Year}</strong><br>${historicalEvents[d.Year]}<br>Danceability: ${d.Danceability.toFixed(2)}`
          : `<strong>${d.Year}</strong><br>Danceability: ${d.Danceability.toFixed(2)}`;

        tooltip
          .style("opacity", 1)
          .html(eventText)
          .style("left", (event.pageX + 10) + "px") // position tooltip near cursor
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", event => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip
          .style("opacity", 0);
      });

});
