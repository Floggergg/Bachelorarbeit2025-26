__attribute__((used)) int strategy(const float *prices, int length) {
    const int window = 22;
    const float threshold = 0.035f;

    if (length < window) {
        return 0;
    }

    float sum = 0.0f;
    for (int i = 0; i < window; i++) {
        sum += prices[i];
    }
    float sma = sum / window;

    float latestPrice = prices[length - 1];
    float diff = (latestPrice - sma) / sma;

    if (diff < -threshold) {
        return 1;
    } else if (diff > threshold) {
        return -1;
    } else {
        return 0;
    }
}