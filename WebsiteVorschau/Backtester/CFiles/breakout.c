__attribute__((used)) int strategy(double *prices, int length, int intervalsBack) {
    if (length < intervalsBack) {
        return 0;
    }

    int windowLength = length - 1;
    if (windowLength <= 0) {
        return 0;
    }

    double min = prices[0];
    double max = prices[0];

    for (int i = 1; i < windowLength; i++) {
        double v = prices[i];
        if (v < min) {
            min = v;
        }
        if (v > max) {
            max = v;
        }
    }

    double last = prices[length - 1];
    double epsilon = 0.01;

    double longTrigger = max * (1.0 + epsilon);
    double shortTrigger = min * (1.0 - epsilon);

    if (last > longTrigger) {
        return 1;
    }
    if (last < shortTrigger) {
        return -1;
    }

    return 0;
}