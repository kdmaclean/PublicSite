// app.js

document.addEventListener('DOMContentLoaded', () => {
    const sampleSizeInput = document.getElementById('sampleSize');
    const effectSizeInput = document.getElementById('effectSize');
    const sampleSizeValue = document.getElementById('sampleSizeValue');
    const effectSizeValue = document.getElementById('effectSizeValue');
    const canvas = document.getElementById('scatterplot');
    let chart;
  
    function generateData(n, effectSize) {
      const data = [];
      for (let i = 0; i < n; i++) {
        const x = Math.random() * 10;
        const noise = Math.random() * (1 - effectSize) * 10;
        const y = effectSize * x + noise;
        data.push({ x, y });
      }
      return data;
    }
  
    function updateChart() {
      const n = parseInt(sampleSizeInput.value);
      const effectSize = parseFloat(effectSizeInput.value);
  
      sampleSizeValue.textContent = n;
      effectSizeValue.textContent = effectSize.toFixed(2);
  
      const data = generateData(n, effectSize);
  
      // Extract x and y values
      const xValues = data.map(point => point.x);
      const yValues = data.map(point => point.y);
  
      // Perform linear regression
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
  
      // Calculate p-value (simplified for illustration)
      const residuals = yValues.map((y, i) => y - (slope * xValues[i] + intercept));
      const sse = residuals.reduce((sum, r) => sum + r * r, 0);
      const sst = yValues.reduce((sum, y) => sum + Math.pow(y - sumY / n, 2), 0);
      const rSquared = 1 - sse / sst;
  
      const standardError = Math.sqrt(sse / (n - 2));
      const seSlope = standardError / Math.sqrt(sumXX - Math.pow(sumX, 2) / n);
      const tStatistic = slope / seSlope;
      const degreesOfFreedom = n - 2;
      const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStatistic), degreesOfFreedom));
  
      // Determine significance
      const significance = pValue < 0.05 ? 'Significant' : 'Not Significant';
  
      // Prepare data for plotting
      const regressionLine = [
        { x: 0, y: intercept },
        { x: 10, y: slope * 10 + intercept },
      ];
  
      // Destroy previous chart if it exists
      if (chart) {
        chart.destroy();
      }
  
      // Create new chart
      chart = new Chart(canvas.getContext('2d'), {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Data Points',
              data: data,
              backgroundColor: 'blue',
            },
            {
              label: `Regression Line (${significance})`,
              type: 'line',
              data: regressionLine,
              borderColor: significance === 'Significant' ? 'green' : 'red',
              borderWidth: 2,
              fill: false,
              pointRadius: 0,
              tension: 0, // No curve
            },
          ],
        },
        options: {
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              title: { display: true, text: 'Independent Variable (X)' },
              min: 0,
              max: 10,
            },
            y: {
              title: { display: true, text: 'Dependent Variable (Y)' },
              min: 0,
              max: 10,
            },
          },
          plugins: {
            title: {
              display: true,
              text: `Relationship is ${significance} (p = ${pValue.toFixed(3)})`,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  if (context.dataset.label === 'Data Points') {
                    const x = context.raw.x.toFixed(2);
                    const y = context.raw.y.toFixed(2);
                    return `X: ${x}, Y: ${y}`;
                  }
                  return null;
                },
              },
            },
          },
        },
      });
    }
  
    // Add event listeners to inputs
    [sampleSizeInput, effectSizeInput].forEach(input => {
      input.addEventListener('input', updateChart);
    });
  
    // Initial chart rendering
    updateChart();
  });