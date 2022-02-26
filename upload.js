const fs = require('fs')
const path = require('path')
var ass2srt = require('ass-to-srt')
const OS = require('opensubtitles-api')
const xmlJsonify = require("xml-jsonify")

const OpenSubtitles = new OS({
    useragent: 'UserAgent',
    username: 'shanyanwcx',
    password: 'aasz12345',
    ssl: true
})

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name)
        var stat = fs.statSync(filePath)
        if (stat.isFile()) {
            callback(filePath, stat)
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback)
        }
    })
}

async function walkNfos() {
    var nfos = []
    walkSync('./nfos', (filePath, stat) => {
        nfos.push(filePath)
    })
    return nfos
}

async function walkSubs(nfo) {
    var sub = undefined
    walkSync('./subtitles', (filePath, stat) => {
        if (filePath == nfo.replace('.nfo', '.ass')) {
            sub = filePath
        }
    })
    return sub
}

async function uploadSub(nfo, subpath) {
    var imdbid = await getIMDBid(nfo)
    if (imdbid != undefined && subpath != undefined) {
        try {
            var status = await OpenSubtitles.upload({
                imdbid: imdbid,
                subpath: subpath,
                sublanguageid: 'chi',
                highdefinition: true,
            })
            console.log(status)
        } catch (error) {
            console.log(error)
            fs.appendFileSync('./Failed.txt', nfo + ' (upload error: ' + error + ')\n')
        }
    } else {
        if (imdbid == undefined && subpath != undefined) {
            fs.appendFileSync('./Failed.txt', nfo + ' (lose IMDBid)\n')
        } else if (imdbid != undefined && subpath == undefined) {
            fs.appendFileSync('./Failed.txt', nfo + ' (lose Subtitle)\n')
        } else {
            fs.appendFileSync('./Failed.txt', nfo + ' (lose both)\n')
        }
    }
}

async function getIMDBid(nfo) {
    var xml = fs.readFileSync(nfo)
    var imdbid = undefined
    xmlJsonify(xml, (err, data) => {
        imdbid = data.imdbid
    })
    return imdbid
}

async function test(nfos) {
    var sub_id = []
    for (i in nfos) {
        var subpath = undefined
        walkSync('./subtitles', (filePath, stat) => {
            if (filePath == nfos[i].replace('.nfo', '.ass')) {
                subpath = filePath
            }
        })
        var imdbid = await getIMDBid(nfos[i])
        var temp = {
            imdbid: imdbid,
            subpath: subpath
        }
        sub_id.push(temp)
    }
    return sub_id
}

async function main() {
    // OpenSubtitles.login().then(res => {
    //     console.log('Token: ' + res.token)
    //     console.log(res.userinfo)
    // }).catch(err => {
    //     console.log(err)
    // })
    var nfos = await walkNfos()
    var sub_id = await test(nfos)
    console.log(sub_id)
}

main()

fs.openFile('input.ass', function(err, data) {
    var output = ass2srt(data);
    console.log(output);
  });