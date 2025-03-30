// danceability.js

// 1) Define margins
const margin = { top: 40, right: 30, bottom: 60, left: 60 };

// 2) Select the container and get its width (ensure the container has a defined width via CSS)
const container = d3.select("#danceability-chart");
const containerWidth = parseInt(container.style("width"));
const width = containerWidth - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// 3) Create an SVG container using the container's full width
const svg = container.append("svg")
  .attr("width", containerWidth)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 4) Define a dictionary of historical events to highlight
const historicalEvents = {
  1914: "World War I begins",
  1929: "The Great Depression Begins",
  1939: "World War II begins",
  1955: "Vietnam War escalates",
  1970: "Disco Era",
  2008: "Global Recession",
  2020: "Covid Pandemic Begins", 
  // Add more if desired...
};

// 5) Create a tooltip dynamically
const tooltip = d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("opacity", 0)
  .style("background-color", "#fff")
  .style("border", "1px solid #ccc")
  .style("border-radius", "4px")
  .style("padding", "8px")
  .style("pointer-events", "none")
  .style("z-index", "999");

// 6) Load the CSV data
d3.csv("data/ClassicHit.csv").then(data => {
  // 6a) Parse the CSV data
  data.forEach(d => {
    d.Year = +d.Year;               // Convert Year to number
    d.Danceability = +d.Danceability; // Convert Danceability to float
  });

  // 6b) Group by year and compute the mean danceability
  const yearlyData = d3.rollups(
    data,
    v => d3.mean(v, d => d.Danceability),
    d => d.Year
  )
  .map(([year, meanDance]) => ({ Year: year, Danceability: meanDance }))
  .sort((a, b) => a.Year - b.Year);

  // 7) Create scales for x (Year) and y (mean Danceability)
  const x = d3.scaleLinear()
    .domain(d3.extent(yearlyData, d => d.Year)) // [minYear, maxYear]
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0.25, 0.7])  // Data is always between 0.25 and 0.7
    .range([height, 0]);

  // 8) Add the x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Format ticks as full years

  // 9) Add the y-axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // 10) Create a line generator
  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.Danceability));

  // 11) Append the line path using the aggregated data
  svg.append("path")
    .datum(yearlyData)
    .attr("fill", "none")
    .attr("stroke", "#3498db")
    .attr("stroke-width", 2)
    .attr("d", line);

  // 12) Add circles for each data point, styling based on historical events
  svg.selectAll("circle")
    .data(yearlyData)
    .enter()
    .append("circle")
      .attr("cx", d => x(d.Year))
      .attr("cy", d => y(d.Danceability))
      .attr("r", d => historicalEvents[d.Year] ? 5 : 3)  // Bigger if there's a historical event
      .attr("fill", d => historicalEvents[d.Year] ? "purple" : "#2980b9")
      .on("mouseover", (event, d) => {
        // Build tooltip text depending on historical event
        const eventText = historicalEvents[d.Year]
          ? `<strong>${d.Year}</strong><br>${historicalEvents[d.Year]}<br>Danceability: ${d.Danceability.toFixed(2)}`
          : `<strong>${d.Year}</strong><br>Danceability: ${d.Danceability.toFixed(2)}`;
        tooltip
          .style("opacity", 1)
          .html(eventText)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

  // 13) Add a legend for major historical events
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 150}, 10)`);

  // Purple circle for historical events
  legend.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 5)
    .attr("fill", "purple");

  // Text for the legend
  legend.append("text")
    .attr("x", 10)
    .attr("y", 4)
    .text("Major Historical Event")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");
});
