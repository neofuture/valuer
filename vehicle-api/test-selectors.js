const axios = require('axios');
const cheerio = require('cheerio');

async function findSelectors() {
    try {
        const searchUrl = 'https://www.ebay.co.uk/sch/Cars/9801/i.html?_nkw=Vauxhall+Astra+2019&_sop=15';
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        console.log('=== Testing eBay Selectors ===');
        $('.srp-results li').slice(0, 5).each((i, elem) => {
            const $elem = $(elem);
            console.log(`\n--- Item ${i} ---`);

            // Try different title selectors
            const title1 = $elem.find('h3.s-item__title').text().trim();
            const title2 = $elem.find('.s-item__title').text().trim();
            const title3 = $elem.find('h3').text().trim();
            const title4 = $elem.find('[role="heading"]').text().trim();

            console.log('Title (h3.s-item__title):', title1);
            console.log('Title (.s-item__title):', title2);
            console.log('Title (h3):', title3);
            console.log('Title ([role="heading"]):', title4);

            // Try different price selectors
            const price1 = $elem.find('.s-item__price').text().trim();
            const price2 = $elem.find('span.s-item__price').text().trim();
            const price3 = $elem.find('[class*="price"]').first().text().trim();

            console.log('Price (.s-item__price):', price1);
            console.log('Price (span.s-item__price):', price2);
            console.log('Price ([class*="price"]):', price3);

            // Link
            const link = $elem.find('a').first().attr('href');
            console.log('Link:', link ? link.substring(0, 80) + '...' : 'none');
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

findSelectors();

