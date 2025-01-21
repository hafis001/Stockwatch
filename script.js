const apiKey = 'YOUR_ALPHA_VANTAGE_API_KEY';  // Replace with your API key
const stocks = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'GOOGL', name: 'Google' },
    { symbol: 'AMZN', name: 'Amazon' },
];

const stockList = document.getElementById('stockList');
const updateStocksButton = document.getElementById('updateStocksButton');
const stockChartCtx = document.getElementById('stockChart').getContext('2d');

let stockChart = null;

// Stock price data for chart (to be populated dynamically)
let chartData = {
    labels: [],
    datasets: [{
        label: 'Stock Price',
        data: [],
        borderColor: '#007bff',
        borderWidth: 2,
        fill: false,
    }]
};

// Function to fetch stock prices from Alpha Vantage API
async function fetchStockPrice(symbol) {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Check if the response contains the necessary data
        if (data['Time Series (1min)']) {
            const latestTime = Object.keys(data['Time Series (1min)'])[0];
            const price = data['Time Series (1min)'][latestTime]['4. close'];
            return { price, time: latestTime };
        } else {
            throw new Error('Data not available or API limit exceeded');
        }
    } catch (error) {
        console.error('Error fetching stock data:', error);
        return { price: 'N/A', time: '' };
    }
}

// Function to update the list of stocks on the page
async function updateStockList() {
    stockList.innerHTML = '';  // Clear the stock list

    // Reset chart data on each update
    chartData.labels = [];
    chartData.datasets[0].data = [];

    for (let stock of stocks) {
        const { price, time } = await fetchStockPrice(stock.symbol);

        // Update stock list
        const stockItem = document.createElement('li');
        stockItem.innerHTML = `
            <span>${stock.name} (${stock.symbol})</span>
            <span>$${price}</span>
        `;
        stockList.appendChild(stockItem);

        // Add data to chart
        if (price !== 'N/A' && time) {
            chartData.labels.push(time);
            chartData.datasets[0].data.push(price);
        }
    }

    // Update the chart with the latest data
    if (stockChart) {
        stockChart.update();
    } else {
        createStockChart();
    }
}

// Function to create or update the stock price chart
function createStockChart() {
    stockChart = new Chart(stockChartCtx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return `$${value}`;
                        }
                    }
                }
            }
        });
}

// Event listener for the update button
updateStocksButton.addEventListener('click', updateStockList);

// Initial stock data load
updateStockList();

// Optional: Live update every 60 seconds
setInterval(updateStockList, 60000);
