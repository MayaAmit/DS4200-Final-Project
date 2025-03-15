
createDurationChart();

// Create the avg duration by decade D3 chart
// NOTE: Just made this to implement D3. Not married to it and could probably
// easily switch it a line plot for some other part of the data, maybe one of
// the static line plots we already made. - Gio
function createDurationChart() {
    // Load the CSV file with our data
    d3.csv("data/ClassicHit.csv").then(function(data) {
        // Grouping by decade and then calculating the average duration
        const decadeData = {};
        
        // Loop through songs
        data.forEach(function(d) {
            const year = +d.Year;
            const decade = Math.floor(year / 10) * 10 + "s";
            
            // Convert ms to seconds
            const duration = +d.Duration / 1000;
            
            // Create decade group if it doesn't exist yet
            if (!decadeData[decade]) {
                decadeData[decade] = { total: 0, count: 0 };
            }
            
            // Add this song's duration to the decade total
            decadeData[decade].total += duration;
            decadeData[decade].count += 1;
        });
        
        // Calculate averages and sort by decade
        const chartData = [];
        for (let decade in decadeData) {
            chartData.push({
                decade: decade,
                value: decadeData[decade].total / decadeData[decade].count
            });
        }
        
        // Sort by decade
        chartData.sort(function(a, b) {
            return parseInt(a.decade) - parseInt(b.decade);
        });
        
        // Draw chart
        drawLineChart(chartData);
    });
}

// Draw the line chart
function drawLineChart(data) {
    // Get container size
    const container = document.getElementById('lineplot');
    const containerWidth = container.clientWidth;
    
    // Set margins and size
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create the SVG element that will contain our chart
    const svg = d3.select("#lineplot")
        .append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Set up the x and y scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.decade))
        .range([0, width])
        .padding(0.1);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.1]) // Add 10% padding at top
        .range([height, 0]);
    
    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-25)"); // Angle the labels so they don't overlap
    
    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale));
    
    // Add the axis labels
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
    
    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Average Song Duration by Decade");
    
    // Create the line
    const line = d3.line()
        .x(d => xScale(d.decade) + xScale.bandwidth() / 2)
        .y(d => yScale(d.value))
        .curve(d3.curveNatural);
    
    // Add the line to the chart
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#3498db")
        .attr("stroke-width", 3)
        .attr("d", line);
    
    // Add dots for each data point
    const dots = svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.decade) + xScale.bandwidth() / 2)
        .attr("cy", d => yScale(d.value))
        .attr("r", 5)
        .attr("fill", "#3498db");
    
    // Add tooltip that shows when hovering over points
    // If we actually stick with this then might be better to convert seconds
    // to minutes for the hover box. But for simplicity and since this might
    // get changed, leaving as is for now. - Gio
    const tooltip = d3.select("#lineplot")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("box-shadow", "0 0 10px rgba(0,0,0,0.1)");
    
    // Make dots interactive
    dots.on("mouseover", function(event, d) {
        // Make the dot bigger and red when hovering
        d3.select(this)
            .attr("r", 8)
            .attr("fill", "#e74c3c");
        
        // Show the tooltip with the data
        tooltip
            .style("visibility", "visible")
            .html(`<strong>${d.decade}</strong><br>Average Duration: ${d.value.toFixed(1)} seconds`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        // Return dot to normal when not hovering
        d3.select(this)
            .attr("r", 5)
            .attr("fill", "#3498db");
        
        // Hide the tooltip when not hovering
        tooltip.style("visibility", "hidden");
    });
} 