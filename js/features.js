// Wait for the document to be fully loaded -- was having some trouble with 
// this earlier so its just a percaution 
window.addEventListener('DOMContentLoaded', function() {
    // Features we want to visualize
    const features = [
      "Danceability", 
      "Energy", 
      "Speechiness", 
      "Acousticness", 
      "Instrumentalness", 
      "Liveness", 
      "Valence"
    ];
    
    // checkboxes
    createFeatureCheckboxes();
    drawFeatureChart(features);
    function createFeatureCheckboxes() {
      const checkboxContainer = document.getElementById('featureCheckboxes');
    
      checkboxContainer.innerHTML = '';
      
      const checkboxWrapper = document.createElement('div');
      checkboxWrapper.style.display = 'flex';
      checkboxWrapper.style.flexWrap = 'wrap';
      checkboxWrapper.style.gap = '10px';
      checkboxWrapper.style.marginBottom = '15px';
      checkboxContainer.appendChild(checkboxWrapper);
      
      // for each feature
      features.forEach(feature => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.cursor = 'pointer';
        label.style.padding = '5px';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = feature;
        checkbox.checked = true;
        checkbox.style.marginRight = '5px';
        checkbox.addEventListener('change', updateChart);
        
        const text = document.createTextNode(feature);
        
        label.appendChild(checkbox);
        label.appendChild(text);
        checkboxWrapper.appendChild(label);
      });
    }
    
    // Function to update the chart based on selected features
    function updateChart() {
      // Get all selected features
      const selectedFeatures = [];
      const checkboxes = document.querySelectorAll('#featureCheckboxes input[type="checkbox"]');
      
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          selectedFeatures.push(checkbox.value);
        }
      });
      
      // Redraw the chart with selected features
      drawFeatureChart(selectedFeatures);
    }
    
    // Main function to draw the feature chart
    function drawFeatureChart(selectedFeatures) {
      // Get the container dimensions to make the chart responsive
      const containerElem = document.getElementById('feature-lineplot');
      const containerWidth = containerElem.clientWidth || 1000; // Use container width or default to 1000px
      
      const margin = {top: 50, right: 100, bottom: 50, left: 60};
      const width = containerWidth - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;
      
      // Clear existing chart
      d3.select("#feature-lineplot").html("");
      
      // Create the SVG element
      const svg = d3.select("#feature-lineplot")
        .append("svg")
        .attr("width", "100%") // Set width to 100% to fill container
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Feature Trends Over Time");
      
      // Adding a note incase no features are selected just so that something is displayed
      if (selectedFeatures.length === 0) {
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "14px")
          .style("fill", "#666")
          .text("Please select at least one feature to display");
        return;
      }
      
      // Load the data
      d3.csv("data/ClassicHit_clean.csv")
        .then(function(data) {
          // Group data by year and calculate averages
          const yearGroups = {};
          
          data.forEach(function(d) {
            const year = +d.Year;
            
            if (!yearGroups[year]) {
              yearGroups[year] = { 
                year: year,
                count: 0
              };
              
              // Initialize all features with 0
              features.forEach(function(feature) {
                yearGroups[year][feature] = 0;
              });
            }
            
            // Sum up all feature values
            features.forEach(function(feature) {
              const value = +d[feature];
              if (!isNaN(value)) {
                yearGroups[year][feature] += value;
              }
            });
            
            yearGroups[year].count += 1;
          });
          
          // Calculate averages for each feature per year
          const yearlyData = Object.values(yearGroups).map(function(d) {
            const result = { year: d.year };
            
            features.forEach(function(feature) {
              result[feature] = d[feature] / d.count;
            });
            
            return result;
          });
          
          // Sort by year
          yearlyData.sort(function(a, b) {
            return a.year - b.year;
          });
          
          // Set up scales
          const xScale = d3.scaleLinear()
            .domain(d3.extent(yearlyData, d => d.year))
            .range([0, width]);
          
          const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([height, 0]);
          
          // Create a color scale
          const colorScale = d3.scaleOrdinal()
            .domain(features)
            .range(d3.schemeCategory10);
          
          // Add x axis
          svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
            .selectAll("text")
            .style("font-size", "10px");
          
          // Add y axis
          svg.append("g")
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .style("font-size", "10px");
          
          // Add axis labels
          svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width/2)
            .attr("y", height + 40)
            .style("font-size", "12px")
            .text("Year");
          
          svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height/2)
            .style("font-size", "12px")
            .text("Feature Value");
          
          svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height})`)
            .call(
              d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat("")
            )
            .selectAll("line")
            .style("stroke", "#e0e0e0");
          
          svg.append("g")
            .attr("class", "grid")
            .call(
              d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat("")
            )
            .selectAll("line")
            .style("stroke", "#e0e0e0");
          
          // Create line generator
          const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX);
          
          // Draw a line for each selected feature
          selectedFeatures.forEach(function(feature) {
            // Prepare data for this feature
            const featureData = yearlyData.map(d => ({
              year: d.year,
              value: d[feature]
            }));
            
            // Add the line
            svg.append("path")
              .datum(featureData)
              .attr("fill", "none")
              .attr("stroke", colorScale(feature))
              .attr("stroke-width", 1.5) // Thinner line
              .attr("d", line);
              
            // Add dots for data points
            svg.selectAll(`.dot-${feature}`)
              .data(featureData)
              .enter()
              .append("circle")
              .attr("class", `dot-${feature}`)
              .attr("cx", d => xScale(d.year))
              .attr("cy", d => yScale(d.value))
              .attr("r", 2) // Smaller dots
              .attr("fill", colorScale(feature));
          });
          
          // Add a legend
          const legend = svg.selectAll(".legend")
            .data(selectedFeatures)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);
          
          legend.append("rect")
            .attr("x", width + 10)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", d => colorScale(d));
          
          legend.append("text")
            .attr("x", width + 30)
            .attr("y", 7.5)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .style("font-size", "10px")
            .text(d => d);
          
          // Add a listener to resize the chart if the window size changes
          window.addEventListener('resize', function() {
            drawFeatureChart(selectedFeatures);
          });
        })
        .catch(function(error) {
          // Display error message in the visualization container
          d3.select("#feature-lineplot")
            .append("div")
            .style("color", "red")
            .style("padding", "20px")
            .style("text-align", "center")
            .style("font-weight", "bold")
            .text("Error: Could not load music feature data.");
        });
    }
  });