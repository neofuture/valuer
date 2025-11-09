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
        <h3>${data.make} ${data.model} (${data.year})</h3>
        <p><strong>Mileage:</strong> ${data.mileage} miles</p>
        <p><strong>Valuation:</strong> £${data.low_price} – £${data.high_price} (Avg: £${data.avg_price})</p>
      `;
    } catch (error) {
        const results = document.getElementById('results');
        results.innerHTML = `<p style="color: red;"><strong>Error:</strong> Could not connect to server. Make sure the server is running.</p>`;
        console.error('Error:', error);
    }
});