// Wait for the document to be fully loaded
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
  
  // Set up chart dimensions and scales once
  const containerElem = document.getElementById('feature-lineplot');
  const containerWidth = containerElem.clientWidth || 1000;
  
  const margin = {top: 50, right: 100, bottom: 50, left: 60};
  const width = containerWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  // Major fix: SVG creation moved outside the update function so its only generated once and 
  // not destroyed on each update !!!! 
  const svg = d3.select("#feature-lineplot")
    .append("svg")
    .attr("width", "100%")
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Add title
  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Feature Trends Over Time");
  
  // Add empty message placeholder (hidden initially)
  const noFeaturesMsg = svg.append("text")
    .attr("class", "no-features-msg")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#666")
    .text("Please select at least one feature to display")
    .style("opacity", 0);
    
  // Major fix: Create reusable groups for chart elements !!! 
  // Add axis groups (created once)
  const xAxisGroup = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`);
    
  const yAxisGroup = svg.append("g")
    .attr("class", "y-axis");
    
  // Add axis labels (created once)
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
    
  // Add grid (created once)
  const xGridGroup = svg.append("g")
    .attr("class", "x-grid")
    .attr("transform", `translate(0,${height})`);
    
  const yGridGroup = svg.append("g")
    .attr("class", "y-grid");
    
  // Create a color scale
  const colorScale = d3.scaleOrdinal()
    .domain(features)
    .range(d3.schemeCategory10);
  
  // Create a group for all lines
  const linesGroup = svg.append("g")
    .attr("class", "lines-group");
    
  // Create a group for all points
  const pointsGroup = svg.append("g")
    .attr("class", "points-group");
    
  // Create legend group
  const legendGroup = svg.append("g")
    .attr("class", "legend-group");
  
  // Set up scales (will be updated when data loads)
  const xScale = d3.scaleLinear()
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([height, 0]);
  
  // Create line generator
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);
  
  // Store the data globally so we don't need to reload it
  let yearlyData = [];
  
  // Create checkboxes
  createFeatureCheckboxes();
  
  // Load data once and then draw the initial chart
  loadData().then(() => {
    drawFeatureChart(features);
  });
  
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
      
      // Use a debounced event handler to prevent rapid consecutive updates
      checkbox.addEventListener('change', debounce(updateChart, 50));
      
      const text = document.createTextNode(feature);
      
      label.appendChild(checkbox);
      label.appendChild(text);
      checkboxWrapper.appendChild(label);
    });
  }
  
  // Implementing debouncing becuase toggling between the 
  // checkboxes quickly was leading to issues!! Mostly likley becuase 
  // the updated were interfering with eachother. Debouncing midigates this problem 
  // Debounce function to prevent multiple rapid updates
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
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
    
    // Update the chart with selected features without reloading data
    drawFeatureChart(selectedFeatures);
  }
  
  // major fix: Load data only once (instead of on every update)
  // Function to load the data (only called once)
  async function loadData() {
    try {
      const data = await d3.csv("data/ClassicHit_clean.csv");
      
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
      yearlyData = Object.values(yearGroups).map(function(d) {
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
      
      // Update x scale domain based on data
      xScale.domain(d3.extent(yearlyData, d => d.year));
      
      // Update axes
      xAxisGroup.call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
        .selectAll("text")
        .style("font-size", "10px");
      
      yAxisGroup.call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "10px");
        
      // Update grid
      xGridGroup.call(
        d3.axisBottom(xScale)
          .tickSize(-height)
          .tickFormat("")
      )
      .selectAll("line")
      .style("stroke", "#e0e0e0");
      
      yGridGroup.call(
        d3.axisLeft(yScale)
          .tickSize(-width)
          .tickFormat("")
      )
      .selectAll("line")
      .style("stroke", "#e0e0e0");
      
    } catch (error) {
      // Display error message
      d3.select("#feature-lineplot")
        .append("div")
        .style("color", "red")
        .style("padding", "20px")
        .style("text-align", "center")
        .style("font-weight", "bold")
        .text("Error: Could not load music feature data.");
    }
  }
  
  // Main function to draw the feature chart (now just updates, doesn't recreate)
  function drawFeatureChart(selectedFeatures) {
    // Show/hide no features message
    if (selectedFeatures.length === 0) {
      noFeaturesMsg.style("opacity", 1);
      linesGroup.style("display", "none");
      pointsGroup.style("display", "none");
      return;
    } else {
      noFeaturesMsg.style("opacity", 0);
      linesGroup.style("display", null);
      pointsGroup.style("display", null);
    }
    
    // Update lines using enter/update/exit pattern
    const lineSelection = linesGroup.selectAll(".feature-line")
      .data(selectedFeatures, d => d);
    
    // Remove lines for unselected features
    lineSelection.exit()
      .transition().duration(300)
      .style("opacity", 0)
      .remove();
    
    // Add new lines for newly selected features
    lineSelection.enter()
      .append("path")
      .attr("class", d => `feature-line feature-line-${d}`)
      .attr("fill", "none")
      .attr("stroke", d => colorScale(d))
      .attr("stroke-width", 1.5)
      .style("opacity", 0)
      .attr("d", function(feature) {
        const featureData = yearlyData.map(d => ({
          year: d.year,
          value: d[feature]
        }));
        return line(featureData);
      })
      .transition().duration(300)
      .style("opacity", 1);
    
    // Update points for each feature
    selectedFeatures.forEach(function(feature) {
      // Prepare data for this feature
      const featureData = yearlyData.map(d => ({
        year: d.year,
        value: d[feature],
        feature: feature
      }));
      
      // Update points using enter/update/exit pattern
      const pointSelection = pointsGroup.selectAll(`.dot-${feature}`)
        .data(featureData, d => `${d.year}-${d.feature}`);
      
      // Remove points for unselected features
      pointSelection.exit()
        .transition().duration(300)
        .style("opacity", 0)
        .remove();
      
      // Add new points
      pointSelection.enter()
        .append("circle")
        .attr("class", `dot-${feature}`)
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.value))
        .attr("r", 2)
        .attr("fill", colorScale(feature))
        .style("opacity", 0)
        .transition().duration(300)
        .style("opacity", 1);
    });
    
    // Clean up points for features not in selection
    features.forEach(feature => {
      if (!selectedFeatures.includes(feature)) {
        pointsGroup.selectAll(`.dot-${feature}`)
          .transition().duration(300)
          .style("opacity", 0)
          .remove();
      }
    });
    
    // Update legend using enter/update/exit
    const legendSelection = legendGroup.selectAll(".legend-item")
      .data(selectedFeatures, d => d);
    
    // Remove legend items for unselected features
    legendSelection.exit()
      .transition().duration(300)
      .style("opacity", 0)
      .remove();
    
    // Create new legend items
    const enterLegend = legendSelection.enter()
      .append("g")
      .attr("class", "legend-item")
      .style("opacity", 0)
      .attr("transform", (d, i) => `translate(${width + 10},${i * 20})`);
    
    enterLegend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .style("fill", d => colorScale(d));
    
    enterLegend.append("text")
      .attr("x", 20)
      .attr("y", 7.5)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .style("font-size", "10px")
      .text(d => d);
    
    enterLegend.transition().duration(300)
      .style("opacity", 1);
    
    // Update positions of all legend items
    legendGroup.selectAll(".legend-item")
      .transition().duration(300)
      .attr("transform", (d, i) => `translate(${width + 10},${i * 20})`);
  }
  
  // Add a listener to resize the chart if the window size changes
  const resizeObserver = new ResizeObserver(debounce(() => {
    // Update dimensions
    const newContainerWidth = containerElem.clientWidth || 1000;
    const newWidth = newContainerWidth - margin.left - margin.right;
    
    // Update SVG viewBox
    d3.select("#feature-lineplot svg")
      .attr("viewBox", `0 0 ${newContainerWidth} ${height + margin.top + margin.bottom}`);
    
    // Update scales
    xScale.range([0, newWidth]);
    
    // Redraw with current selected features
    const selectedFeatures = Array.from(
      document.querySelectorAll('#featureCheckboxes input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    drawFeatureChart(selectedFeatures);
  }, 100));
  
  resizeObserver.observe(containerElem);
});