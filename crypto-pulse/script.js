const COIN_GECKO_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false';

const marketGrid = document.getElementById('market-grid');
const lastUpdate = document.getElementById('last-update');
const assetCount = document.getElementById('asset-count');

async function fetchMarketData() {
    try {
        const response = await fetch(COIN_GECKO_URL);
        const data = await response.json();
        
        if (data && data.length > 0) {
            renderMarket(data);
            updateGlobalStats(data);
        }
    } catch (error) {
        console.error('Market sync failed:', error);
        // Mock data if API fails (rate limits)
        renderMockData();
    }
}

function renderMarket(assets) {
    marketGrid.innerHTML = '';
    
    assets.forEach(asset => {
        const priceChange = asset.price_change_percentage_24h;
        const colorClass = priceChange >= 0 ? 'up' : 'down';
        const indicator = priceChange >= 0 ? '▲' : '▼';
        
        const card = document.createElement('div');
        card.className = 'crypto-card';
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <span class="symbol">${asset.symbol.toUpperCase()}</span>
                    <p class="name">${asset.name}</p>
                </div>
                <img src="${asset.image}" alt="${asset.name}">
            </div>
            <div class="card-body">
                <div class="price-main">$${asset.current_price.toLocaleString()}</div>
                <div class="price-change ${colorClass}">
                    <span>${indicator}</span>
                    <span>${Math.abs(priceChange).toFixed(2)}%</span>
                    <span class="label"> (24h)</span>
                </div>
            </div>
            <div class="card-footer" style="margin-top: 1.5rem; font-size: 0.7rem; color: rgba(255,255,255,0.2)">
                <div style="display:flex; justify-content:space-between">
                    <span>Market Cap: $${(asset.market_cap / 1000000000).toFixed(2)}B</span>
                    <span>Vol: $${(asset.total_volume / 1000000000).toFixed(2)}B</span>
                </div>
            </div>
        `;
        marketGrid.appendChild(card);
    });
}

function updateGlobalStats(assets) {
    assetCount.innerText = assets.length;
    const now = new Date();
    lastUpdate.innerText = now.toLocaleTimeString();
}

function renderMockData() {
    const mockData = [
        { name: 'Bitcoin', symbol: 'btc', current_price: 64230.12, price_change_percentage_24h: 2.14, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
        { name: 'Ethereum', symbol: 'eth', current_price: 3452.88, price_change_percentage_24h: -1.05, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
        { name: 'Solana', symbol: 'sol', current_price: 142.33, price_change_percentage_24h: 12.5, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' }
    ];
    renderMarket(mockData);
}

// Initial Sync
fetchMarketData();

// Poll every 30 seconds
setInterval(fetchMarketData, 30000);
