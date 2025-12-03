function strategy(prices, intervalsBack) {
    function extrema(arr) {
        let min = +Infinity, max = -Infinity;
        for (let i = 0; i < arr.length; i++) {
            const v = arr[i];
            if (v < min) min = v;
            if (v > max) max = v;
        }
        return { min, max };
    }

    if (prices.length < intervalsBack) {
        return 0;
    }

    const window = prices.slice(0, prices.length - 1);
    const { min, max } = extrema(window);
    const last = prices[prices.length - 1];

    const epsilon = 0.01;
    const longTrigger = max * (1 + epsilon);
    const shortTrigger = min * (1 - epsilon);

    if (last > longTrigger) {
        return 1;
    }
    if (last < shortTrigger) {
        return -1;
    }
    return 0;
}
