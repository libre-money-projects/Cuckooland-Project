const nunjucks = require('nunjucks');
const fs = require('fs');
//const util = require('util');
//const writeFile = util.promisify(fs.writeFile);

nunjucks.configure({ autoescape: true })
    .addGlobal('split', split)
    .addGlobal('format', format);

const versions = {
    en_version: require("./en-version.json"),
    fr_version: require("./fr-version.json"),
    cat_version: require("./cat-version.json"),
    es_version: require("./es-version.json")
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
            console.log(`'${dest}' saved!`);
        });
    }
}

const rtl_versions = {
    ar_version: require("./ar-version.json")
};

const rtl_templates = [
    'Sozi-RtmForTheKids-rtl-template.svg',
    'Cover_TheRtmForThekids-rtl-template.sla',
    'TheRtmForTheKids-rtl-template.sla'
];

for (let [key, context] of Object.entries(rtl_versions)) {
    for (const template of rtl_templates) {
        const dest = template.replace('template', key);
        fs.writeFile(dest, nunjucks.render(template, context), function(err) {
            if (err) {
                return console.log(err);
            }
            console.log(`'${dest}' saved!`);
        });
    }
}

//writeFile("./ar-version.txt", Object.values(versions.ar_version).join("\n"));

function split(message) {
    const arrayOfStrings = message.split('|');
    return arrayOfStrings.map(s=>s.trim());
}

function format(value, loc) {
    // return new Intl.NumberFormat(loc).format(value);
    if (loc === "fr") {
        return value.toString(10).replace(".", ",");
    }
    return value;
}
