const express = require('express');
const cors = require('cors');
const { scrapeValuations, calculatePriceRange } = require('./scraper');
const app = express();
const PORT = 3010;

app.use(cors());
app.use(express.json());

app.post('/lookup', async (req, res) => {
    const {reg, mileage} = req.body;

    // Validate input first
    if (!reg || reg.length < 5) {
        return res.status(400).json({error: 'Invalid reg format'});
    }

    if (mileage && (isNaN(mileage) || mileage < 0)) {
        return res.status(400).json({error: 'Invalid mileage value'});
    }

    try {
        // Mock vehicle data (in production, you'd look this up from DVLA API or database)
        const vehicleData = {
            make: 'Vauxhall',
            model: 'Astra',
            year: 2019,
            fuel: 'Petrol',
            engine: '1,399cc',
            mileage: mileage || 80000,
            max_mileage: 80000
        };

        // Scrape marketplace listings
        console.log('Starting marketplace scraping...');
        const listings = await scrapeValuations(
            vehicleData.make,
            vehicleData.model,
            vehicleData.year,
            vehicleData.mileage
        );

        // Calculate price range from scraped listings
        const priceRange = calculatePriceRange(listings);

        // Combine vehicle data with pricing and listings
        const response = {
            ...vehicleData,
            ...priceRange,
            listings: listings
        };

        console.log('Scraped listings:', listings.length, 'total');
        res.json(response);
    } catch (error) {
        console.error('Error processing lookup:', error);
        res.status(500).json({error: 'Failed to fetch vehicle data'});
    }
});

// Error handling middleware
app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({error: 'Something went wrong!'});
});

app.listen(PORT, (err) => {
    if (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
    console.log(`Vehicle Price Lookup API running on http://localhost:${PORT}`);
});