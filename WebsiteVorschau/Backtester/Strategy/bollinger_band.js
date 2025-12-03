function strategy(prices, intervalsBack) {
    if (prices.length < intervalsBack) {
        return 0;
    }

    const mean = prices.reduce((acc, val) => acc + val, 0) / prices.length;

    const variance = prices.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    const upperBand = mean + 3.25 * stdDev;
    const lowerBand = mean - 3.25 * stdDev;

    const lastPrice = prices[prices.length - 1];

    if (lastPrice < lowerBand) {
        return 1;
    }
    if (lastPrice > upperBand) {
        return -1;
    }
    return 0;
}