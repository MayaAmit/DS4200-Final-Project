// Initialize the year slider when the page loads
initYearSlider();

function initYearSlider() {
    // Load CSV data to extract years
    d3.csv("data/ClassicHit_clean.csv").then(function(data) {
        // Assume each row has a "Year" property
        const years = new Set();
        data.forEach(d => {
            if (d.Year) {
                years.add(+d.Year);
            }
        });
        
        // Convert set to array and sort
        const yearArray = Array.from(years).sort((a, b) => a - b);
        
        const yearSlider = d3.select("#yearSlider");
        const yearLabel = d3.select("#yearLabel");

        // Create slider range
        yearSlider
            .attr("min", d3.min(yearArray))
            .attr("max", d3.max(yearArray))
            .attr("value", yearArray[0]);
        
        // When the selection changes, update the chart
        yearSlider.on("input", function() {
            const selectedYear = this.value;
            yearLabel.text(selectedYear)
            updateGenreChart(selectedYear);
        });
        
        // Initial display
        yearLabel.text(yearArray[0]);
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