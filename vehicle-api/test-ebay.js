const axios = require('axios');
const cheerio = require('cheerio');

async function testEbay() {
    try {
        const searchUrl = 'https://www.ebay.co.uk/sch/Cars/9801/i.html?_nkw=Vauxhall+Astra+2019&_sop=15';
        console.log('Fetching:', searchUrl);

        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            },
            timeout: 10000
        });

        console.log('Response status:', response.status);
        console.log('Response length:', response.data.length);

        const $ = cheerio.load(response.data);

        // Try different selectors
        console.log('\nTrying li.s-item:', $('li.s-item').length);
        console.log('Trying .s-item:', $('.s-item').length);
        console.log('Trying article:', $('article').length);
        console.log('Trying .srp-results li:', $('.srp-results li').length);

        // Get first few items to see structure
        console.log('\n=== First 3 items ===');
        $('li.s-item').slice(0, 3).each((i, elem) => {
            const $elem = $(elem);
            console.log(`\nItem ${i}:`);
            console.log('  Title:', $elem.find('.s-item__title').text().trim());
            console.log('  Price:', $elem.find('.s-item__price').text().trim());
            console.log('  Has link:', $elem.find('.s-item__link').length > 0);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testEbay();

