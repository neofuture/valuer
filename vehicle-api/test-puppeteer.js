const { scrapeGumtreeWithPuppeteer } = require('./puppeteer-scraper');

async function test() {
    console.log('Testing Puppeteer scraper...\n');
    try {
        const listings = await scrapeGumtreeWithPuppeteer('Vauxhall', 'Astra', 2019, 45000);
        console.log(`\n✓ Found ${listings.length} listings:\n`);
        listings.forEach((l, i) => {
            console.log(`${i+1}. ${l.title}`);
            console.log(`   £${l.price} | ${l.mileage} miles | ${l.location}`);
            console.log(`   ${l.link}\n`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

test();

