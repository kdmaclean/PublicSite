document.addEventListener('DOMContentLoaded', () => {
    const newPilotBtn = document.getElementById('newPilot');
    const renewShowBtn = document.getElementById('renewShow');
    const resetGameBtn = document.getElementById('resetGame');
    console.log('Reset button found:', resetGameBtn);
    const ctx = document.getElementById('ratingsChart').getContext('2d');
    
    let gameState = {
        year: 1,
        currentShow: null,
        currentShowAge: 0,
        ratings: [],
        showHistory: [],
        ratingsChart: null,
        newShowYears: new Set()
    };

    const RATING_PARAMS = {
        gamma: {
            shape: 0.65,    // Less than 1 gives us the power law-like shape
            scale: 6.0      // Scales it to fill our 0-10 range appropriately
        }
    };

    function generateGamma(shape, scale) {
        // Marsaglia and Tsang's method
        let d = shape - 1/3;
        let c = 1/Math.sqrt(9*d);
        while(true) {
            let x = 0;
            let v = 0;
            do {
                x = Math.random()*2-1;
                v = 1 + c*x;
            } while(v <= 0);
            
            v = v*v*v;
            let u = Math.random();
            
            if(u < 1 - 0.331*(x*x)*(x*x)) return scale*d*v;
            if(Math.log(u) < 0.5*x*x + d*(1 - v + Math.log(v))) return scale*d*v;
        }
    }

    function generatePilotHistogram() {
        const histogramCtx = document.getElementById('pilotHistogram').getContext('2d');
        const sampleSize = 1000;
        const binCount = 20;
        const samples = [];
        
        // Generate samples
        for (let i = 0; i < sampleSize; i++) {
            const rating = Math.min(10, generateGamma(RATING_PARAMS.gamma.shape, RATING_PARAMS.gamma.scale));
            samples.push(rating);
        }

        // Calculate statistics
        const mean = samples.reduce((a, b) => a + b, 0) / sampleSize;
        const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sampleSize;
        const stdDev = Math.sqrt(variance);

        // Update stats display
        const statsDiv = document.getElementById('pilotStats');
        statsDiv.innerHTML = `
            <p><strong>Average Rating:</strong> ${mean.toFixed(2)}</p>
            <p><strong>Standard Deviation:</strong> ${stdDev.toFixed(2)}</p>
        `;
        
        // Create bins
        const bins = Array(binCount).fill(0);
        samples.forEach(sample => {
            const binIndex = Math.min(Math.floor(sample * (binCount/10)), binCount-1);
            bins[binIndex]++;
        });

        // Convert to percentages
        const binPercentages = bins.map(count => (count / sampleSize) * 100);

        // Create labels for bin ranges
        const labels = bins.map((_, index) => {
            const start = (index * (10/binCount)).toFixed(1);
            const end = ((index + 1) * (10/binCount)).toFixed(1);
            return `${start}-${end}`;
        });

        new Chart(histogramCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Percentage of Pilots',
                    data: binPercentages,
                    backgroundColor: 'rgba(52, 152, 219, 0.6)',
                    borderColor: 'rgba(41, 128, 185, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percentage of Pilots'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Rating Range'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribution of Pilot Episode Ratings'
                    }
                }
            }
        });
    }

    function generateShowName() {
        const adjectives = ['Amazing', 'Dramatic', 'Funny', 'Dark', 'Wild', 'Sweet', 'Criminal', 'Mysterious', 'Brilliant', 'Gripping', 'Intense', 'Thrilling', 'Charming', 'Exciting', 'Intriguing', 'Suspenseful', 'Captivating', 'Engaging', 'Compelling', 'Fascinating'];
        const nouns = [
            'Hospital', 'Precinct', 'Academy', 'Kitchen', 'Restaurant', 'Courthouse', 'Laboratory', 
            'Agency', 'Office', 'School', 'University', 'Station', 'Factory', 'Hotel', 'Casino',
            'Manor', 'Estate', 'Palace', 'Castle', 'Island', 'Mountain', 'Valley', 'Village',
            'Mansion', 'Diner', 'Cafe', 'Theater', 'Studio', 'Gallery', 'Museum', 'Library',
            'Warehouse', 'Workshop', 'Garden', 'Farm', 'Ranch', 'Zoo', 'Sanctuary', 'Clinic',
            'Chapel', 'Temple', 'Cathedral', 'Tower', 'Plaza', 'Market', 'Mall', 'Arena',
            'Stadium', 'Harbor', 'Port', 'Airport', 'Subway', 'Bridge', 'Tunnel'
        ];
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
            nouns[Math.floor(Math.random() * nouns.length)]}`;
    }

    function generateRating(isNew, previousRating = null) {
        if (isNew) {
            // Generate gamma-distributed rating and cap it at 10
            const rating = generateGamma(RATING_PARAMS.gamma.shape, RATING_PARAMS.gamma.scale);
            return Math.min(10, rating);
        } else {
            // Existing shows tend to decline but with some variance
            const decline = Math.random() * 0.5; // 0-0.5 decline
            const variance = (Math.random() - 0.5) * 2; // -1 to 1 variance
            return Math.max(0, Math.min(10, previousRating - decline + variance));
        }
    }

    function updateChart() {
        if (gameState.ratingsChart) {
            gameState.ratingsChart.destroy();
        }

        // Create array of points where new shows started
        const newShowPoints = gameState.ratings.map((rating, index) => {
            return gameState.newShowYears.has(index + 1) ? rating : null;
        });

        gameState.ratingsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: gameState.ratings.length}, (_, i) => `${i + 1}`),
                datasets: [{
                    label: 'Ratings',
                    data: gameState.ratings,
                    borderColor: '#3498db',
                    tension: 0.1
                }, {
                    label: 'New Show',
                    data: newShowPoints,
                    pointStyle: 'star',
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    backgroundColor: '#e74c3c',
                    borderColor: '#e74c3c',
                    showLine: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Rating'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                }
            }
        });
    }

    function updateStats() {
        const totalRating = gameState.ratings.reduce((a, b) => a + b, 0);
        const avgRating = gameState.ratings.length > 0 ? totalRating / gameState.ratings.length : 0;
        
        document.getElementById('avgRating').textContent = gameState.ratings.length > 0 ? avgRating.toFixed(1) : '-';
        document.getElementById('totalRating').textContent = gameState.ratings.length > 0 ? totalRating.toFixed(1) : '-';
        document.getElementById('totalShows').textContent = gameState.showHistory.length + (gameState.currentShow ? 1 : 0);
        
        // Include current show in longest show calculation
        let allShows = [...gameState.showHistory];
        if (gameState.currentShow) {
            allShows.push({
                name: gameState.currentShow,
                seasons: gameState.currentShowAge
            });
        }
        
        const longestShow = allShows.length > 0 ? 
            Math.max(...allShows.map(show => show.seasons)) : 0;
        document.getElementById('longestShow').textContent = longestShow > 0 ? `${longestShow} seasons` : '-';
    }

    function updateDisplay() {
        document.getElementById('currentYear').textContent = `${gameState.year} / 20`;
        document.getElementById('currentShow').textContent = gameState.currentShow || 'None';
        document.getElementById('ratings').textContent = 
            gameState.ratings.length > 0 ? 
            gameState.ratings[gameState.ratings.length - 1].toFixed(1) : '-';
    }

    function endTurn(rating) {
        gameState.ratings.push(rating);
        updateChart();
        updateStats();
        updateDisplay();
        
        if (gameState.year === 20) {
            endGame();
            return;
        }
        
        gameState.year++;
        renewShowBtn.disabled = false;
        newPilotBtn.disabled = false;
    }

    function endGame() {
        newPilotBtn.disabled = true;
        renewShowBtn.disabled = true;
        const totalRating = gameState.ratings.reduce((a, b) => a + b, 0);
        alert(`Game Over!\nFinal Average Rating: ${
            (totalRating / gameState.ratings.length).toFixed(1)}\nTotal Rating: ${
            totalRating.toFixed(1)}`);
    }

    function resetGame() {
        // Destroy existing chart if it exists
        if (gameState.ratingsChart) {
            gameState.ratingsChart.destroy();
        }

        // Reset game state
        gameState = {
            year: 1,
            currentShow: null,
            currentShowAge: 0,
            ratings: [],
            showHistory: [],
            ratingsChart: null,
            newShowYears: new Set()
        };

        // Reset UI
        newPilotBtn.disabled = false;
        renewShowBtn.disabled = true;
        
        // Update displays
        updateDisplay();
        updateChart();  // This will create a fresh chart
        updateStats();
    }

    newPilotBtn.addEventListener('click', () => {
        if (gameState.currentShow) {
            gameState.showHistory.push({
                name: gameState.currentShow,
                seasons: gameState.currentShowAge
            });
        }
        
        gameState.currentShow = generateShowName();
        gameState.currentShowAge = 1;
        gameState.newShowYears.add(gameState.year);
        const rating = generateRating(true);
        
        newPilotBtn.disabled = true;
        renewShowBtn.disabled = true;
        
        endTurn(rating);
    });

    renewShowBtn.addEventListener('click', () => {
        gameState.currentShowAge++;
        const lastRating = gameState.ratings[gameState.ratings.length - 1];
        const rating = generateRating(false, lastRating);
        
        newPilotBtn.disabled = true;
        renewShowBtn.disabled = true;
        
        endTurn(rating);
    });

    resetGameBtn.addEventListener('click', () => {
        resetGame();
    });

    // Initialize game
    updateDisplay();
    updateChart();

    // Add this at the start of the existing DOMContentLoaded callback
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and hide all contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');

            // Add active class to clicked button and show corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).style.display = 'block';
            
            // Generate histogram when info tab is selected
            if (tabId === 'info') {
                generatePilotHistogram();
            }
        });
    });
});
