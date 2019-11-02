const nunjucks = require('nunjucks');
const fs = require('fs');

nunjucks.configure({ autoescape: true });

const versions = {
    en_version: require("./en-version.json"),
    fr_version: require("./fr-version.json")
};

const templates = [
    'Sozi-RtmForTheKids-template.svg',
    'Cover_TheRtmForThekids-template.sla',
    'TheRtmForTheKids-template.sla'
];

for (let [key, context] of Object.entries(versions)) {
    for (const template of templates) {
        const dest = template.replace('template', key);
        fs.writeFile(dest, nunjucks.render(template, context), function(err) {
            if (err) {
                return console.log(err);
            }
            console.log(`'${dest}' was saved!`);
        });
    }
}