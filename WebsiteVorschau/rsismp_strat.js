function strategy(dataPoint, state) {
    // Initialize price history
    if (!window.priceHistory) {
        window.priceHistory = [];
    }
    
    // Add current price to history
    window.priceHistory.push(dataPoint.price);
    
    // Calculate RSI if we have enough data
    if (window.priceHistory.length >= 15) {
        const prices = window.priceHistory.slice(-15);
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i-1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / 14;
        const avgLoss = losses / 14;
        const rs = avgGain / (avgLoss || 0.0001); // Avoid division by zero
        const rsi = 100 - (100 / (1 + rs));
        
        // Trading signals
        if (rsi < 30 && state.position === 'out') {
            return { action: 'buy' };
        }
        
        if (rsi > 70 && state.position === 'holding') {
            return { action: 'sell' };
        }
    }
    
    return { action: 'hold' };
}