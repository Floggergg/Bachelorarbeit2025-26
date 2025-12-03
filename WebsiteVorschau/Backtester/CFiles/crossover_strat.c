__attribute__((used)) int strategy(double* prices, int prices_length, int intervalsBack) {
    const int shortPeriod = 8;
    const int longPeriod = 23;

    if (prices_length < longPeriod + 1) {
        return 0;
    }

    const double currentPrice = prices[prices_length - 1];
    const double threshold = currentPrice * 0.002;

    double shortPrev = 0.0;
    double longPrev = 0.0;

    for (int i = prices_length - 1 - shortPeriod; i < prices_length - 1; i++) {
        shortPrev += prices[i];
    }
    shortPrev /= shortPeriod;

    for (int i = prices_length - 1 - longPeriod; i < prices_length - 1; i++) {
        longPrev += prices[i];
    }
    longPrev /= longPeriod;

    double shortCurr = 0.0;
    double longCurr = 0.0;

    for (int i = prices_length - shortPeriod; i < prices_length; i++) {
        shortCurr += prices[i];
    }
    shortCurr /= shortPeriod;

    for (int i = prices_length - longPeriod; i < prices_length; i++) {
        longCurr += prices[i];
    }
    longCurr /= longPeriod;

    const double diffPrev = shortPrev - longPrev;
    const double diffCurr = shortCurr - longCurr;

    double absDiff = diffCurr < 0.0 ? -diffCurr : diffCurr;

    if (diffPrev < 0.0 && diffCurr > 0.0 && absDiff >= threshold) {
        return 1;
    }
    if (diffPrev > 0.0 && diffCurr < 0.0 && absDiff >= threshold) {
        return -1;
    }
    return 0;
}