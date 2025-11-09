exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { reg, mileage } = JSON.parse(event.body);

        // Validate input
        if (!reg || reg.length < 5) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Invalid reg format' })
            };
        }

        if (mileage && (isNaN(mileage) || mileage < 0)) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Invalid mileage value' })
            };
        }

        // Mock data response
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

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(mockData)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Something went wrong!' })
        };
    }
};

