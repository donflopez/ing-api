const { curry } = require('ramda');

const Headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3004.0 Safari/537.36',
    'Content-Type': 'application/json; charset=UTF-8',
    'Connection': 'Keep-Alive',
    'Accept-Encoding': 'gzip, deflate, sdch, br',
    'Accept-Language': 'es-ES,es;q=0.8,en;q=0.6,pt;q=0.4,gl;q=0.2'
};

const buildHeaders = (h) => Object.assign({}, h, Headers);

const addHeader = curry((headers, header, val) => Object.assign({}, headers, {[header]:val}));

module.exports = {
    addHeader,
    buildHeaders
};