function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    const numPoints = parseInt(getParameterByName('points')) || 40;
    
    function generateData(intercept,slope,error,numPoints) {
    return d3.range(numPoints).map(() => {
        const x = Math.random() * 10;
        const noise = (Math.random() - 0.5) * error; // Noise between -1 and 1
        const y = intercept + slope * x + noise;
        return {x, y};
    });
    }
    
    function calculateOLS(data) {
        const n = data.length;
        const sumX = d3.sum(data, d => d.x);
        const sumY = d3.sum(data, d => d.y);
        const sumXY = d3.sum(data, d => d.x * d.y);
        const sumXX = d3.sum(data, d => d.x * d.x);
        const sumYY = d3.sum(data, d => d.y * d.y);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R-squared
        const yMean = sumY / n;
        const ssTotal = sumYY - n * yMean * yMean;
        const ssResidual = d3.sum(data, d => Math.pow(d.y - (intercept + slope * d.x), 2));
        const rSquared = 1 - (ssResidual / ssTotal);

        // Calculate p-value
        const df = n - 2;
        const sse = ssResidual;
        const mse = sse / df;
        const seBeta1 = Math.sqrt(mse / (sumXX - sumX * sumX / n));
        const tStat = Math.abs(slope / seBeta1);
        const pValue = 2 * (1 - jStat.studentt.cdf(tStat, df));

        return { slope, intercept, rSquared, pValue, seBeta1 };
    }

    function generateDataLoop(targetIntercept, targetSlope, targetR2, targetPValue, tolerance = 0.5, maxAttempts = 10000) {
        let data, optimalLine;
        attempts = 0;
        trialerror = 0.5;
        trialnumpoints = numPoints;
        do {
            data = generateData(targetIntercept, targetSlope, trialerror, trialnumpoints);
            optimalLine = calculateOLS(data);
            attempts++;
            if (attempts >= maxAttempts) {
                console.warn(`Failed to generate optimal line within ${maxAttempts} attempts.`);
                alert("no");
                break;
            }
            // Adjust trialerror based on R-squared
            if (optimalLine.rSquared > targetR2 + 0.1) {
                trialerror *= 1.5; // Increase error if R-squared is too high
            } else if (optimalLine.rSquared < targetR2 - 0.1) {
                trialerror *= 0.5; // Decrease error if R-squared is too low
            }
            // Adjust trialnumpoints based on p-value
            if (optimalLine.pValue > targetPValue + 0.1) {
                trialnumpoints = Math.round(trialnumpoints * 1.5); // Increase points if p-value is too high
            } else if (optimalLine.pValue < targetPValue - 0.1) {
                trialnumpoints = Math.max(3, Math.round(trialnumpoints * 0.5)); // Decrease points if p-value is too low, but never below 5
            }
        } while (
            Math.abs(optimalLine.intercept - targetIntercept) > tolerance ||
            Math.abs(optimalLine.slope - targetSlope) > tolerance ||
            Math.abs(optimalLine.rSquared - targetR2) > 0.05 ||
            Math.abs(optimalLine.pValue - targetPValue) > 0.02
        );
        return { data, optimalLine };
    }

    function update() {
        const targetIntercept = 5; // Example target intercept
        const targetSlope = parseFloat(document.getElementById('slope-input').value);
        const targetR2 = parseFloat(document.getElementById('r2-input').value);
        const targetPValue = parseFloat(document.getElementById('pvalue-input').value);
        const { data, optimalLine } = generateDataLoop(targetIntercept, targetSlope, targetR2, targetPValue);

        const svg = d3.select("svg");
        const margin = {top: 20, right: 20, bottom: 30, left: 40};
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;
        const g = svg.select("g");

        const x = d3.scaleLinear().domain([0, 10]).range([0, width]);
        const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

        const points = g.selectAll(".point").data(data);

        points.enter().append("circle")
            .attr("class", "point")
            .attr("r", 5)
            .merge(points)
            .attr("cx", d => x(d.x))
            .attr("cy", d => y(d.y));

        points.exit().remove();

        const answerLine = g.selectAll(".answer-line").data([data]);

        answerLine.enter().append("line")
            .attr("class", "answer-line")
            .merge(answerLine)
            .attr("x1", x(0))
            .attr("y1", d => y(optimalLine.intercept))
            .attr("x2", x(10))
            .attr("y2", d => y(optimalLine.intercept + optimalLine.slope * 10));

        // Add confidence interval
        const confidenceArea = g.selectAll(".confidence-area").data([null]);

        confidenceArea.enter().append("path")
            .attr("class", "confidence-area")
            .merge(confidenceArea)
            .attr("d", () => {
                const ciPoints = d3.range(0, 11, 0.1).map(x => ({
                    x: x,
                    y: optimalLine.intercept + optimalLine.slope * x,
                    se: optimalLine.seBeta1 * x
                }));
                return d3.area()
                    .x(d => x(d.x))
                    .y0(d => y(d.y - 1.96 * d.se))
                    .y1(d => y(d.y + 1.96 * d.se))
                    (ciPoints);
            })
            .attr("fill", "lightgrey")
            .attr("opacity", 0.5);

        d3.select("#answer-info").style("display", "block").html(`
            <strong>Optimal Line (OLS):</strong><br>
            <strong>Equation:</strong> y = ${optimalLine.intercept.toFixed(2)} + ${optimalLine.slope.toFixed(2)}x<br>
            <strong>R²:</strong> ${optimalLine.rSquared.toFixed(2)}<br>
            <strong>p-value:</strong> ${optimalLine.pValue.toFixed(4)}<br>
        `);
    }

    // Initial setup
    const svg = d3.select("svg");
    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 10]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "14px");

    g.append("g")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "14px");

    // Call update function initially
    update();

    // Add event listener to the button
    document.getElementById("show-answer").addEventListener("click", update);

    //Add event listener to the slope input
    document.getElementById("slope-input").addEventListener("input", update);

    //Add event listener to the r2 input
    document.getElementById("r2-input").addEventListener("input", update);

    //Add event listener to the p-value input
    document.getElementById("pvalue-input").addEventListener("input", update);

    // Add CSS for the confidence area
    const style = document.createElement('style');
    style.textContent = `
        .confidence-area {
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);