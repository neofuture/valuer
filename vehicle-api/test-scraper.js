const { scrapeValuations } = require('./scraper');

async function test() {
    console.log('Testing scraper...');
    try {
        const listings = await scrapeValuations('Vauxhall', 'Astra', 2019, 45000);
        console.log('\n=== SCRAPING RESULTS ===');
        console.log(`Total listings found: ${listings.length}`);
        console.log('\nListings:');
        listings.forEach((listing, i) => {
            console.log(`\n${i + 1}. ${listing.source}`);
            console.log(`   Title: ${listing.title}`);
            console.log(`   Price: £${listing.price}`);
            console.log(`   Mileage: ${listing.mileage} mi`);
            console.log(`   Location: ${listing.location}`);
            console.log(`   Link: ${listing.link}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

test();

