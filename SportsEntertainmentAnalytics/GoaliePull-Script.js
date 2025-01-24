document.addEventListener('DOMContentLoaded', () => {
    const singleSimButton = document.getElementById('singleSimButton');
    const multiSimButton = document.getElementById('multiSimButton');
    const timeline = document.getElementById('timeline');
    const gameVisualization = document.getElementById('gameVisualization');
    const ctx = document.getElementById('resultsChart').getContext('2d');
    let resultsChart;

    const TOTAL_SECONDS = 600; // 10 minutes
    const INTERVAL = 5; // 5 second intervals
    const TOTAL_INTERVALS = TOTAL_SECONDS / INTERVAL;

    function initializeTimeline() {
        timeline.innerHTML = '';
        for (let i = 0; i < TOTAL_INTERVALS; i++) {
            const cell = document.createElement('div');
            cell.className = 'time-cell';
            timeline.appendChild(cell);
        }
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    async function simulateSingleGame(params) {
        gameVisualization.style.display = 'block';
        document.querySelector('.chart-container').style.display = 'none';
        initializeTimeline();
        
        const cells = document.querySelectorAll('.time-cell');
        let ourScore = 0;
        let theirScore = 1; // Start down by 1
        let timeRemaining = TOTAL_SECONDS;
        let isGoaliePulled = false;

        // Update initial score display
        document.getElementById('scoreDisplay').textContent = `Score: ${ourScore} - ${theirScore}`;

        for (let i = 0; i < TOTAL_INTERVALS; i++) {
            timeRemaining = TOTAL_SECONDS - (i * INTERVAL);
            
            // Only pull when down by 1 or 2 goals
            const goalDiff = theirScore - ourScore;
            isGoaliePulled = (timeRemaining <= params.pullTimeSeconds && goalDiff > 0 && goalDiff <= 2);
            
            // Calculate event probabilities for this interval
            const ourRate = isGoaliePulled ? params.ourPulledRate : params.ourNormalRate;
            const theirRate = isGoaliePulled ? params.theirPulledRate : params.theirNormalRate;
            
            // Convert per-minute rates to per-interval probabilities
            const ourProb = ourRate * (INTERVAL / 60);
            const theirProb = theirRate * (INTERVAL / 60);
            
            // Simulate interval
            const random = Math.random();
            let event = 'none';
            
            if (random < ourProb) {
                event = 'our-goal';
                ourScore++;
            } else if (random < ourProb + theirProb) {
                event = 'their-goal';
                theirScore++;
            }
            
            // Animate cell
            await new Promise(resolve => setTimeout(resolve, 50));
            cells[i].classList.add(event);
            
            // Update displays with corrected time
            document.getElementById('gameTime').textContent = 
                `Time Remaining: ${formatTime(Math.max(0, timeRemaining - INTERVAL))}`;
            document.getElementById('scoreDisplay').textContent = `Score: ${ourScore} - ${theirScore}`;
            document.getElementById('goalieStatus').textContent = `Goalie: ${isGoaliePulled ? 'Pulled' : 'In Net'}`;
        }
        
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
        
        return { ourScore, theirScore };
    }

    async function simulateMultipleGames(params) {
        gameVisualization.style.display = 'none';
        document.querySelector('.chart-container').style.display = 'block';
        
        const results = [];
        for (let i = 0; i < 1000; i++) {
            let ourScore = 0;
            let theirScore = 1;
            let timeRemaining = TOTAL_SECONDS;
            
            for (let t = 0; t < TOTAL_INTERVALS; t++) {
                timeRemaining = TOTAL_SECONDS - (t * INTERVAL);
                const goalDiff = theirScore - ourScore;
                const isGoaliePulled = (timeRemaining <= params.pullTimeSeconds && goalDiff > 0 && goalDiff <= 2);
                
                const ourRate = isGoaliePulled ? params.ourPulledRate : params.ourNormalRate;
                const theirRate = isGoaliePulled ? params.theirPulledRate : params.theirNormalRate;
                
                const ourProb = ourRate * (INTERVAL / 60);
                const theirProb = theirRate * (INTERVAL / 60);
                
                const random = Math.random();
                if (random < ourProb) {
                    ourScore++;
                } else if (random < ourProb + theirProb) {
                    theirScore++;
                }
            }
            
            results.push({ ourScore, theirScore });
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
            ourNormalRate: parseFloat(document.getElementById('ourNormalRate').value),
            ourPulledRate: parseFloat(document.getElementById('ourPulledRate').value),
            theirNormalRate: parseFloat(document.getElementById('theirNormalRate').value),
            theirPulledRate: parseFloat(document.getElementById('theirPulledRate').value),
            pullTimeSeconds: parseFloat(document.getElementById('pullTime').value) * 60
        };
    }

    // Event Listeners
    singleSimButton.addEventListener('click', () => {
        const params = getParams();
        if (isNaN(params.ourNormalRate) || params.ourNormalRate < 0) {
            alert('Please enter valid goal rates.');
            return;
        }
        singleSimButton.disabled = true;
        multiSimButton.disabled = true;
        
        // Remove any existing result message
        const existingResult = document.querySelector('.result-message');
        if (existingResult) {
            existingResult.remove();
        }
        
        simulateSingleGame(params).then(() => {
            singleSimButton.disabled = false;
            multiSimButton.disabled = false;
        });
    });

    multiSimButton.addEventListener('click', () => {
        const params = getParams();
        singleSimButton.disabled = true;
        multiSimButton.disabled = true;
        simulateMultipleGames(params).then(() => {
            singleSimButton.disabled = false;
            multiSimButton.disabled = false;
        });
    });
});
