const { __, map, has, curry, merge, compose, prop, split, reverse } = require('ramda');
const { stringify } = require('querystring');
const { request, postImage64 } = require('./utils/request');
// const ai = require('../ai');
const { buildHeaders, addHeader } = require('./utils/headers');

const { curateAccount, curateProduct, curateTransaction } = require('./data');

const Headers = {
    Origin: 'https://ing.ingdirect.es',
    Host: 'ing.ingdirect.es',
    Referer: 'https://ing.ingdirect.es/pfm'
};

const PATHS = [
    '/genoma_login/rest/session',       // 0
    '/genoma_api/login/auth/response',  // 1
    '/genoma_api/rest/client',          // 2
    '/genoma_api/rest/products',        // 3
    '/genoma_api/rest/movements',       // 4
];

const st = JSON.parse;

let TENSOR = 'http://localhost:5000/recognize';

function Ing(user, uid, recognitionUrl) {
    TENSOR = recognitionUrl || TENSOR;

    let credentialHeaders = null;
    // Start auth
    if (!validate(user)) throw new Error('Missing user data on auth');

    this.user = Object.assign(
        {},
        user,
        { device: 'desktop' }
    );

    this.auth = async () => credentialHeaders = await auth(this.user);
    this.getAccount = () => getAccount(credentialHeaders, uid);
    this.getProducts = account => getProducts(credentialHeaders, account);
    this.getTransactionDetail = query => getTransactionDetail(credentialHeaders, query);
    this.getTransactions = query => getTransactions(credentialHeaders, query);
}

const validate = function (user) {
    const ifHas = has(__, user);

    return ifHas('loginDocument')
        && ifHas('birthday')
        && ifHas('password');
};

const prepareAuthHeaders = res => {
    let h = buildHeaders(Headers);

    h = Object.assign({}, h, res.headers);

    delete h['x-content-type-options'];
    delete h['x-xss-protection'];
    delete h.vary;

    h = addHeader(h, 'Cookie', res.headers['set-cookie'].join(';'));
    h = addHeader(h, 'X-Requested-With', 'XMLHttpRequest');
    h = addHeader(h, 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    h = addHeader(h, 'content-type', 'application/json; charset=utf-8');

    return h;
};

const auth = async function (user) {
    const headers = buildHeaders(Headers);
    const req = {
        hostname: 'ing.ingdirect.es',
        path: PATHS[0],
        method: 'POST',
        headers
    };

    var { data, res } = await request(req, {loginDocument: user.loginDocument, birthday: user.birthday, device: user.device}, false);

    req.headers = addHeader(req.headers, 'Cookie', res.headers['set-cookie'][0]);
    req.method = 'PUT';

    var { data, res } = await request(req, await resolvePin(user, st(data)));

    req.path = PATHS[1];
    req.method = 'POST';
    req.headers = addHeader(req.headers, 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

    req.headers = addHeader(req.headers, 'Connection', 'keep-alive');

    var { data, res } = await request(req, generateTicket(st(data)), true);

    return prepareAuthHeaders(res);
};

const decodePins = (pins) => {
    let promises = map(postImage64(TENSOR), pins);
    return Promise.all(promises);
}

const resolvePin = async function ({ password }, {pinpad, pinPositions}) {
    let pinNumbers =  await decodePins(pinpad);
    pinNumbers = map(parseInt, pinNumbers);

    let send = {
        pinPositions: [],
    };

    send.pinPositions = map(pos => pinNumbers.indexOf(parseInt(password[pos - 1])), pinPositions);

    return send;
};

const generateTicket = data => ({ticket: data.ticket, device: 'desktop'});
const generateReq = (cred, path) => ({
    hostname: 'ing.ingdirect.es',
    path,
    method: 'GET',
    headers: cred
});

// Account
const getAccount = async function (cred, uid) {
    let { data } = await request(generateReq(cred, PATHS[2]));
    return curateAccount(uid, st(data));
};

// Product
const getProducts = async (cred, account) => {
    const { data } = await request(generateReq(cred, PATHS[3]));
    const products = st(data);
    const curate = curateProduct(account);
    return map(curate, products);
};

// Transactions
const transactionRequest = (cred, {pid, limit, offset}) => {
    let req = generateReq(cred, PATHS[3]);
    req.path += '/' + pid + '/movements?' + stringify({limit, offset});
    return req;
};

const getTransactions = async (cred, {product, limit, offset}) => {
    const { data, res } = await request(transactionRequest(cred, {pid: product.id, limit, offset}));
    const elements = st(data).elements;
    if (!elements) return console.log(data, query) || [];
    const curate = curateTransaction(product);
    return map(curate, elements);
};

const getTransactionDetail = async (cred, t) => {
    const req = generateReq(cred, PATHS[4]);
    req.path += '/' + t.uuid;
    const { data } = await request(req);
    return merge(t, st(data));
};

module.exports = Ing;