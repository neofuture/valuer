
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape vehicle listings from various marketplaces
 */
async function scrapeValuations(make, model, year, mileage) {
    console.log(`Scraping valuations for ${make} ${model} ${year} with ${mileage} miles`);
    
    const results = await Promise.allSettled([
        scrapeAutoTrader(make, model, year, mileage),
        scrapeEbayMotors(make, model, year, mileage),
        scrapeGumtree(make, model, year, mileage)
    ]);

    // Flatten all listings from all sources
    const listings = results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value);

    console.log(`Total listings scraped: ${listings.length}`);

    return listings;
}


/**
 * Scrape AutoTrader for vehicle listings
 */
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

        // AutoTrader uses article tags for each listing
        $('article[data-testid*="search-result"]').each((i, elem) => {
            if (i >= 6) return false; // Limit to 6 listings

            const $elem = $(elem);

            // Extract title
            const title = $elem.find('h3').text().trim() || `${year} ${make} ${model}`;

            // Extract price
            let priceText = $elem.find('[data-testid="search-listing-price"]').text().trim();
            priceText = priceText.replace(/[£,]/g, '');
            const price = parseInt(priceText) || 0;

            // Extract mileage
            let mileageText = $elem.find('li').filter((i, el) => $(el).text().includes('miles')).text();
            mileageText = mileageText.replace(/[,\smiles]/g, '');
            const vehicleMileage = parseInt(mileageText) || 0;

            // Extract location
            const location = $elem.find('[data-testid*="location"]').text().trim() || 'UK';

            // Extract image
            const image = $elem.find('img').first().attr('src') || 'https://via.placeholder.com/300x200/4CAF50/ffffff?text=AutoTrader';

            // Extract link
            const linkPath = $elem.find('a').first().attr('href') || '';
            const link = linkPath.startsWith('http') ? linkPath : `https://www.autotrader.co.uk${linkPath}`;

            // Extract seller (if available)
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

/**
 * Scrape eBay Motors for vehicle listings
 */
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
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const listings = [];

        // Try multiple possible selectors for eBay's structure
        let items = $('.srp-results li.s-item');
        if (items.length === 0) {
            items = $('.srp-results .s-item');
        }
        if (items.length === 0) {
            items = $('li.s-item');
        }

        console.log(`eBay: Found ${items.length} potential items`);

        items.each((i, elem) => {
            if (listings.length >= 5) return false; // Limit to 5 listings

            const $elem = $(elem);

            // Extract title - try multiple selectors
            let title = $elem.find('h3.s-item__title').text().trim();
            if (!title) title = $elem.find('.s-item__title').text().trim();
            if (!title) title = $elem.find('h3').text().trim();

            if (!title || title.toLowerCase().includes('shop on ebay')) return;

            // Extract price - try multiple selectors
            let priceText = $elem.find('span.s-item__price').text().trim();
            if (!priceText) priceText = $elem.find('.s-item__price').text().trim();

            priceText = priceText.replace(/[£,]/g, '').split(' ')[0].split('to')[0]; // Get first price if range
            const price = parseInt(priceText) || 0;

            if (price === 0 || price > 100000) return; // Skip invalid prices

            // Extract subtitle which often contains mileage
            const subtitle = $elem.find('.s-item__subtitle').text().toLowerCase();
            let vehicleMileage = 0;
            const mileageMatch = subtitle.match(/(\d+)[,\s]*(?:miles|mi)/i) || subtitle.match(/(\d+)k/i);
            if (mileageMatch) {
                vehicleMileage = parseInt(mileageMatch[1].replace(/,/g, ''));
                if (subtitle.includes('k')) vehicleMileage *= 1000;
            }

            // Extract location
            let location = $elem.find('.s-item__location').text().trim();
            if (!location) location = $elem.find('.s-item__itemLocation').text().trim();
            if (!location) location = 'UK';

            // Extract image
            let image = $elem.find('.s-item__image-img').attr('src');
            if (!image) image = $elem.find('img').first().attr('src');
            if (!image) image = 'https://via.placeholder.com/300x200/2196F3/ffffff?text=eBay';

            // Extract link
            let link = $elem.find('.s-item__link').attr('href');
            if (!link) link = $elem.find('a').first().attr('href');
            if (!link) link = searchUrl;

            // Seller type
            const seller = subtitle.includes('dealer') || subtitle.includes('trade') ? 'Dealer' : 'Private Seller';

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
        });

        console.log(`eBay Motors: Found ${listings.length} valid listings`);
        return listings;
    } catch (error) {
        console.error('eBay Motors scrape error:', error.message);
        return [];
    }
}

/**
 * Scrape Gumtree for vehicle listings
 */
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
                'Referer': 'https://www.gumtree.com/',
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const listings = [];

        // Try multiple possible selectors for Gumtree's structure
        let items = $('article.listing-maxi');
        if (items.length === 0) items = $('.listing-maxi');
        if (items.length === 0) items = $('li.listing-maxi');
        if (items.length === 0) items = $('[class*="listing"]');

        console.log(`Gumtree: Found ${items.length} potential items`);

        items.each((i, elem) => {
            if (listings.length >= 5) return false; // Limit to 5 listings

            const $elem = $(elem);

            // Extract title - try multiple selectors
            let title = $elem.find('h2.listing-title').text().trim();
            if (!title) title = $elem.find('.listing-title').text().trim();
            if (!title) title = $elem.find('h2').text().trim();
            if (!title) title = $elem.find('[class*="title"]').text().trim();

            if (!title || title.length < 5) return;

            // Extract price - try multiple selectors
            let priceText = $elem.find('.listing-price').text().trim();
            if (!priceText) priceText = $elem.find('[class*="price"]').text().trim();
            if (!priceText) priceText = $elem.text().match(/£[\d,]+/)?.[0] || '';

            priceText = priceText.replace(/[£,]/g, '');
            const price = parseInt(priceText) || 0;

            if (price === 0 || price > 100000 || price < 500) return; // Skip invalid prices

            // Extract description for mileage
            let description = $elem.find('.listing-description').text().toLowerCase();
            if (!description) description = $elem.find('.description').text().toLowerCase();
            if (!description) description = $elem.text().toLowerCase();

            let vehicleMileage = 0;
            const mileageMatch = description.match(/(\d+)[,\s]*(?:miles|mi|k miles)/i);
            if (mileageMatch) {
                vehicleMileage = parseInt(mileageMatch[1].replace(/,/g, ''));
                if (description.includes('k')) vehicleMileage *= 1000;
            }

            // Extract location - try multiple selectors
            let location = $elem.find('.listing-location').text().trim();
            if (!location) location = $elem.find('.location-name').text().trim();
            if (!location) location = $elem.find('[class*="location"]').text().trim();
            if (!location) location = 'UK';

            // Extract image
            let image = $elem.find('img').first().attr('src');
            if (!image) image = $elem.find('img').first().attr('data-src');
            if (!image || image.includes('placeholder')) {
                image = 'https://via.placeholder.com/300x200/FF9800/ffffff?text=Gumtree';
            }

            // Extract link
            let link = $elem.find('a').first().attr('href');
            if (link && !link.startsWith('http')) {
                link = `https://www.gumtree.com${link}`;
            }
            if (!link) link = searchUrl;

            // Seller type - look for dealer keywords
            const seller = description.includes('dealer') || description.includes('trade') || description.includes('warranted')
                ? 'Dealer'
                : 'Private Seller';

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

        console.log(`Gumtree: Found ${listings.length} valid listings`);
        return listings;
    } catch (error) {
        console.error('Gumtree scrape error:', error.message);
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

/**
 * Helper function to simulate delay (for rate limiting)
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    scrapeValuations,
    calculatePriceRange
};

