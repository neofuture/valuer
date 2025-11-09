document.getElementById('lookupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const reg = document.getElementById('reg').value;
    const mileage = document.getElementById('mileage').value;

    // Determine API endpoint based on environment
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isLocal
        ? 'http://localhost:3010/lookup'
        : '/.netlify/functions/vehicle-api';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reg, mileage })
        });

        const data = await response.json();
        const results = document.getElementById('results');

        if (!response.ok) {
            results.innerHTML = `<p style="color: red;"><strong>Error:</strong> ${data.error}</p>`;
            return;
        }

        results.innerHTML = `
        <div class="results-box">
            <div class="results-header">
                Vehicle Found
            </div>
            <div class="vehicle-info">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Make</span>
                        <span class="value">${data.make}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Model</span>
                        <span class="value">${data.model}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Year</span>
                        <span class="value">${data.year}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Fuel</span>
                        <span class="value">${data.fuel}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Engine</span>
                        <span class="value">${data.engine}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Max Mileage</span>
                        <span class="value">${data.max_mileage.toLocaleString()} mi</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Low Price</span>
                        <span class="value">£${data.low_price.toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Average Price</span>
                        <span class="value">£${data.avg_price.toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">High Price</span>
                        <span class="value">£${data.high_price.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            ${data.listings && data.listings.length > 0 ? `
            <div class="listings-section">
                <h4>Available Listings (${data.listings.length})</h4>
                <div class="listings-grid">
                    ${data.listings.map(listing => `
                        <a href="${listing.link}" target="_blank" class="listing-card">
                            <img src="${listing.image}" alt="${listing.title}" class="listing-image">
                            <div class="listing-content">
                                <div class="listing-source">${listing.source}</div>
                                <h5 class="listing-title">${listing.title}</h5>
                                <div class="listing-price">£${listing.price.toLocaleString()}</div>
                                <div class="listing-details">
                                    <span>${listing.mileage.toLocaleString()} mi</span>
                                    <span>•</span>
                                    <span>${listing.location}</span>
                                </div>
                                <div class="listing-seller">${listing.seller}</div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
      `;
    } catch (error) {
        const results = document.getElementById('results');
        results.innerHTML = `<p style="color: red;"><strong>Error:</strong> Could not connect to server. Make sure the server is running.</p>`;
        console.error('Error:', error);
    }
});