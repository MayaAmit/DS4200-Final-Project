// Initialize the year drop-down and chart when the page loads
initYearDropdown();

function initYearDropdown() {
    // Load CSV data to extract years
    d3.csv("data/ClassicHit_clean.csv").then(function(data) {
        // Assume each row has a "Year" property
        const years = new Set();
        data.forEach(d => {
            if (d.Year) {
                years.add(d.Year);
            }
        });
        
        // Convert set to array and sort
        const yearArray = Array.from(years).sort();
        
        // Populate the year drop-down menu
        const yearDropdown = d3.select("#yearSelect");
        yearDropdown.selectAll("option")
            .data(yearArray)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);
        
        // When the selection changes, update the chart
        yearDropdown.on("change", function() {
            const selectedYear = this.value;
            updateGenreChart(selectedYear);
        });
        
        // Initially display chart with the first year in the dropdown
        updateGenreChart(yearArray[0]);
    });
}

// Function to update the chart based on selected year
function updateGenreChart(selectedYear) {
    // Load CSV data
    d3.csv("data/ClassicHit_clean.csv").then(function(data) {
        // Filter the data to get only the songs from the selected year
        const yearData = data.filter(d => d.Year === selectedYear);

        // Count the number of songs in each genre for the selected year
        const genreCounts = Array.from(
            d3.group(yearData, d => d.Genre),
            ([key, value]) => ({ key, value: value.length })
        );

        // Sort the genres by count
        genreCounts.sort((a, b) => b.value - a.value);

        // Prepare data for the bar chart
        const chartData = {
            x: genreCounts.map(d => d.key),
            y: genreCounts.map(d => d.value),
            type: 'bar',
            marker: {
                color: 'skyblue'
            }
        };

        // Create the layout for the chart
        const layout = {
            title: `Number of Songs by Genre in ${selectedYear}`,
            xaxis: {
                title: 'Genre',
                tickangle: -45
            },
            yaxis: {
                title: 'Number of Songs'
            }
        };

        // Render the chart using Plotly
        Plotly.newPlot("barchart", [chartData], layout);
    });
}