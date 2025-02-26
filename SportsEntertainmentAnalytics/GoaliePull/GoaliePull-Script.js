document.addEventListener('DOMContentLoaded', () => {
    const singleSimButton = document.getElementById('singleSimButton');
    const multiSimButton = document.getElementById('multiSimButton');
    const timeline = document.getElementById('timeline');
    const gameVisualization = document.getElementById('gameVisualization');
    const ctx = document.getElementById('resultsChart').getContext('2d');
    let resultsChart;
    let optimizationChart;

    // Hide all visualizations on initial load
    hideAllVisualizations();

    const TOTAL_SECONDS = 600; // 10 minutes
    const INTERVAL = 10; // 10 second intervals
    const TOTAL_INTERVALS = TOTAL_SECONDS / INTERVAL;

    function initializeTimeline() {
        timeline.innerHTML = '';
        
        // Add minute labels container
        const labelContainer = document.createElement('div');
        labelContainer.className = 'time-labels';
        
        // Add cells containers
        const cellContainer = document.createElement('div');
        cellContainer.className = 'time-cells';
        
        const goalieContainer = document.createElement('div');
        goalieContainer.className = 'goalie-cells';
        
        // Add all to timeline
        timeline.appendChild(labelContainer);
        timeline.appendChild(cellContainer);
        timeline.appendChild(goalieContainer);
        
        // Create cells and labels
        for (let i = 0; i < TOTAL_INTERVALS; i++) {
            const cell = document.createElement('div');
            cell.className = 'time-cell';
            cellContainer.appendChild(cell);
            
            const goalieCell = document.createElement('div');
            goalieCell.className = 'goalie-cell';
            goalieContainer.appendChild(goalieCell);
            
            // Add minute labels (every 6 intervals = 1 minute)
            if (i % 6 === 0) {
                const minuteLabel = document.createElement('div');
                minuteLabel.className = 'minute-label';
                const minutes = 10 - (i / 6);
                minuteLabel.textContent = minutes;
                labelContainer.appendChild(minuteLabel);
            }
        }
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function hideAllVisualizations() {
        // Hide game visualization
        gameVisualization.style.display = 'none';
        
        // Hide all chart containers
        document.querySelectorAll('.chart-container').forEach(container => {
            container.style.display = 'none';
        });
        
        // Hide stats container
        document.querySelector('.stats-container').style.display = 'none';
        
        // Remove any result messages
        document.querySelectorAll('.result-message').forEach(msg => msg.remove());
    }

    async function simulateSingleGame(params, skipAnimation = false) {
        if (!skipAnimation) {
            hideAllVisualizations();
            gameVisualization.style.display = 'block';
            document.querySelector('.chart-container').style.display = 'none';
            initializeTimeline();
        }
        
        const cells = !skipAnimation ? document.querySelectorAll('.time-cell') : null;
        let ourScore = 0;
        let theirScore = 1; // Start down by 1
        let timeRemaining = TOTAL_SECONDS;
        let isGoaliePulled = false;

        if (!skipAnimation) {
            document.getElementById('scoreDisplay').textContent = `Score: ${ourScore} - ${theirScore}`;
        }

        for (let i = 0; i < TOTAL_INTERVALS; i++) {
            timeRemaining = TOTAL_SECONDS - (i * INTERVAL);
            
            const scoreDifference = theirScore - ourScore;
            isGoaliePulled = (timeRemaining <= params.pullTimeSeconds && scoreDifference <= 2 && theirScore > ourScore);
            
            const ourProb = isGoaliePulled ? params.ourPulledProb : params.ourNormalProb;
            const theirProb = isGoaliePulled ? params.theirPulledProb : params.theirNormalProb;
            
            const random = Math.random();
            let event = 'none';
            
            if (random < ourProb) {
                event = 'our-goal';
                ourScore++;
            } else if (random < ourProb + theirProb) {
                event = 'their-goal';
                theirScore++;
            }
            
            if (!skipAnimation) {
                // Animate cells
                await new Promise(resolve => setTimeout(resolve, 50));
                cells[i].classList.add(event);
                
                // Update goalie status cell
                const goalieCells = document.querySelectorAll('.goalie-cell');
                if (isGoaliePulled) {
                    goalieCells[i].classList.add('pulled');
                }
                
                // Update displays
                document.getElementById('gameTime').textContent = 
                    `Time Remaining: ${formatTime(Math.max(0, timeRemaining - INTERVAL))}`;
                document.getElementById('scoreDisplay').textContent = `Score: ${ourScore} - ${theirScore}`;
                document.getElementById('goalieStatus').textContent = `Goalie: ${isGoaliePulled ? 'Pulled' : 'In Net'}`;
            }
        }
        
        if (!skipAnimation) {
            // Add result message after simulation
            const resultMessage = document.createElement('div');
            resultMessage.className = 'result-message';
            if (ourScore > theirScore) {
                resultMessage.textContent = 'We win! 🎉';
                resultMessage.style.color = '#2ecc71';
            } else if (ourScore < theirScore) {
                resultMessage.textContent = 'We lose 😢';
                resultMessage.style.color = '#e74c3c';
            } else {
                resultMessage.textContent = 'It\'s a tie! 🤝';
                resultMessage.style.color = '#3498db';
            }
            document.getElementById('gameVisualization').appendChild(resultMessage);
        }
        
        return { ourScore, theirScore };
    }

    async function simulateMultipleGames(params) {
        hideAllVisualizations();
        document.querySelector('.chart-container').style.display = 'block';
        document.querySelector('.stats-container').style.display = 'block';
        
        const results = [];
        for (let i = 0; i < 1000; i++) {
            const result = await simulateSingleGame(params, true);
            results.push(result);
        }
        
        updateStats(results);
        renderChart(results);
    }

    function updateStats(results) {
        const total = results.length;
        const wins = results.filter(r => r.ourScore > r.theirScore).length;
        const ties = results.filter(r => r.ourScore === r.theirScore).length;
        const losses = results.filter(r => r.ourScore < r.theirScore).length;
        
        document.getElementById('winRate').textContent = 
            `${wins} (${((wins/total) * 100).toFixed(1)}%)`;
        document.getElementById('tieRate').textContent = 
            `${ties} (${((ties/total) * 100).toFixed(1)}%)`;
        document.getElementById('lossRate').textContent = 
            `${losses} (${((losses/total) * 100).toFixed(1)}%)`;
    }

    function renderChart(results) {
        // Create score differential distribution with grouping
        const diffs = results.map(r => r.ourScore - r.theirScore);
        const counts = {
            "≤-3": 0,
            "-2": 0,
            "-1": 0,
            "0": 0,
            "+1": 0,
            "+2": 0,
            "≥+3": 0
        };
        
        diffs.forEach(d => {
            if (d <= -3) counts["≤-3"]++;
            else if (d >= 3) counts["≥+3"]++;
            else if (d === -2) counts["-2"]++;
            else if (d === -1) counts["-1"]++;
            else if (d === 0) counts["0"]++;
            else if (d === 1) counts["+1"]++;
            else if (d === 2) counts["+2"]++;
        });
        
        const labels = ["≤-3", "-2", "-1", "0", "+1", "+2", "≥+3"];
        const data = labels.map(l => counts[l]);
        const colors = labels.map(l => {
            if (l.includes('-')) return 'rgba(231, 76, 60, 0.6)';  // Red for losses
            else if (l === '0') return 'rgba(52, 152, 219, 0.6)';  // Blue for ties
            else return 'rgba(46, 204, 113, 0.6)';  // Green for wins
        });
        const borderColors = labels.map(l => {
            if (l.includes('-')) return 'rgba(192, 57, 43, 1)';    // Darker red
            else if (l === '0') return 'rgba(41, 128, 185, 1)';    // Darker blue
            else return 'rgba(39, 174, 96, 1)';    // Darker green
        });

        if (resultsChart) {
            resultsChart.destroy();
        }

        resultsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Goal Differential Distribution',
                    data: data,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Goal Differential (Our Goals - Their Goals)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Frequency'
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y || 0;
                                const percentage = ((value / results.length) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function getParams() {
        return {
            ourNormalProb: parseFloat(document.getElementById('ourNormalProb').value) / 100,
            ourPulledProb: parseFloat(document.getElementById('ourPulledProb').value) / 100,
            theirNormalProb: parseFloat(document.getElementById('theirNormalProb').value) / 100,
            theirPulledProb: parseFloat(document.getElementById('theirPulledProb').value) / 100,
            pullTimeSeconds: parseFloat(document.getElementById('pullTime').value) * 60
        };
    }

    async function findOptimalPullTime() {
        hideAllVisualizations();
        // Show only the optimization chart container (the second one)
        document.querySelectorAll('.chart-container')[1].style.display = 'block';
        
        const params = getParams();
        const results = [];
        
        // Test every 30 seconds from 0 to 10 minutes
        for (let pullTime = 0; pullTime <= 600; pullTime += 30) {
            params.pullTimeSeconds = pullTime;
            let successCount = 0;
            
            // Run 1000 simulations for each pull time
            for (let i = 0; i < 1000; i++) {
                const result = await simulateSingleGame(params, true);
                // Count wins and ties as success
                if (result.ourScore >= result.theirScore) {
                    successCount++;
                }
            }
            
            results.push({
                pullTime: pullTime / 60, // Convert to minutes for display
                successRate: (successCount / 1000) * 100
            });
        }
        
        renderOptimizationChart(results);
    }

    function renderOptimizationChart(results) {
        const ctx = document.getElementById('optimizationChart').getContext('2d');
        
        // Calculate quadratic fit using least squares with normalized x values
        const x = results.map(r => r.pullTime);
        const y = results.map(r => r.successRate);
        
        // Normalize x values to prevent numerical instability
        const xMean = x.reduce((a, b) => a + b, 0) / x.length;
        const xNorm = x.map(xi => xi - xMean);
        
        // Calculate coefficients for y = ax^2 + bx + c using normalized x
        const n = x.length;
        const x2 = xNorm.map(xi => xi * xi);
        const x3 = xNorm.map(xi => xi * xi * xi);
        const x4 = xNorm.map(xi => xi * xi * xi * xi);
        const xy = xNorm.map((xi, i) => xi * y[i]);
        const x2y = xNorm.map((xi, i) => xi * xi * y[i]);
        
        const sum_x2 = x2.reduce((a, b) => a + b, 0);
        const sum_x3 = x3.reduce((a, b) => a + b, 0);
        const sum_x4 = x4.reduce((a, b) => a + b, 0);
        const sum_y = y.reduce((a, b) => a + b, 0);
        const sum_xy = xy.reduce((a, b) => a + b, 0);
        const sum_x2y = x2y.reduce((a, b) => a + b, 0);
        
        // Solve the normal equations
        const A = [
            [n, 0, sum_x2],
            [0, sum_x2, sum_x3],
            [sum_x2, sum_x3, sum_x4]
        ];
        const b = [sum_y, sum_xy, sum_x2y];
        
        // Gaussian elimination
        for (let i = 0; i < 3; i++) {
            const pivot = A[i][i];
            for (let j = i; j < 3; j++) A[i][j] /= pivot;
            b[i] /= pivot;
            
            for (let j = 0; j < 3; j++) {
                if (i !== j) {
                    const factor = A[j][i];
                    for (let k = i; k < 3; k++) A[j][k] -= factor * A[i][k];
                    b[j] -= factor * b[i];
                }
            }
        }
        
        const [c, b_norm, a] = b;
        // Convert back to unnormalized x
        const b_unnorm = b_norm - 2 * a * xMean;
        const c_unnorm = c + a * xMean * xMean - b_norm * xMean;

        // Generate points for quadratic curve
        const fitPoints = x.map(x_val => ({
            x: x_val,
            y: a * x_val * x_val + b_unnorm * x_val + c_unnorm
        }));

        // Find min and max y values with some padding
        const minY = Math.min(...y);
        const maxY = Math.max(...y);
        const yPadding = (maxY - minY) * 0.1;  // 10% padding

        if (optimizationChart) {
            optimizationChart.destroy();
        }

        // Find optimal point
        const optimalX = -b_unnorm / (2 * a);
        const optimalY = optimalX >= 0 && optimalX <= 10 ? 
            a * optimalX * optimalX + b_unnorm * optimalX + c_unnorm : 
            null;

        optimizationChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Success Rate (Wins + Ties)',
                    data: results.map(r => ({x: r.pullTime, y: r.successRate})),
                    borderColor: 'rgba(46, 204, 113, 1)',
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    pointRadius: 5
                },
                {
                    label: 'Quadratic Fit',
                    data: fitPoints,
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    pointRadius: 0,
                    showLine: true,
                    type: 'line',
                    tension: 0.4,
                    fill: false
                },
                // Add vertical line at optimal point if it exists
                ...(optimalX >= 0 && optimalX <= 10 ? [{
                    label: 'Optimal Time',
                    data: [{x: optimalX, y: minY - yPadding}, {x: optimalX, y: optimalY}],
                    borderColor: 'rgba(231, 76, 60, 0.8)',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    showLine: true,
                    type: 'line'
                }] : [])
                ]
            },
            options: {
                animation: false,  // Disable animation
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Goalie Pull Time (Minutes)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Success Rate (%)'
                        },
                        min: Math.max(0, minY - yPadding),
                        max: Math.min(100, maxY + yPadding)
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const dataset = context.dataset.label;
                                const x = context.parsed.x.toFixed(1);
                                const y = context.parsed.y.toFixed(1);
                                return `${dataset}: ${y}% at ${x} minutes`;
                            }
                        }
                    },
                    legend: {
                        labels: {
                            usePointStyle: true,
                            filter: function(legendItem, data) {
                                // Hide the vertical line from legend
                                return !legendItem.text.includes('Optimal Time');
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            ...(optimalX >= 0 && optimalX <= 10 ? {
                                optimalTimeLabel: {
                                    type: 'label',
                                    xValue: optimalX,
                                    yValue: optimalY,
                                    content: `${optimalX.toFixed(1)} min`,
                                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                                    color: 'white',
                                    padding: 4,
                                    borderRadius: 4,
                                    position: 'start',
                                    xAdjust: 10,
                                    yAdjust: 10
                                }
                            } : {})
                        }
                    }
                }
            }
        });

        // Add result message
        if (optimalX >= 0 && optimalX <= 10) {
            const resultMessage = document.createElement('div');
            resultMessage.className = 'result-message';
            resultMessage.style.fontSize = '1.2em';
            resultMessage.textContent = `Optimal pull time: ${optimalX.toFixed(1)} minutes (${optimalY.toFixed(1)}% success rate)`;
            document.querySelector('.chart-container').appendChild(resultMessage);
        }
    }

    // Event Listeners
    singleSimButton.addEventListener('click', () => {
        const params = getParams();
        if (isNaN(params.ourNormalProb) || params.ourNormalProb < 0) {
            alert('Please enter valid goal rates.');
            return;
        }
        singleSimButton.disabled = true;
        multiSimButton.disabled = true;
        document.getElementById('optimizeButton').disabled = true;
        
        simulateSingleGame(params).then(() => {
            singleSimButton.disabled = false;
            multiSimButton.disabled = false;
            document.getElementById('optimizeButton').disabled = false;
        });
    });

    multiSimButton.addEventListener('click', () => {
        const params = getParams();
        if (isNaN(params.ourNormalProb) || params.ourNormalProb < 0) {
            alert('Please enter valid goal rates.');
            return;
        }
        singleSimButton.disabled = true;
        multiSimButton.disabled = true;
        document.getElementById('optimizeButton').disabled = true;
        
        simulateMultipleGames(params).then(() => {
            singleSimButton.disabled = false;
            multiSimButton.disabled = false;
            document.getElementById('optimizeButton').disabled = false;
        });
    });

    document.getElementById('optimizeButton').addEventListener('click', () => {
        const params = getParams();
        if (isNaN(params.ourNormalProb) || params.ourNormalProb < 0) {
            alert('Please enter valid goal rates.');
            return;
        }
        singleSimButton.disabled = true;
        multiSimButton.disabled = true;
        document.getElementById('optimizeButton').disabled = true;
        
        findOptimalPullTime().then(() => {
            singleSimButton.disabled = false;
            multiSimButton.disabled = false;
            document.getElementById('optimizeButton').disabled = false;
        });
    });
});
