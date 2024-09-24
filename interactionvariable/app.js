// Coefficients for the models
const coefficients = {
    beta0: 100,    // Intercept
    beta1: 0.2,    // Advertising Spend coefficient
    beta2: 50,     // Store Type coefficient (Online vs Physical)
    beta3: 0.1     // Interaction coefficient
};

// DOM Elements
const storeTypeSelect = document.getElementById('storeType');
const adSpendInput = document.getElementById('adSpend');
const adSpendValue = document.getElementById('adSpendValue');
const includeInteractionCheckbox = document.getElementById('includeInteraction');

// Update displayed spend value
function updateAdSpendValue() {
    adSpendValue.textContent = adSpendInput.value;
}

// Calculate predicted sales
function calculateSales(adSpend, storeType, includeInteraction) {
    // Encode store type: Online = 0, Physical = 1
    const storeTypeEncoded = storeType === 'physical' ? 1 : 0;

    let sales = coefficients.beta0 +
                coefficients.beta1 * adSpend +
                coefficients.beta2 * storeTypeEncoded;

    if (includeInteraction) {
        sales += coefficients.beta3 * adSpend * storeTypeEncoded;
    }
    return sales;
}

// Generate data for plotting
function generatePlotData(includeInteraction) {
    const adSpendRange = [...Array(21).keys()].map(x => x * 50); // 0 to 1000 step 50
    const onlineSales = [];
    const physicalSales = [];

    for (let i = 0; i < adSpendRange.length; i++) {
        const adSpend = adSpendRange[i];
        const onlineSale = calculateSales(adSpend, 'online', includeInteraction);
        const physicalSale = calculateSales(adSpend, 'physical', includeInteraction);

        onlineSales.push({
            x: adSpend,
            y: onlineSale
        });

        physicalSales.push({
            x: adSpend,
            y: physicalSale
        });
    }

    return { onlineSales, physicalSales };
}

// Plotting function
function plotData() {
    const includeInteraction = includeInteractionCheckbox.checked;
    const { onlineSales, physicalSales } = generatePlotData(includeInteraction);

    const traceOnline = {
        x: onlineSales.map(point => point.x),
        y: onlineSales.map(point => point.y),
        mode: 'lines+markers',
        name: 'Online Store',
        line: { color: 'blue' }
    };

    const tracePhysical = {
        x: physicalSales.map(point => point.x),
        y: physicalSales.map(point => point.y),
        mode: 'lines+markers',
        name: 'Physical Store',
        line: { color: 'red' }
    };

    const layout = {
        title: includeInteraction ? 'With Interaction Term' : 'Without Interaction Term',
        xaxis: { title: 'Advertising Spend ($)' },
        yaxis: { title: 'Predicted Sales ($)' },
        margin: { t: 50 }
    };

    Plotly.newPlot('plot', [traceOnline, tracePhysical], layout);
}

// Event Listeners
adSpendInput.addEventListener('input', () => {
    updateAdSpendValue();
    plotData();
});

includeInteractionCheckbox.addEventListener('change', () => {
    plotData();
});

storeTypeSelect.addEventListener('change', () => {
    plotData();
});

// Initial Setup
updateAdSpendValue();
plotData();
