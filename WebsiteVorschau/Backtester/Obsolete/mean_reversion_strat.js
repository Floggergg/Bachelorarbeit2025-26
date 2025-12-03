function strategy(prices) {
    const window = 22;
    const threshold = 0.035;

    if (prices.length < window) {
        return 0
    }

    const sma = prices.reduce((sum, p) => sum + p, 0) / window;

    const latestPrice = prices[prices.length - 1];

    const diff = (latestPrice - sma) / sma;

    if (diff < -threshold) {
        return 1;
    } else if (diff > threshold) {
        return -1;
    } else {
        return 0;
    }
}