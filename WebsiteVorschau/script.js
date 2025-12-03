// script.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const runBacktestBtn = document.getElementById('runBacktest');
    const statusMessage = document.getElementById('statusMessage');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const strategyFileInput = document.getElementById('strategyFile');
    const fileNameElement = document.getElementById('fileName');

    // Store the custom strategy
    let customStrategy = null;

    // Results elements
    const initialCapitalValue = document.getElementById('initialCapitalValue');
    const finalValue = document.getElementById('finalValue');
    const profitLoss = document.getElementById('profitLoss');
    const returnValue = document.getElementById('return');
    const tradesTableBody = document.getElementById('tradesTableBody');

    // Chart setup
    const ctx = document.getElementById('performanceChart').getContext('2d');
    let performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Portfolio Value',
                    data: [],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 4,
                    borderDash: [5, 5],
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Stock Price',
                    data: [],
                    borderColor: '#10b981',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 14
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    title: {
                        display: true,
                        text: 'Portfolio Value',
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    title: {
                        display: true,
                        text: 'Stock Price',
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        }
    });

    // Initialize dates
    const today = new Date();
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(today.getFullYear() - 3);

    startDateInput.value = formatDate(threeYearsAgo);
    endDateInput.value = formatDate(today);

    // File upload handling
    strategyFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) {
            fileNameElement.textContent = 'No file selected';
            customStrategy = null;
            return;
        }

        fileNameElement.textContent = file.name;
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                // Create a function from the uploaded file
                const strategyCode = e.target.result;
                const strategyFunc = new Function('return ' + strategyCode)();

                // Validate the strategy function
                if (typeof strategyFunc !== 'function') {
                    throw new Error('Uploaded file must export a function');
                }

                // Test the function signature
                const testResult = strategyFunc(
                    { date: '2023-01-01', price: 100 },
                    { cash: 10000, shares: 0, position: 'out' }
                );

                if (!testResult || !testResult.action) {
                    throw new Error('Strategy must return an object with "action" property');
                }

                customStrategy = strategyFunc;
                showStatus('Strategy loaded successfully!', 'success');
            } catch (error) {
                showStatus('Error loading strategy: ' + error.message, 'error');
                customStrategy = null;
            }
        };

        reader.readAsText(file);
    });

    // Add legend toggle functionality
    function setupLegendToggle() {
        document.querySelectorAll('.legend-item').forEach(item => {
            item.style.cursor = 'pointer';

            item.addEventListener('click', function() {
                const datasetIndex = parseInt(this.getAttribute('data-dataset'));
                const meta = performanceChart.getDatasetMeta(datasetIndex);

                // Toggle visibility
                meta.hidden = meta.hidden === null ? true : !meta.hidden;

                // Update the chart
                performanceChart.update();

                // Toggle hidden class
                this.classList.toggle('hidden', meta.hidden);
            });
        });
    }
    setupLegendToggle();

    // Run backtest
    runBacktestBtn.addEventListener('click', function() {
        // Show loading status
        const strategyType = customStrategy ? 'custom' : 'built-in';
        showStatus(`Running backtest with ${strategyType} strategy...`, 'loading');

        setTimeout(() => {
            try {
                // Generate market data
                const marketData = generateMarketData();

                // Get strategy parameters
                const initialCapital = parseInt(document.getElementById('initialCapital').value);

                // Execute strategy
                const { trades, performance } = executeStrategy(
                    marketData,
                    initialCapital,
                    customStrategy
                );

                // Update results
                updateResults(
                    initialCapital,
                    performance.finalValue,
                    performance.profit,
                    performance.returnPercent,
                    trades
                );

                // Update chart
                updateChart(
                    marketData.map(d => d.date),
                    performance.strategyValues,
                    marketData.map(d => d.price)
                );

                // Show success message
                showStatus(`Backtest completed with ${trades.length} trades!`, 'success');
            } catch (error) {
                showStatus('Error: ' + error.message, 'error');
                console.error('Backtest error:', error);
            }
        }, 500);
    });

    // Initialize with sample data
    try {
        const marketData = generateMarketData();
        const initialCapital = parseInt(document.getElementById('initialCapital').value);
        const { trades, performance } = executeStrategy(
            marketData,
            initialCapital,
            null
        );

        updateResults(
            initialCapital,
            performance.finalValue,
            performance.profit,
            performance.returnPercent,
            trades
        );

        updateChart(
            marketData.map(d => d.date),
            performance.strategyValues,
            marketData.map(d => d.price)
        );
    } catch (error) {
        showStatus('Initialization error: ' + error.message, 'error');
        console.error('Initialization error:', error);
    }

    // Helper functions
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status ' + type;
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function generateMarketData() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        const interval = document.getElementById('interval').value;

        if (!startDate || !endDate || !interval) {
            throw new Error('Invalid date or interval parameters');
        }

        const data = [];
        let currentDate = new Date(startDate);
        let price = 100; // Start at $100
        let trend = 1; // Overall upward trend

        while (currentDate <= endDate) {
            // Random price movement with upward bias
            const volatility = 1.5;
            const change = (Math.random() * volatility - volatility/2) * trend;
            price = Math.max(50, price * (1 + change/100));

            // Add some upward trend
            trend += 0.001;

            data.push({
                date: currentDate.toISOString().split('T')[0],
                price: parseFloat(price.toFixed(2))
            });

            // Increment date based on interval
            if (interval === 'daily') {
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (interval === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else {
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        return data;
    }

    function executeStrategy(marketData, initialCapital, strategyFunction) {
        const trades = [];
        let cash = initialCapital;
        let shares = 0;
        let position = 'out'; // 'out' or 'holding'
        const strategyValues = [];

        // Strategy state
        let strategyState = {
            cash: initialCapital,
            shares: 0,
            position: 'out'
        };

        // Reset any global state from previous runs
        window.movingAverages = [];
        window.priceHistory = [];

        for (let i = 0; i < marketData.length; i++) {
            const dataPoint = marketData[i];
            const currentPrice = dataPoint.price;

            // If custom strategy is provided, use it
            let action = 'hold';
            let quantity = 0;

            if (strategyFunction) {
                try {
                    // Update strategy state
                    strategyState.cash = cash;
                    strategyState.shares = shares;
                    strategyState.position = position;

                    // Get action from strategy
                    const result = strategyFunction(dataPoint, strategyState);

                    if (result && result.action) {
                        action = result.action;
                        quantity = result.quantity || 0;
                    }
                } catch (error) {
                    console.error('Error in custom strategy:', error);
                    showStatus('Strategy error: ' + error.message, 'error');
                    // Continue with hold action on error
                }
            }
            // Otherwise use built-in strategy
            else {
                // Built-in strategy: buy below 120, sell above 150
                if (position === 'out' && currentPrice < 120 && cash > 0) {
                    action = 'buy';
                } else if (position === 'holding' && currentPrice > 150 && shares > 0) {
                    action = 'sell';
                }
            }

            // Process the action
            if (action === 'buy' && position === 'out' && cash > 0) {
                // Calculate how many shares we can buy
                let maxShares = Math.floor(cash / currentPrice);
                if (strategyFunction && quantity > 0) {
                    maxShares = Math.min(maxShares, quantity);
                }

                if (maxShares > 0) {
                    const cost = maxShares * currentPrice;

                    // Update position
                    shares += maxShares;
                    cash -= cost;
                    position = 'holding';

                    // Record trade
                    trades.push({
                        date: dataPoint.date,
                        action: 'buy',
                        price: currentPrice,
                        quantity: maxShares,
                        value: cost
                    });
                }
            } else if (action === 'sell' && position === 'holding' && shares > 0) {
                // Determine how many shares to sell
                let sellQuantity = shares;
                if (strategyFunction && quantity > 0) {
                    sellQuantity = Math.min(shares, quantity);
                }

                if (sellQuantity > 0) {
                    const proceeds = sellQuantity * currentPrice;

                    // Update position
                    shares -= sellQuantity;
                    cash += proceeds;
                    position = shares > 0 ? 'holding' : 'out';

                    // Record trade
                    trades.push({
                        date: dataPoint.date,
                        action: 'sell',
                        price: currentPrice,
                        quantity: sellQuantity,
                        value: proceeds
                    });
                }
            }

            // Calculate current portfolio value
            const portfolioValue = cash + (shares * currentPrice);
            strategyValues.push(portfolioValue);
        }

        // Close any open position at the last price
        if (shares > 0) {
            const lastPrice = marketData[marketData.length - 1].price;
            const proceeds = shares * lastPrice;

            trades.push({
                date: marketData[marketData.length - 1].date,
                action: 'sell',
                price: lastPrice,
                quantity: shares,
                value: proceeds
            });

            cash += proceeds;
            shares = 0;
        }

        const finalValue = strategyValues[strategyValues.length - 1];
        const profit = finalValue - initialCapital;
        const returnPercent = (profit / initialCapital) * 100;

        return {
            trades,
            performance: {
                strategyValues,
                finalValue,
                profit,
                returnPercent
            }
        };
    }

    function updateResults(initial, final, profit, returnPercent, trades) {
        // Format numbers
        initialCapitalValue.textContent = '$' + initial.toLocaleString();
        finalValue.textContent = '$' + final.toLocaleString(undefined, { maximumFractionDigits: 0 });

        // Format profit/loss
        const profitFormatted = profit >= 0 ?
            '+$' + profit.toLocaleString(undefined, { maximumFractionDigits: 0 }) :
            '-$' + (-profit).toLocaleString(undefined, { maximumFractionDigits: 0 });

        profitLoss.textContent = profitFormatted;
        profitLoss.className = profit >= 0 ? 'metric-value metric-positive' : 'metric-value metric-negative';

        // Format return
        const returnFormatted = returnPercent >= 0 ?
            '+' + returnPercent.toFixed(2) + '%' :
            returnPercent.toFixed(2) + '%';

        returnValue.textContent = returnFormatted;
        returnValue.className = returnPercent >= 0 ?
            'metric-value metric-positive' :
            'metric-value metric-negative';

        // Update trades table
        tradesTableBody.innerHTML = '';
        trades.forEach(trade => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${trade.date}</td>
                <td class="${trade.action === 'buy' ? 'buy-signal' : 'sell-signal'}">${trade.action.toUpperCase()}</td>
                <td>$${trade.price.toFixed(2)}</td>
                <td>${trade.quantity.toLocaleString()}</td>
                <td>$${trade.value.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
            `;

            tradesTableBody.appendChild(row);
        });
    }

    function updateChart(labels, strategyValues, assetPrices) {
        performanceChart.data.labels = labels;
        performanceChart.data.datasets[0].data = strategyValues;
        performanceChart.data.datasets[1].data = assetPrices;

        // Reset visibility states
        performanceChart.data.datasets.forEach((ds, i) => {
            const meta = performanceChart.getDatasetMeta(i);
            if (meta) {
                meta.hidden = null;
            }
        });

        // Reset legend styles
        document.querySelectorAll('.legend-item').forEach(item => {
            item.classList.remove('hidden');
        });

        performanceChart.update();
    }
});