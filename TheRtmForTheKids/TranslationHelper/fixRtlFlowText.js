const fs = require("fs");
const convert = require('xml-js');

fs.readFile("Sozi-RtmForTheKids-ar-playable.svg", "utf-8", function (err, data) {
    if (err) console.log(err);

    const js = convert.xml2js(data, {compact: false, spaces: 4});

    for (let [key, value] of Object.entries(js)) {
        if (key === "elements") {
            processElements(value);
        }
    }

    const xml = convert.js2xml(js, {spaces: 0});

    fs.writeFile("fixedPlayable.svg", xml, function (err, data) {
        if (err) console.log(err);

        console.log("successfully written our update xml to file");
    });
});

function processElements(elements) {
    if (typeof elements === "undefined") {
        return;
    }

    for (let i = elements.length -1; i >= 0; i--) {
        const element = elements[i];
        if (element.type === "element") {
            if (element.name === "text") {
                const texts = processText(element);
                elements.splice(i, 1, ...texts);
            }
            else {
                processElements(element.elements);
            }
        }
    };
}

function processText(rootText) {
    const texts = [];

    let lineIndex = 0;
    rootText.elements.forEach(function(element) {
        if (element.type === "element" && element.name === "tspan") {
            const textedSpan = element;
            textedSpan.name = "text";
            texts.push(textedSpan);
            textedSpan.elements = processSubSpans(textedSpan, rootText, lineIndex);

            if (rootText.attributes) {
                const attributes = Object.assign({}, rootText.attributes);
                delete attributes.id;
                if (typeof textedSpan.attributes.x !== "undefined") {
                    delete attributes.x;
                }
                if (typeof textedSpan.attributes.y !== "undefined") {
                    delete attributes.y;
                }

                if (textedSpan.attributes) {
                    Object.assign(textedSpan.attributes, attributes);
                }
                else {
                    textedSpan.attributes = attributes;
                }
            }
            lineIndex++;
        }
        
    });
    return texts;
}

function processSubSpans(textedSpan, rootText, lineIndex) {
    const elementsToProcess = textedSpan.elements;
    if (typeof elementsToProcess === "undefined") {
        return;
    }

    let x;
    if (rootText.attributes) {
        x = rootText.attributes.x;
    }

    const resElements = [];
    let firstTextTypeElement = null;
    elementsToProcess.forEach(function(element) {
        if (element.type === "element" && element.name === "tspan") {
            const subSpan = element;
            if (firstTextTypeElement) {
                firstTextTypeElement.text = firstTextTypeElement.text + getMergedText(subSpan);
            }
            else {
                resElements.push(subSpan);
                firstTextTypeElement = searchTextTypeElement(subSpan);

                if (lineIndex === 0 && isLtfString(firstTextTypeElement.text)) {
                    rootText.attributes.x = "" + (+rootText.attributes.x + firstTextTypeElement.text.length * 1.6);
                    x = rootText.attributes.x;
                }

                if (subSpan.attributes && typeof subSpan.attributes.x !== "undefined") {
                    subSpan.attributes.x = x;
                }
            }
        }
        else {
            resElements.push(element);
        }
    });
    return resElements;
}

function searchTextTypeElement(subSpan) {
    for (const element of subSpan.elements) {
        if (element.type === "text") {
            return element;
        }
    }
    return null;
}

function getMergedText(span) {
    if (!span.elements) {
        return " ";
    }
    const reducer = (accumulator, currentElement) => { 
        if (currentElement.type === "text") {
            return accumulator + currentElement.text;
        }
        else {
            return accumulator + getMergedText(currentElement);
        }
    };
    return span.elements.reduce(reducer, "");
}

function isLtfString(str) {
    var code, i, len;
  
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charAt(i);
      if ("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(code) > -1) {
        return true;
      }
    }
    return false;
}
