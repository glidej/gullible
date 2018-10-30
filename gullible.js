const Xray = require('x-ray');
const x = Xray();
const cheerio = require('cheerio');
const moment = require('moment');
const fs = require('fs');

async function scrape(url) {
    return x(url, {
        entries: x('.entry', [{
            date: '.date',
            body: '@html'
        }])
      }).then(page => {
        let date = moment(page.entries[0].date).format('YYYY-MM');

        return {
            [date]: page.entries.map((entry) => {
                const timestamp = moment(entry.date).format();

                const $ = cheerio.load(entry.body);
                $('a').remove();
                $('div').remove();

                let facts = $.text();
                    facts = facts.replace('\n\t\t\t\n\t\t\t', '');
                    facts = facts.split('• ');
                    facts = facts.filter((fact) => fact !== "")

                return {
                    ...entry,
                    timestamp,
                    facts
                }
            })
        };
      });
}

(async () => {
    return await x('http://gullible.info/archive.php', '#right', ['a@href']).then(links => links);
})().then(archive => {
    return Promise.all(archive.map((url) => scrape(url))).then((pages) => {
        const output = pages.reduce((accumulated, page) => {
            const date = Object.keys(page)[0];
            accumulated[date] = page[date];
            return accumulated;
        }, {});
        
        fs.writeFile(`facts.json`, JSON.stringify(output, null, '\t'), 'utf8', (err) => {
            if (err) throw err;

            console.log('saved facts');
        })
    });
});

