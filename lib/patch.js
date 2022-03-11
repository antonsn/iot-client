const request = require('request')
const StreamZip = require('node-stream-zip')
const rimraf = require('rimraf')
const fs = require('fs-extra')
var path = require('path');

const updateLogDownloadSec = 1
const tempLocation = "patch"
const tempFileName = "patch.zip"
var appRoot = require('app-root-path');



let download = (url, filename, log) => {

    return new Promise((resolve, reject) => {

        const file = fs.createWriteStream(filename)
        let receivedBytes = 0

        let interval = setInterval(() => {
            log.log("downloading " + Math.round(receivedBytes / 1000), 0)
        }, updateLogDownloadSec * 1000);

        request.get(url)
            .on('response', (response) => {
                if (response.statusCode !== 200) {
                    clearInterval(interval)
                    reject('Response status was ' + response.statusCode)
                }
            })
            .on('data', (chunk) => {
                receivedBytes += chunk.length


            })
            .pipe(file)
            .on('error', (err) => {
                fs.unlink(filename)
                clearInterval(interval)
                reject(err)
            })

        file.on('finish', () => {
            file.close()
            clearInterval(interval)
            resolve("finished")
        })

        file.on('error', (err) => {
            fs.unlink(filename)
            clearInterval(interval)
            reject(err)
        })
    })

}

let applyPatch = async (url, log, destination) => {

    try {

        await download(url, tempFileName, log)
        let tempPath = path.join(appRoot.path, tempLocation)


        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, { recursive: true });
        }

        const zip = new StreamZip.async({ file: tempFileName })
        const count = await zip.extract(null, tempPath)

        log.log(`Extracted ${count} entries`, 0)

        await zip.close()
        await fs.copy('patch', destination)

        log.log("patch applied", 0)

        
    } catch (error) {
        log.log("error apply patch " + error.message, 1)
    }


}


module.exports = {
    download: download,
    applyPatch: applyPatch
};