// app.js

document.addEventListener('DOMContentLoaded', () => {
    const sampleSizeInput = document.getElementById('sampleSize');
    const effectSizeInput = document.getElementById('effectSize');
    const stdDevInput = document.getElementById('stdDev');
    const alphaInput = document.getElementById('alpha');
    const canvas = document.getElementById('chart');
  
    let chart;
  
    function updateChart() {
      const n = parseFloat(sampleSizeInput.value);
      const delta = parseFloat(effectSizeInput.value);
      const sigma = parseFloat(stdDevInput.value);
      const alpha = parseFloat(alphaInput.value);
  
      const se = sigma / Math.sqrt(n);
      const mu0 = 0;
      const mu1 = delta;
  
      // Critical value under H0
      const zAlpha = jStat.normal.inv(1 - alpha, 0, 1);
      const xCrit = mu0 + zAlpha * se;
  
      // Power calculation
      const zBeta = (xCrit - mu1) / se;
      const beta = jStat.normal.cdf(zBeta, 0, 1);
      const power = 1 - beta;
  
      // Generate data points
      const xMin = mu0 - 4 * se;
      const xMax = mu1 + 4 * se;
      const xValues = [];
      const yH0Values = [];
      const yH1Values = [];
  
      for (let x = xMin; x <= xMax; x += (xMax - xMin) / 500) {
        xValues.push(x);
        yH0Values.push(jStat.normal.pdf(x, mu0, se));
        yH1Values.push(jStat.normal.pdf(x, mu1, se));
      }
  
      // Destroy previous chart if it exists
      if (chart) {
        chart.destroy();
      }
  
      // Create new chart
      chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: xValues,
          datasets: [
            {
              label: 'Null Hypothesis (H₀)',
              data: yH0Values,
              borderColor: 'blue',
              borderWidth: 1,
              fill: false,
              pointRadius: 0,
            },
            {
              label: 'Alternative Hypothesis (H₁)',
              data: yH1Values,
              borderColor: 'red',
              borderWidth: 1,
              fill: false,
              pointRadius: 0,
            },
          ],
        },
        options: {
          title: {
            display: true,
            text: `Statistical Power: ${(power * 100).toFixed(2)}%`,
          },
          scales: {
            xAxes: [{
              type: 'linear',
              position: 'bottom',
              ticks: {
                min: xMin,
                max: xMax,
              },
            }],
            yAxes: [{
              ticks: {
                beginAtZero: true,
              },
            }],
          },
        },
      });
    }
  
    // Add event listeners to inputs
    [sampleSizeInput, effectSizeInput, stdDevInput, alphaInput].forEach(input => {
      input.addEventListener('input', updateChart);
    });
  
    // Initial chart rendering
    updateChart();