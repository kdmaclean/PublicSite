document.addEventListener('DOMContentLoaded', () => {
    const distributionChartCtx = document.getElementById('distributionChart').getContext('2d');
    let distributionChart;

    // Normal distribution function
    function normalPDF(x, mean, sd) {
        return (1 / (sd * Math.sqrt(2 * Math.PI))) * 
               Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
    }

    // Add standard normal cumulative distribution function (error function)
    function normalCDF(x, mean, sd) {
        return 0.5 * (1 + erf((x - mean) / (sd * Math.sqrt(2))));
    }

    // Error function implementation
    function erf(x) {
        // Save the sign of x
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        // Constants
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        // Abramowitz and Stegun formula 7.1.26
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }

    // Calculate win probability using properties of normal distributions
    function calculateWinProbability(mean1, sd1, mean2, sd2) {
        // When we subtract two normal distributions (X - Y):
        // mean = mean_X - mean_Y
        // variance = variance_X + variance_Y
        const diffMean = mean1 - mean2;
        const diffSD = Math.sqrt(sd1 * sd1 + sd2 * sd2);
        
        // P(X > Y) = P(X - Y > 0) = 1 - Φ(0)
        // where Φ is the CDF of the difference distribution
        return 1 - normalCDF(0, diffMean, diffSD);
    }

    function updateChart() {
        const favoriteMean = parseFloat(document.getElementById('favoriteMean').value);
        const favoriteSD = parseFloat(document.getElementById('favoriteSD').value);
        const underdogMean = parseFloat(document.getElementById('underdogMean').value);
        const underdogSD = parseFloat(document.getElementById('underdogSD').value);

        // Generate x-values from 0 to 200
        const xValues = [];
        const favoriteYValues = [];
        const underdogYValues = [];
        
        for (let x = 0; x <= 200; x++) {
            xValues.push(x);
            favoriteYValues.push(normalPDF(x, favoriteMean, favoriteSD));
            underdogYValues.push(normalPDF(x, underdogMean, underdogSD));
        }

        // Calculate win probabilities
        const favoriteWinProb = calculateWinProbability(favoriteMean, favoriteSD, underdogMean, underdogSD);
        const underdogWinProb = 1 - favoriteWinProb;

        // Update probability displays
        document.getElementById('favoriteWinProb').textContent = 
            `Favorite Win Probability: ${(favoriteWinProb * 100).toFixed(1)}%`;
        document.getElementById('underdogWinProb').textContent = 
            `Underdog Win Probability: ${(underdogWinProb * 100).toFixed(1)}%`;

        // Update or create chart
        if (distributionChart) {
            distributionChart.destroy();
        }

        distributionChart = new Chart(distributionChartCtx, {
            type: 'line',
            data: {
                labels: xValues,
                datasets: [{
                    label: 'Favorite',
                    data: favoriteYValues,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0  // Remove the dots
                }, {
                    label: 'Underdog',
                    data: underdogYValues,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0  // Remove the dots
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Disable animations
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Performance'
                        },
                        min: 0,
                        max: 200,
                        ticks: {
                            stepSize: 10,
                            callback: function(value) {
                                return value;
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Probability Density'
                        }
                    }
                }
            }
        });
    }

    // Add event listeners to all inputs
    const inputs = ['favoriteMean', 'favoriteSD', 'underdogMean', 'underdogSD'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', updateChart);
    });

    // Initial chart render
    updateChart();
});
