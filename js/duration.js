// NO LONGER IN USE 
console.log("duration loaded");
// Initialize the genre drop-down and chart when the page loads
initGenreDropdown();

function initGenreDropdown() {
    // Load CSV data to extract genres
    d3.csv("data/ClassicHit_clean.csv").then(function(data) {
        // Assume each row has a "Genre" property
        const genres = new Set();
        data.forEach(d => {
            if (d.Genre) {
                genres.add(d.Genre);
            }
        });
        // Convert set to array and sort; add an "All" option at the start
        const genreArray = Array.from(genres).sort();
        genreArray.unshift("All");
        
        // Populate the drop-down menu
        const dropdown = d3.select("#genreSelect");
        dropdown.selectAll("option")
            .data(genreArray)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);
        
        // When the selection changes, update the chart
        dropdown.on("change", function() {
            const selectedGenre = this.value;
            updateDurationChart(selectedGenre);
        });
        
        // Initially display chart with all genres
        updateDurationChart("All");
    });
}

function updateDurationChart(selectedGenre) {
    // Clear any existing SVG or tooltip in the chart container
    d3.select("#duration-lineplot").selectAll("svg").remove();
    d3.select("#duration-lineplot").selectAll("div").remove();
    
    // Load CSV data and filter by selected genre if needed
    d3.csv("data/ClassicHit_clean.csv").then(function(data) {
        if(selectedGenre !== "All") {
            data = data.filter(d => d.Genre === selectedGenre);
        }
        
        // Group data by decade and compute average duration in seconds
        const decadeData = {};
        data.forEach(function(d) {
            const year = +d.Year;
            const decade = Math.floor(year / 10) * 10 + "s";
            const duration = +d.Duration / 1000;  // Convert from ms to seconds
            
            if (!decadeData[decade]) {
                decadeData[decade] = { total: 0, count: 0 };
            }
            decadeData[decade].total += duration;
            decadeData[decade].count += 1;
        });
        
        // Prepare chart data array from the aggregated results
        const chartData = [];
        for (let decade in decadeData) {
            chartData.push({
                decade: decade,
                value: decadeData[decade].total / decadeData[decade].count
            });
        }
        // Sort data chronologically by decade
        chartData.sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
        
        // Draw the line chart with the prepared data
        drawLineChart(chartData, selectedGenre);
    });
}

function drawLineChart(data, selectedGenre) {
    // Get the container size for responsive dimensions
    const container = document.getElementById('duration-lineplot');
    const containerWidth = container.clientWidth;
    
    // Define margins and dimensions
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create the SVG element
    const svg = d3.select("#duration-lineplot")
        .append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Set up the scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.decade))
        .range([0, width])
        .padding(0.1);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.1])
        .range([height, 0]);
    
    // Add the x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-25)");
    
    // Add the y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale));
    
    // Axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("Decade");
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .style("text-anchor", "middle")
        .text("Average Duration (seconds)");
    
    // Chart title, updated to include the selected genre if not "All"
    let titleText = "Average Song Duration by Decade";
    if(selectedGenre !== "All") {
        titleText += ` for ${selectedGenre}`;
    }
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(titleText);
    
    // Create the line generator
    const line = d3.line()
        .x(d => xScale(d.decade) + xScale.bandwidth() / 2)
        .y(d => yScale(d.value))
        .curve(d3.curveNatural);
    
    // Append the line path to the SVG
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#3498db")
        .attr("stroke-width", 3)
        .attr("d", line);
    
    // Add circles at each data point
    const dots = svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.decade) + xScale.bandwidth() / 2)
        .attr("cy", d => yScale(d.value))
        .attr("r", 5)
        .attr("fill", "#3498db");
    
    // Create a tooltip for interactivity
    const tooltip = d3.select("#duration-lineplot")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("box-shadow", "0 0 10px rgba(0,0,0,0.1)");
    
    // Set up dot interactions
    dots.on("mouseover", function(event, d) {
        d3.select(this)
            .attr("r", 8)
            .attr("fill", "#e74c3c");
        tooltip
            .style("visibility", "visible")
            .html(`<strong>${d.decade}</strong><br>Average Duration: ${d.value.toFixed(1)} seconds`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        d3.select(this)
            .attr("r", 5)
            .attr("fill", "#3498db");
        tooltip.style("visibility", "hidden");
    });
}
