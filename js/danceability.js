// Defining the margins of the pot
const margin = { top: 40, right: 30, bottom: 60, left: 60 };

// defining the container width 
const container = d3.select("#danceability-chart");
const containerWidth = parseInt(container.style("width"));
const width = containerWidth - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// creating an SVG container
const svg = container.append("svg")
  .attr("width", containerWidth)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Add a white background rectangle
svg.append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "#fff")
  .lower();

// chosen historical events
const historicalEvents = {
  1914: "World War I begins",
  1929: "The Great Depression Begins",
  1939: "World War II begins",
  1945: "Work War II Ends",
  1955: "Vietnam War escalates",
  1970: "Disco Era",
  2001: "9/11",
  2008: "Global Recession",
  2020: "Covid Pandemic Begins", 
};

// tooltip
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

// loading in the data
d3.csv("data/ClassicHit_clean.csv").then(rawData => {
  // Convert relevant fields to numbers
  rawData.forEach(d => {
    d.Year = +d.Year;
    d.Danceability = +d.Danceability;
    d.Energy = +d.Energy;
    d.Valence = +d.Valence;
  });

  // Filter years
  const filteredData = rawData.filter(d => d.Year >= 1923 && d.Year !== 2024);

  // Prepare aggregated data per metric (danceability, energy, and valence)
  const metrics = ["Danceability", "Energy", "Valence"];
  const metricData = {};

  metrics.forEach(metric => {
    const yearlyAverages = d3.rollups(
      filteredData,
      v => d3.mean(v, d => d[metric]),
      d => d.Year
    ).map(([year, value]) => ({ Year: year, Value: value }))
     .sort((a, b) => a.Year - b.Year);

    metricData[metric] = yearlyAverages;
  });

  // Saling the axes for that each chart is dispalyed with the most
  // possible detail --- the x axis stays dynamic though 
  const x = d3.scaleLinear()
    .domain(d3.extent(filteredData, d => d.Year))
    .range([0, width]);

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  // y scale will be updated dynamically
  const y = d3.scaleLinear().range([height, 0]);
  svg.append("g").attr("class", "y-axis");

  // Placeholder for line and circles
  const path = svg.append("path").attr("class", "line");
  const circlesGroup = svg.append("g").attr("class", "circles");

  // Function to update chart
  function updateChart(metric) {
    const data = metricData[metric];

    // Update chart title
    d3.select("#chart-title").text(`Mean ${metric} Over Time`);

    // Update y-scale
    const [yMin, yMax] = d3.extent(data, d => d.Value);
    y.domain([yMin - 0.01, yMax + 0.01]);

    // Update y-axis
    svg.select(".y-axis")
      .transition()
      .duration(500)
      .call(d3.axisLeft(y));

    // Update line
    path
      .datum(data)
      .transition()
      .duration(500)
      .attr("fill", "none")
      .attr("stroke", "#3498db")
      .attr("stroke-width", 2)
      .attr("d", d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.Value))
      );

    // Update circles
    const circles = circlesGroup.selectAll("circle").data(data);

    circles.enter()
      .append("circle")
      .merge(circles)
      .transition()
      .duration(500)
      .attr("cx", d => x(d.Year))
      .attr("cy", d => y(d.Value))
      .attr("r", d => historicalEvents[d.Year] ? 5 : 3)
      .attr("fill", d => historicalEvents[d.Year] ? "purple" : "#2980b9");

    // Tooltip interaction
    circlesGroup.selectAll("circle")
      .on("mouseover", (event, d) => {
        const eventText = historicalEvents[d.Year]
          ? `<strong>${d.Year}</strong><br>${historicalEvents[d.Year]}<br>${metric}: ${d.Value.toFixed(2)}`
          : `<strong>${d.Year}</strong><br>${metric}: ${d.Value.toFixed(2)}`;
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
      .on("mouseout", () => tooltip.style("opacity", 0));

    circles.exit().remove();
  }

  // Initial chart load
  let currentMetric = "Danceability";
  updateChart(currentMetric);

  // Dropdown menu change 
  d3.select("#metric-select").on("change", function () {
    currentMetric = this.value;
    updateChart(currentMetric);
  });

  // legend for historical events (just to indicate that the purple dot signify historical events)
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(10, 5)");

  legend.append("rect")
    .attr("x", 0)
    .attr("y", -10)
    .attr("width", 160)
    .attr("height", 25)
    .attr("fill", "#f0f0f0");

  legend.append("circle")
    .attr("cx", 10)
    .attr("cy", 0)
    .attr("r", 5)
    .attr("fill", "purple");

  legend.append("text")
    .attr("x", 25)
    .attr("y", 5)
    .text("Major Historical Event")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");

});
