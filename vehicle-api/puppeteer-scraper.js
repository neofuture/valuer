const puppeteer = require('puppeteer');

/**
 * Scrape Gumtree using Puppeteer (headless Chrome)
 * This handles JavaScript-rendered content
 */
async function scrapeGumtreeWithPuppeteer(make, model, year, mileage) {
    let browser;
    try {
        console.log('Launching headless browser for Gumtree...');

        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        const searchQuery = `${make} ${model}`;
        const searchUrl = `https://www.gumtree.com/search?search_category=cars&q=${encodeURIComponent(searchQuery)}`;

        console.log(`Navigating to: ${searchUrl}`);

        // Navigate and wait for content to load
        await page.goto(searchUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for listings to appear
        await page.waitForSelector('article, [class*="listing"]', { timeout: 10000 });

        // Extract listings data
        const listings = await page.evaluate(() => {
            const results = [];
            const seenLinks = new Set();

            // Try to find listing elements
            const listingElements = document.querySelectorAll('article, [class*="listing"]');

            listingElements.forEach((elem) => {
                if (results.length >= 5) return;

                // Find link
                const linkElem = elem.querySelector('a[href*="/p/"]');
                if (!linkElem) return;

                const link = linkElem.href;
                if (seenLinks.has(link)) return;
                seenLinks.add(link);

                // Find title
                const titleElem = elem.querySelector('h3, h2, [class*="title"]');
                const title = titleElem ? titleElem.textContent.trim() : '';
                if (!title || title.length < 5) return;

                // Find price
                const priceElem = elem.querySelector('[class*="price"]');
                let priceText = priceElem ? priceElem.textContent : '';
                priceText = priceText.replace(/[£,\s]/g, '');
                const price = parseInt(priceText) || 0;
                if (price < 500 || price > 100000) return;

                // Find location
                const locationElem = elem.querySelector('[class*="location"]');
                const location = locationElem ? locationElem.textContent.trim() : 'UK';

                // Find image
                const imgElem = elem.querySelector('img');
                let image = imgElem ? (imgElem.src || imgElem.dataset.src) : '';
                if (!image || image.includes('data:image')) {
                    image = 'https://via.placeholder.com/300x200/FF9800/ffffff?text=Gumtree';
                }

                // Extract mileage from text
                const allText = elem.textContent.toLowerCase();
                let vehicleMileage = 0;
                const mileageMatch = allText.match(/(\d+)[,\s]*(?:000\s*)?(?:miles|mi)/i);
                if (mileageMatch) {
                    vehicleMileage = parseInt(mileageMatch[1].replace(/,/g, ''));
                    if (vehicleMileage < 1000 && allText.includes('000')) {
                        vehicleMileage *= 1000;
                    }
                }

                results.push({
                    source: 'Gumtree',
                    title: title.substring(0, 100),
                    price,
                    mileage: vehicleMileage,
                    location: location.substring(0, 50),
                    image,
                    link,
                    seller: allText.includes('dealer') || allText.includes('trade') ? 'Dealer' : 'Private Seller'
                });
            });

            return results;
        });

        console.log(`Gumtree (Puppeteer): Found ${listings.length} listings`);

        await browser.close();
        return listings;

    } catch (error) {
        console.error('Gumtree Puppeteer error:', error.message);
        if (browser) {
            await browser.close();
        }
        return [];
    }
}

/**
 * Scrape eBay using Puppeteer
 */
async function scrapeEbayWithPuppeteer(make, model, year, mileage) {
    let browser;
    try {
        console.log('Launching headless browser for eBay...');

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        const searchQuery = `${make} ${model} ${year}`;
        const searchUrl = `https://www.ebay.co.uk/sch/Cars/9801/i.html?_nkw=${encodeURIComponent(searchQuery)}`;

        console.log(`Navigating to: ${searchUrl}`);

        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('.s-item, [class*="item"]', { timeout: 10000 });

        const listings = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('.s-item');

            items.forEach((elem, index) => {
                if (index === 0) return; // Skip first ad
                if (results.length >= 5) return;

                const titleElem = elem.querySelector('.s-item__title');
                const title = titleElem ? titleElem.textContent.trim() : '';
                if (!title || title.includes('Shop on eBay')) return;

                const priceElem = elem.querySelector('.s-item__price');
                let priceText = priceElem ? priceElem.textContent : '';
                priceText = priceText.replace(/[£,]/g, '').split(' ')[0];
                const price = parseInt(priceText) || 0;
                if (price < 500) return;

                const linkElem = elem.querySelector('.s-item__link');
                const link = linkElem ? linkElem.href : '';

                const imgElem = elem.querySelector('.s-item__image-img');
                const image = imgElem ? imgElem.src : 'https://via.placeholder.com/300x200/2196F3/ffffff?text=eBay';

                const locationElem = elem.querySelector('.s-item__location');
                const location = locationElem ? locationElem.textContent.trim() : 'UK';

                const allText = elem.textContent.toLowerCase();
                let vehicleMileage = 0;
                const mileageMatch = allText.match(/(\d+)[,\s]*miles/i);
                if (mileageMatch) {
                    vehicleMileage = parseInt(mileageMatch[1].replace(/,/g, ''));
                }

                results.push({
                    source: 'eBay Motors',
                    title: title.substring(0, 100),
                    price,
                    mileage: vehicleMileage,
                    location: location.substring(0, 50),
                    image,
                    link,
                    seller: allText.includes('dealer') ? 'Dealer' : 'Private Seller'
                });
            });

            return results;
        });

        console.log(`eBay (Puppeteer): Found ${listings.length} listings`);

        await browser.close();
        return listings;

    } catch (error) {
        console.error('eBay Puppeteer error:', error.message);
        if (browser) {
            await browser.close();
        }
        return [];
    }
}

module.exports = {
    scrapeGumtreeWithPuppeteer,
    scrapeEbayWithPuppeteer
};

