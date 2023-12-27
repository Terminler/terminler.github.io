const cheerio = require('cheerio');
const { log } = require('console');
const fs = require('fs');
const path = require('path'); 

const FILE = path.join(__dirname+'/../',process.env['EXPORT_HTML_FILE'] || '');
const JSON_FILE = path.join(__dirname+'/../',process.env['EXPORT_JSON_FILE'] || '');


fs.readFile(FILE, 'utf-8',(error, fileContents) => {
    if (error) {
        throw error;
    }
    
    const $ = cheerio.load(fileContents);


    var data = {
        'meta': [],
        'tags': [],
        'terms': []
    };

    data['meta'].push({
        "title": $("#glossary-page-title").text().replace(/\s{2,}/g, ' ').trim(),
        "description": $("#glossary-page-about p").text().replace(/\s{2,}/g, ' ').trim(),
        "sources": []
    })

    var sources = $("#glossary-page-about ul li").children("a")

    for(var s = 0; s < sources.length; s++){
        const source = $(sources[s]);


        data['meta'][0]['sources'].push({
            "url": source.attr('href'),
            "title": source.text().replace(/\s{2,}/g, ' ').trim(),
        })
    }

    var glossaries = $('article dl').children();

    for(var i = 0; i < glossaries.length; i++){
        const glossary = $(glossaries[i]);

        const relatedTerms = glossary.find('dd.related-terms').children('a')
        const relatedTermsData = [];

        for(var j = 0; j < relatedTerms.length; j++){
            const relatedTerm = $(relatedTerms[j]);
            
            relatedTermsData.push({
                'id': relatedTerm.attr('href').replace('#',""),
                'title': relatedTerm.text(),
            })

        }

        const glossaryTags = glossary.find('dd.tags').children('button')
        const glossaryTagsData = [];


        for(var c = 0; c < glossaryTags.length; c++){
            const glossaryTag = $(glossaryTags[c]);

            
            glossaryTagsData.push({
                'title': glossaryTag.text(),
            })

        }


        data['terms'].push({
            id: glossary.find('dt dfn').attr('id'),
            title: glossary.find('dt dfn a').text().replace(/\s{2,}/g, ' ').trim(),
            description: glossary.find('dd').text().replace(/\s{2,}/g, ' ').trim(),
            date: glossary.attr('data-last-updated'),
            relatedTerms:relatedTermsData,
            tags:glossaryTagsData
        })
    }

    var tags = $('#glossary-page-tags dl').children();


    for(var i = 0; i < tags.length; i++){
        const tag = $(tags[i]);

        data['tags'].push({
            title: tag.find('dt').text().replace(/\s{2,}/g, ' ').trim(),
            description: tag.find('dd').text().replace(/\s{2,}/g, ' ').trim(),
        })
    }

    fs.writeFile(JSON_FILE, JSON.stringify(data), 'utf8', (err) => {
        if (err) return console.log(err);

        console.log(`Total ${data['terms'].length} data exported`)
    });


});