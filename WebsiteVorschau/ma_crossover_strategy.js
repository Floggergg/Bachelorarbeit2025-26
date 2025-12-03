// ma_crossover_strategy.js
// Simple Moving Average Crossover Strategy
// This strategy buys when the short-term MA crosses above the long-term MA
// and sells when the short-term MA crosses below the long-term MA

// Main strategy function
function strategy(data, state) {
    // Initialize state if needed
    if (!state) {
        state = {
            shortPeriod: 20,
            longPeriod: 50,
            position: 'out',
            closeHistory: []   // Array to store historical closing prices
        };
    }

    // Add current close price to history
    state.closeHistory.push(data.close);

    // Only calculate if we have enough historical data
    if (state.closeHistory.length >= state.longPeriod) {
        // Calculate moving averages
        const shortMA = calculateSMA(state.closeHistory, state.shortPeriod);
        const longMA = calculateSMA(state.closeHistory, state.longPeriod);

        // Previous values for comparison
        const prevShortMA = calculateSMA(state.closeHistory.slice(0, -1), state.shortPeriod);
        const prevLongMA = calculateSMA(state.closeHistory.slice(0, -1), state.longPeriod);

        // Buy signal: short MA crosses above long MA
        if (prevShortMA <= prevLongMA && shortMA > longMA && state.position !== 'long') {
            return { signal: 'buy', state: { ...state, position: 'long' } };
        }
        // Sell signal: short MA crosses below long MA
        else if (prevShortMA >= prevLongMA && shortMA < longMA && state.position === 'long') {
            return { signal: 'sell', state: { ...state, position: 'out' } };
        }
    }

    return { signal: 'hold', state };
}

// Calculate Simple Moving Average
function calculateSMA(prices, period) {
    if (prices.length < period) return 0;

    const slice = prices.slice(-period);
    const sum = slice.reduce((acc, price) => acc + price, 0);
    return sum / period;
}

// Calculate Exponential Moving Average
function calculateEMA(prices, period) {
    if (prices.length < period) return 0;

    const k = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
}

// Calculate Relative Strength Index
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Export the strategy function using module.exports
module.exports = strategy;