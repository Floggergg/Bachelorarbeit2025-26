double sqrt(double x) {
    if (x <= 0) {
        return 0;
    }
    double guess = x;
    for (int i = 0; i < 20; i++) {
        guess = 0.5 * (guess + x / guess);
    }
    return guess;
}
__attribute__((used)) int strategy(double *prices, int length, int intervalsBack) {
    if (length < intervalsBack) {
        return 0;
    }

    double sum = 0;
    for (int i = 0; i < length; i++) {
    sum += prices[i];
    }
    double mean = sum / length;

    double var_sum = 0;
    for (int i = 0; i < length; i++) {
        double diff = prices[i] - mean;
        var_sum += diff * diff;
    }
    double variance = var_sum / length;

    double stdDev = sqrt(variance);

    double upperBand = mean + 3.25 * stdDev;
    double lowerBand = mean - 3.25 * stdDev;

    double lastPrice = prices[length - 1];

    if (lastPrice < lowerBand) {
        return 1;
    }
    if (lastPrice > upperBand) {
        return -1;
    }

    return 0;
}