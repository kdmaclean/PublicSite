document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization code ...

    const TOTAL_SECONDS = 600; // 10 minutes
    const INTERVAL = 10; // 10 second intervals (changed from 5)
    const TOTAL_INTERVALS = TOTAL_SECONDS / INTERVAL;

    // ... in simulateSingleGame and simulateMultipleGames functions ...
    
    // Use probabilities directly since they're already in 10-second format
    const ourProb = isGoaliePulled ? params.ourPulledRate : params.ourNormalRate;
    const theirProb = isGoaliePulled ? params.theirPulledRate : params.theirNormalRate;
    
    const random = Math.random();
    if (random < ourProb) {
        ourScore++;
    } else if (random < ourProb + theirProb) {
        theirScore++;
    }
});

function getParams() {
    return {
        ourNormalRate: parseFloat(document.getElementById('ourNormalRate').value) / 100,
        ourPulledRate: parseFloat(document.getElementById('ourPulledRate').value) / 100,
        theirNormalRate: parseFloat(document.getElementById('theirNormalRate').value) / 100,
        theirPulledRate: parseFloat(document.getElementById('theirPulledRate').value) / 100,
        pullTimeSeconds: parseFloat(document.getElementById('pullTime').value) * 60
    };
} 