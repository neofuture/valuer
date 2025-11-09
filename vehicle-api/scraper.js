const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape vehicle listings from Gumtree (REAL scraping, no mocks)
 */
async function scrapeValuations(make, model, year, mileage) {
    console.log(`REAL SCRAPING: ${make} ${model} ${year} with ${mileage} miles`);

    const listings = await scrapeGumtree(make, model, year, mileage);

    console.log(`Total listings scraped: ${listings.length}`);
    return listings;
}

/**
 * Scrape Gumtree for real vehicle listings
 */
async function scrapeGumtree(make, model, year, mileage) {
    try {
        const searchQuery = `${make} ${model}`;
        const searchUrl = `https://www.gumtree.com/search?search_category=cars&q=${encodeURIComponent(searchQuery)}`;

        console.log('SCRAPING Gumtree:', searchUrl);

        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            },
            timeout: 20000,
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);
        const listings = [];
        const seenLinks = new Set();

        console.log(`Page loaded, size: ${response.data.length} bytes`);

        // Find all listing elements - try multiple selectors
        let items = $('article');
        console.log(`Found ${items.length} article elements`);

        if (items.length === 0) {
            items = $('li[class*="listing"]');
            console.log(`Trying li[class*="listing"]: ${items.length} elements`);
        }

        if (items.length === 0) {
            items = $('[class*="listing"]');
            console.log(`Trying [class*="listing"]: ${items.length} elements`);
        }

        items.each((i, elem) => {
            if (listings.length >= 10) return false;

            const $elem = $(elem);

            // Find link - must have a proper ad link
            let link = $elem.find('a[href*="/p/"]').first().attr('href');
            if (!link) link = $elem.find('a').first().attr('href');
            if (!link || !link.includes('/p/')) return;

            // Make absolute URL
            if (!link.startsWith('http')) {
                link = `https://www.gumtree.com${link}`;
            }

            // Skip duplicates
            if (seenLinks.has(link)) return;
            seenLinks.add(link);

            // Extract title
            let title = $elem.find('h2').first().text().trim();
            if (!title) title = $elem.find('h3').first().text().trim();
            if (!title) title = $elem.find('[class*="title"]').first().text().trim();

            // Clean title
            title = title.split('\n')[0].trim();
            if (!title || title.length < 5) return;

            // Extract price
            let priceText = $elem.text().match(/£([\d,]+)/);
            if (!priceText) return;

            const price = parseInt(priceText[1].replace(/,/g, ''));
            if (price < 500 || price > 100000) return;

            // Extract location
            let location = $elem.find('[class*="location"]').text().trim();
            if (!location) location = 'UK';
            location = location.split('\n')[0].trim();

            // Extract mileage from text
            const allText = $elem.text();
            let vehicleMileage = 0;
            const mileageMatch = allText.match(/(\d+)[,\s]*(miles|mi)/i);
            if (mileageMatch) {
                vehicleMileage = parseInt(mileageMatch[1].replace(/,/g, ''));
            }

            // Extract image
            let image = $elem.find('img').first().attr('src');
            if (!image || image.includes('data:image')) {
                image = 'https://via.placeholder.com/300x200/FF9800/ffffff?text=Gumtree';
            }

            // Determine seller
            const seller = allText.toLowerCase().includes('dealer') ? 'Dealer' : 'Private Seller';

            console.log(`✓ Found: ${title.substring(0, 40)}... - £${price}`);

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
        });

        console.log(`Gumtree: Successfully scraped ${listings.length} listings`);
        return listings;

    } catch (error) {
        console.error('Gumtree scrape error:', error.message);
        console.error('Stack:', error.stack);
        return [];
    }
}

/**
 * Calculate overall price range from all listings
 */
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

module.exports = {
    scrapeValuations,
    calculatePriceRange
};

