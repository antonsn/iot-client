
const downloader = require('../lib/patch')


describe('download patch', function () {
    it('can download and apply', async function () {

        this.timeout(10000); 

        let log = {
            log : (msg) => {
                console.log(msg)
            }
        }

        await downloader.applyPatch("https://github.com/antonsn/iot-client/releases/download/v0.1.0/index.zip", log, "extract")

    });

});