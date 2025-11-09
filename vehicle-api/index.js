const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3010;

app.use(cors());
app.use(express.json());

app.post('/lookup', (req, res) => {
    const {reg, mileage} = req.body;

    // Validate input first
    if (!reg || reg.length < 5) {
        return res.status(400).json({error: 'Invalid reg format'});
    }

    if (mileage && (isNaN(mileage) || mileage < 0)) {
        return res.status(400).json({error: 'Invalid mileage value'});
    }

    // Then create and send the mock data
    const mockData = {
        make: 'Vauxhall',
        model: 'Astra',
        year: 2019,
        fuel: 'Petrol',
        engine: '1,399cc',
        mileage: mileage || 80000,
        max_mileage: 80000,
        low_price: 3000,
        avg_price: 3500,
        high_price: 4200
    };


    res.json(mockData);
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