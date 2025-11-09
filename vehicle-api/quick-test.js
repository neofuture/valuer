const axios = require('axios');
const cheerio = require('cheerio');

async function quickTest() {
    try {
        console.log('Testing eBay fetch...');
        const url = 'https://www.ebay.co.uk/sch/Cars/9801/i.html?_nkw=Vauxhall+Astra+2019';

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        console.log('✓ Page fetched successfully');
        console.log('Status:', response.status);
        console.log('Content length:', response.data.length);

        const $ = cheerio.load(response.data);

        // Test different selectors
        console.log('\n=== Testing selectors ===');
        console.log('.srp-results li:', $('.srp-results li').length);
        console.log('li.s-item:', $('li.s-item').length);
        console.log('.s-item:', $('.s-item').length);
        console.log('ul.srp-results li:', $('ul.srp-results li').length);

        // Try to find ANY vehicle listings
        const allListings = [];
        $('*').each((i, elem) => {
            const $elem = $(elem);
            const text = $elem.text().toLowerCase();
            if (text.includes('vauxhall') && text.includes('astra')) {
                const tag = $(elem).prop('tagName');
                const className = $(elem).attr('class') || 'no-class';
                allListings.push({ tag, className: className.substring(0, 50) });
            }
        });

        console.log(`\nFound ${allListings.slice(0, 10).length} elements containing "vauxhall astra"`);
        allListings.slice(0, 5).forEach((item, i) => {
            console.log(`  ${i+1}. <${item.tag} class="${item.className}">`);
        });

    } catch (error) {
        console.error('✗ Error:', error.message);
    }
}

quickTest();

