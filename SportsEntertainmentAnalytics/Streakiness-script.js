document.addEventListener('DOMContentLoaded', () => {
    const singleSeasonButton = document.getElementById('singleSeasonButton');
    const multiSeasonButton = document.getElementById('multiSeasonButton');
    const goalRateInput = document.getElementById('goalRate');
    const spinner = document.getElementById('spinner');
    const seasonVisualization = document.getElementById('seasonVisualization');
    const gameGrid = document.getElementById('gameGrid');
    const currentStreakDisplay = document.getElementById('currentStreak');
    const longestStreakDisplay = document.getElementById('longestStreak');
    const ctx = document.getElementById('streakChart').getContext('2d');
    const totalGoalsDisplay = document.getElementById('totalGoals');
    let streakChart;

    // Initialize game grid
    function initializeGameGrid() {
        gameGrid.innerHTML = '';
        for (let i = 0; i < 82; i++) {
            const cell = document.createElement('div');
            cell.className = 'game-cell';
            //cell.textContent = i + 1;
            gameGrid.appendChild(cell);
        }
    }

    // Simulate single season with animation
    async function simulateSingleSeason(goalRate) {
        seasonVisualization.style.display = 'block';
        document.querySelector('.chart-container').style.display = 'none';
        initializeGameGrid();
        
        const cells = document.querySelectorAll('.game-cell');
        let currentStreak = 0;
        let longestStreak = 0;
        let totalGoals = 0;

        for (let i = 0; i < 82; i++) {
            const goals = poissonRandom(goalRate);
            const hasGoal = goals > 0;
            totalGoals += goals;
            
            // Animate cell
            await new Promise(resolve => setTimeout(resolve, 100));
            cells[i].classList.add(hasGoal ? 'active' : 'no-goal');
            //cells[i].textContent = `${i + 1}\n(${goals})`;
            cells[i].textContent = `${goals}`;

            if (goals==0) {
                currentStreak++;
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
            } else {
                currentStreak = 0;
            }

            currentStreakDisplay.textContent = `Current Goalless Streak: ${currentStreak}`;
            longestStreakDisplay.textContent = `Longest Goalless Streak: ${longestStreak}`;
            totalGoalsDisplay.textContent = `Total Goals: ${totalGoals}`;
        }
    }

    // Original multi-season simulation (renamed from runSimulations)
    async function simulateMultipleSeasons(goalRate) {
        seasonVisualization.style.display = 'none';
        document.querySelector('.chart-container').style.display = 'block';
        return new Promise(resolve => {
            const simulations = 1000;
            const games = 82;
            const streaks = [];

            for (let i = 0; i < simulations; i++) {
                const season = [];
                for (let j = 0; j < games; j++) {
                    const goals = poissonRandom(goalRate);
                    season.push(goals);
                }
                const longestStreak = calculateLongestStreak(season);
                streaks.push(longestStreak);
            }

            // Calculate summary statistics
            const avgStreak = (streaks.reduce((a, b) => a + b, 0) / simulations).toFixed(1);
            const sortedStreaks = [...streaks].sort((a, b) => a - b);
            const p5Index = Math.floor(simulations * 0.05);
            const p95Index = Math.floor(simulations * 0.95);
            const p5Streak = sortedStreaks[p5Index];
            const p95Streak = sortedStreaks[p95Index];

            // Update the table
            document.getElementById('avgStreak').textContent = avgStreak;
            document.getElementById('p5Streak').textContent = p5Streak;
            document.getElementById('p95Streak').textContent = p95Streak;

            resolve(streaks);
        });
    }

    singleSeasonButton.addEventListener('click', () => {
        const goalRate = parseFloat(goalRateInput.value);
        if (isNaN(goalRate) || goalRate < 0) {
            alert('Please enter a valid goals per game rate.');
            return;
        }
        singleSeasonButton.disabled = true;
        multiSeasonButton.disabled = true;
        simulateSingleSeason(goalRate).then(() => {
            singleSeasonButton.disabled = false;
            multiSeasonButton.disabled = false;
        });
    });

    multiSeasonButton.addEventListener('click', () => {
        const goalRate = parseFloat(goalRateInput.value);
        if (isNaN(goalRate) || goalRate < 0) {
            alert('Please enter a valid goals per game rate.');
            return;
        }
        spinner.style.display = 'block';
        singleSeasonButton.disabled = true;
        multiSeasonButton.disabled = true;
        simulateMultipleSeasons(goalRate).then(streaks => {
            spinner.style.display = 'none';
            singleSeasonButton.disabled = false;
            multiSeasonButton.disabled = false;
            renderChart(streaks);
        });
    });

    function poissonRandom(lambda) {
        let L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        return k - 1;
    }

    function calculateLongestStreak(season) {
        let longest = 0;
        let current = 0;
        season.forEach(goals => {
            if (goals == 0) {
                current += 1;
                if (current > longest) longest = current;
            } else {
                current = 0;
            }
        });
        return longest;
    }

    function renderChart(streaks) {
        // Calculate frequency of each streak length
        const frequency = {};
        streaks.forEach(streak => {
            frequency[streak] = (frequency[streak] || 0) + 1;
        });

        // Create an array of all possible streak lengths (0 to 82)
        const labels = Array.from({length: 83}, (_, i) => i);
        // Map the data, using 0 for streak lengths that didn't occur
        const data = labels.map(label => frequency[label] || 0);

        if (streakChart) {
            streakChart.destroy();
        }

        streakChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Simulations',
                    data: data,
                    backgroundColor: 'rgba(52, 152, 219, 0.6)',
                    borderColor: 'rgba(41, 128, 185, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Longest Goalless Streak'
                        },
                        min: 0,
                        max: 82
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Frequency'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Add this function to update the per-season rate display
    function updatePerSeasonRate() {
        const goalRate = parseFloat(document.getElementById('goalRate').value);
        const perSeasonGoals = Math.round(goalRate * 82);
        document.getElementById('perSeasonRate').textContent = `or ${perSeasonGoals} goals per 82 games`;
    }

    // Add these event listeners
    document.getElementById('goalRate').addEventListener('input', updatePerSeasonRate);
    document.addEventListener('DOMContentLoaded', updatePerSeasonRate);
});
