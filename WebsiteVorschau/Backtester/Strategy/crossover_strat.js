function strategy(prices, intervalsBack) {
    function movingAverageSlice(data, start, end) {
        if (end <= start) {
            return 0;
        }
        let sum = 0;
        for (let i = start; i < end; i++) {
            sum += data[i];
        }
        return sum / (end - start);
    }

    const shortPeriod = 8;
    const longPeriod = 23;

    if (prices.length < longPeriod + 1) {
        return 0;
    }

    const currentPrice = prices[prices.length - 1];
    const threshold = currentPrice * 0.002;

    const length = prices.length;
    const prevEnd = length - 1;
    const prevShortStart = prevEnd - shortPeriod;
    const prevLongStart = prevEnd - longPeriod;

    if (prevShortStart < 0 || prevLongStart < 0) {
        return 0;
    }

    const shortPrev = movingAverageSlice(prices, prevShortStart, prevEnd);
    const longPrev = movingAverageSlice(prices, prevLongStart, prevEnd);

    const currShortStart = length - shortPeriod;
    const currLongStart = length - longPeriod;

    const shortCurr = movingAverageSlice(prices, currShortStart, length);
    const longCurr = movingAverageSlice(prices, currLongStart, length);

    const diffPrev = shortPrev - longPrev;
    const diffCurr = shortCurr - longCurr;

    if (diffPrev < 0 && diffCurr > 0 && Math.abs(diffCurr) >= threshold) {
        return 1;
    }
    if (diffPrev > 0 && diffCurr < 0 && Math.abs(diffCurr) >= threshold) {
        return -1;
    }
    return 0;
}