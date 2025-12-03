function strategy(dataPoint, state) {
    // Initialize moving averages array
    if (!window.movingAverages) {
        window.movingAverages = [];
    }
    
    // Add current price to history
    window.movingAverages.push(dataPoint.price);
    
    // Calculate moving averages
    let sma20 = 0;
    let sma10 = 0;
    
    if (window.movingAverages.length >= 20) {
        const last20 = window.movingAverages.slice(-20);
        sma20 = last20.reduce((sum, price) => sum + price, 0) / 20;
    }
    
    if (window.movingAverages.length >= 10) {
        const last10 = window.movingAverages.slice(-10);
        sma10 = last10.reduce((sum, price) => sum + price, 0) / 10;
    }
    
    // Trading signals
    if (sma20 > 0 && sma10 > 0) {
        // Buy when SMA10 crosses above SMA20
        if (sma10 > sma20 && state.position === 'out') {
            return { action: 'buy' };
        }
        
        // Sell when SMA10 crosses below SMA20
        if (sma10 < sma20 && state.position === 'holding') {
            return { action: 'sell' };
        }
    }
    
    // Default action
    return { action: 'hold' };
}