const axios = require('axios');
const cheerio = require('cheerio');

async function testRealScraping() {
    console.log('=== Testing Real Web Scraping ===\n');

    // Test eBay
    console.log('1. Testing eBay...');
    try {
        const ebayUrl = 'https://www.ebay.co.uk/sch/Cars/9801/i.html?_nkw=Vauxhall+Astra+2019';
        const ebayResponse = await axios.get(ebayUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-GB,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            timeout: 15000,
            maxRedirects: 5
        });

        const $ebay = cheerio.load(ebayResponse.data);

        // Count different element types
        const srpItems = $('.srp-results li').length;
        const sItems = $('li.s-item').length;
        const anyListings = $('li').length;

        console.log(`   Status: ${ebayResponse.status}`);
        console.log(`   Page size: ${(ebayResponse.data.length / 1024).toFixed(1)}KB`);
        console.log(`   .srp-results li: ${srpItems}`);
        console.log(`   li.s-item: ${sItems}`);
        console.log(`   All li elements: ${anyListings}`);

        // Try to find any price
        const anyPrice = ebayResponse.data.match(/£[\d,]+/g);
        console.log(`   Found ${anyPrice?.length || 0} price mentions`);

        // Check if we're being blocked
        if (ebayResponse.data.includes('robot') || ebayResponse.data.includes('captcha')) {
            console.log('   ⚠️  Possible bot detection!');
        } else {
            console.log('   ✓ Page loaded successfully');
        }

    } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
    }

    console.log('');

    // Test Gumtree
    console.log('2. Testing Gumtree...');
    try {
        const gumtreeUrl = 'https://www.gumtree.com/search?search_category=cars&q=Vauxhall+Astra';
        const gumtreeResponse = await axios.get(gumtreeUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-GB,en;q=0.9',
                'Referer': 'https://www.gumtree.com/',
            },
            timeout: 15000,
            maxRedirects: 5
        });

        const $gumtree = cheerio.load(gumtreeResponse.data);

        // Count different element types
        const articleMaxi = $('article.listing-maxi').length;
        const listingMaxi = $('.listing-maxi').length;
        const anyArticles = $('article').length;
        const anyListings = $('[class*="listing"]').length;

        console.log(`   Status: ${gumtreeResponse.status}`);
        console.log(`   Page size: ${(gumtreeResponse.data.length / 1024).toFixed(1)}KB`);
        console.log(`   article.listing-maxi: ${articleMaxi}`);
        console.log(`   .listing-maxi: ${listingMaxi}`);
        console.log(`   All articles: ${anyArticles}`);
        console.log(`   Elements with "listing" class: ${anyListings}`);

        // Try to find any price
        const anyPrice = gumtreeResponse.data.match(/£[\d,]+/g);
        console.log(`   Found ${anyPrice?.length || 0} price mentions`);

        // Check if we're being blocked
        if (gumtreeResponse.data.includes('robot') || gumtreeResponse.data.includes('captcha') || gumtreeResponse.data.includes('blocked')) {
            console.log('   ⚠️  Possible bot detection!');
        } else {
            console.log('   ✓ Page loaded successfully');
        }

    } catch (error) {
        console.log(`   ✗ Error: ${error.message}`);
    }

    console.log('\n=== Test Complete ===');
}

testRealScraping();

