const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function debugGumtree() {
    const url = 'https://www.gumtree.com/search?search_category=cars&q=Vauxhall+Astra';

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        // Save HTML for inspection
        fs.writeFileSync('/tmp/gumtree-page.html', response.data);
        console.log('✓ Saved HTML to /tmp/gumtree-page.html');

        // Find first 3 listings and show their structure
        const items = $('[class*="listing"]').slice(0, 3);

        items.each((i, elem) => {
            const $elem = $(elem);
            console.log(`\n=== Item ${i+1} ===`);
            console.log('Classes:', $elem.attr('class'));
            console.log('HTML length:', $elem.html().length);

            // Try to find title
            console.log('\nTitle attempts:');
            console.log('  h2:', $elem.find('h2').text().trim().substring(0, 50));
            console.log('  h3:', $elem.find('h3').text().trim().substring(0, 50));
            console.log('  h4:', $elem.find('h4').text().trim().substring(0, 50));
            console.log('  .title:', $elem.find('[class*="title"]').first().text().trim().substring(0, 50));

            // Try to find price
            console.log('\nPrice attempts:');
            console.log('  .price:', $elem.find('[class*="price"]').first().text().trim());
            console.log('  strong:', $elem.find('strong').first().text().trim());

            // Find link
            console.log('\nLink:');
            const link = $elem.find('a').first().attr('href');
            console.log('  href:', link ? link.substring(0, 60) : 'none');
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugGumtree();

