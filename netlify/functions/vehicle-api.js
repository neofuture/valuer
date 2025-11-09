const axios = require('axios');
const cheerio = require('cheerio');

// Scraping functions
async function scrapeValuations(make, model, year, mileage) {
    console.log(`Scraping valuations for ${make} ${model} ${year} with ${mileage} miles`);

    const results = await Promise.allSettled([
        scrapeAutoTrader(make, model, year, mileage),
        scrapeEbayMotors(make, model, year, mileage),
        scrapeGumtree(make, model, year, mileage)
    ]);

    return results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value);
}

async function scrapeAutoTrader(make, model, year, _mileage) {
    try {
        const searchUrl = `https://www.autotrader.co.uk/car-search?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year-from=${year}&postcode=SW1A1AA&radius=1500`;

        console.log('Scraping AutoTrader:', searchUrl);

        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.9',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const listings = [];

        $('article[data-testid*="search-result"]').each((i, elem) => {
            if (i >= 6) return false;

            const $elem = $(elem);
            const title = $elem.find('h3').text().trim() || `${year} ${make} ${model}`;

            let priceText = $elem.find('[data-testid="search-listing-price"]').text().trim();
            priceText = priceText.replace(/[£,]/g, '');
            const price = parseInt(priceText) || 0;

            let mileageText = $elem.find('li').filter((i, el) => $(el).text().includes('miles')).text();
            mileageText = mileageText.replace(/[,\smiles]/g, '');
            const vehicleMileage = parseInt(mileageText) || 0;

            const location = $elem.find('[data-testid*="location"]').text().trim() || 'UK';
            const image = $elem.find('img').first().attr('src') || 'https://via.placeholder.com/300x200/4CAF50/ffffff?text=AutoTrader';

            const linkPath = $elem.find('a').first().attr('href') || '';
            const link = linkPath.startsWith('http') ? linkPath : `https://www.autotrader.co.uk${linkPath}`;

            const seller = $elem.find('[data-testid*="seller"]').text().trim() || 'Dealer';

            if (price > 0) {
                listings.push({
                    source: 'AutoTrader',
                    title: title.substring(0, 100),
                    price,
                    mileage: vehicleMileage,
                    location: location.substring(0, 50),
                    image,
                    link,
                    seller: seller.substring(0, 50) || 'Dealer'
                });
            }
        });

        console.log(`AutoTrader: Found ${listings.length} listings`);
        return listings;
    } catch (error) {
        console.error('AutoTrader scrape error:', error.message);
        return [];
    }
}

async function scrapeEbayMotors(make, model, year, _mileage) {
    try {
        const searchQuery = `${make} ${model} ${year}`;
        const searchUrl = `https://www.ebay.co.uk/sch/Cars/9801/i.html?_nkw=${encodeURIComponent(searchQuery)}&_sop=15`;

        console.log('Scraping eBay Motors:', searchUrl);

        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.9',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const listings = [];

        $('li.s-item').each((i, elem) => {
            if (i >= 5 || i === 0) return;

            const $elem = $(elem);
            const title = $elem.find('.s-item__title').text().trim();
            if (title.toLowerCase().includes('shop on ebay')) return;

            let priceText = $elem.find('.s-item__price').text().trim();
            priceText = priceText.replace(/[£,]/g, '').split(' ')[0];
            const price = parseInt(priceText) || 0;

            const subtitle = $elem.find('.s-item__subtitle').text().toLowerCase();
            let vehicleMileage = 0;
            const mileageMatch = subtitle.match(/(\d+)[,\s]*miles/i);
            if (mileageMatch) {
                vehicleMileage = parseInt(mileageMatch[1].replace(/,/g, ''));
            }

            const location = $elem.find('.s-item__location').text().trim() || 'UK';
            const image = $elem.find('.s-item__image-img').attr('src') || 'https://via.placeholder.com/300x200/2196F3/ffffff?text=eBay';
            const link = $elem.find('.s-item__link').attr('href') || searchUrl;
            const seller = subtitle.includes('dealer') ? 'Dealer' : 'Private Seller';

            if (price > 0 && title.length > 0) {
                listings.push({
                    source: 'eBay Motors',
                    title: title.substring(0, 100),
                    price,
                    mileage: vehicleMileage,
                    location: location.substring(0, 50),
                    image,
                    link,
                    seller
                });
            }
        });

        console.log(`eBay Motors: Found ${listings.length} listings`);
        return listings;
    } catch (error) {
        console.error('eBay Motors scrape error:', error.message);
        return [];
    }
}

async function scrapeGumtree(make, model, _year, _mileage) {
    try {
        const searchQuery = `${make} ${model}`;
        const searchUrl = `https://www.gumtree.com/search?search_category=cars&q=${encodeURIComponent(searchQuery)}`;

        console.log('Scraping Gumtree:', searchUrl);

        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.9',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const listings = [];

        $('article.listing-maxi, div.listing-maxi, li.listing-maxi').each((i, elem) => {
            if (i >= 5) return false;

            const $elem = $(elem);
            const title = $elem.find('h2, .listing-title').text().trim();
            if (!title) return;

            let priceText = $elem.find('.listing-price, .ad-price').text().trim();
            priceText = priceText.replace(/[£,]/g, '');
            const price = parseInt(priceText) || 0;

            const description = $elem.find('.listing-description, .description').text().toLowerCase();
            let vehicleMileage = 0;
            const mileageMatch = description.match(/(\d+)[,\s]*miles/i);
            if (mileageMatch) {
                vehicleMileage = parseInt(mileageMatch[1].replace(/,/g, ''));
            }

            const location = $elem.find('.listing-location, .location-name').text().trim() || 'UK';
            const image = $elem.find('img').first().attr('src') || 'https://via.placeholder.com/300x200/FF9800/ffffff?text=Gumtree';

            const linkPath = $elem.find('a').first().attr('href') || '';
            const link = linkPath.startsWith('http') ? linkPath : `https://www.gumtree.com${linkPath}`;

            const seller = description.includes('dealer') || description.includes('trade') ? 'Dealer' : 'Private Seller';

            if (price > 0 && title.length > 0) {
                listings.push({
                    source: 'Gumtree',
                    title: title.substring(0, 100),
                    price,
                    mileage: vehicleMileage,
                    location: location.substring(0, 50),
                    image,
                    link,
                    seller
                });
            }
        });

        console.log(`Gumtree: Found ${listings.length} listings`);
        return listings;
    } catch (error) {
        console.error('Gumtree scrape error:', error.message);
        return [];
    }
}

function calculatePriceRange(listings) {
    if (!listings || listings.length === 0) {
        return {
            low_price: 0,
            avg_price: 0,
            high_price: 0
        };
    }

    const prices = listings.map(l => l.price);

    return {
        low_price: Math.min(...prices),
        avg_price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        high_price: Math.max(...prices)
    };
}

// Main handler
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { reg, mileage } = JSON.parse(event.body);

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

        const vehicleData = {
            make: 'Vauxhall',
            model: 'Astra',
            year: 2019,
            fuel: 'Petrol',
            engine: '1,399cc',
            mileage: mileage || 80000,
            max_mileage: 80000
        };

        const listings = await scrapeValuations(
            vehicleData.make,
            vehicleData.model,
            vehicleData.year,
            vehicleData.mileage
        );

        const priceRange = calculatePriceRange(listings);

        const response = {
            ...vehicleData,
            ...priceRange,
            listings: listings
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(response)
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

