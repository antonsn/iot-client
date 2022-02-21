const request = require('request')
const StreamZip = require('node-stream-zip')
const rimraf = require('rimraf')
const fs = require('fs-extra')



let download = (url, filename, log) => {

    return new Promise((resolve, reject) => {

        const file = fs.createWriteStream(filename)
        let receivedBytes = 0

        let interval = setInterval(() => {
            log.log("downloading " + Math.round(receivedBytes / 1000))
        }, 1000);

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

        const tempLocation = "patch"
        const tempFileName = "patch.zip"

        await download(url, tempFileName, log)

        rimraf.sync(tempLocation)

        const zip = new StreamZip.async({ file: tempFileName })
        const count = await zip.extract(null, tempLocation)

        log.log(`Extracted ${count} entries`)

        await zip.close()
        await fs.copy('patch', destination)

        log.log("patch applied")

    } catch (error) {
        log.log("error apply patch " + error.message)
    }


}


module.exports = {
    download: download,
    applyPatch: applyPatch
};