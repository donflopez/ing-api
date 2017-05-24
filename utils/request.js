const { curry } = require('ramda');
const request = require('https').request;
const request2 = require('request');
const qs = require('querystring');
const zlib = require('zlib');
const { addHeader } = require('./headers');

const unzip = (resolve, reject, buff, res) => zlib.gunzip(Buffer.concat(buff), (err, result) => err ? reject(err) : resolve({data: result.toString(), res}));

module.exports = {
    request: function (opts, body, bodyString) {
        const bodystring = bodyString ? qs.stringify(body) : JSON.stringify(body);
        const bodylen = bodystring ? bodystring.length : 0;

        if (bodystring) {
            opts.headers = addHeader(opts.headers, 'Content-Length', bodylen);
        }

        return new Promise((resolve, reject) => {
            const req = request(opts, res => {

                let data = [];
                res.on('data', d => data.push(d));

                res.on('end', () => data.length > 0 ? unzip(resolve, reject, data, res) : resolve({res}));

                // if (res.statusCode.toString().charAt(0) !== '2') console.log('err') || reject(res);
            });

            req.on('error', err => console.log('err') || reject(err));

            if (bodystring) {
                req.write(bodystring);
            }

            req.end();
        });
    },

    postImage64: curry(function(url, image) {
        let file = new Buffer(image, 'base64');
        return new Promise((resolve, reject) => {
            let req = request2.post(url, (err, res, body) => {
                if (err) reject(err);
                resolve(body);
            });

            let form = req.form();

            form.append('image', file, {
                filename: 'pin.png',
                contentType: 'application/octet-stream'
            });
        })
    })
};