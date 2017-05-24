const { compose, reverse, map, split, mergeAll, pipe, prop, pick, curry } = require('ramda');

let d = new Date();

const date = compose(
    fDate => d.setFullYear(...fDate),
    a => (d = new Date()) && a,
    reverse,
    map(parseInt),
    split('/'),
    prop('effectiveDate'));

const curateAccount = curry((uid, a) => mergeAll([{uid, bankId: 'ing_es'}, a]));
const inheritAccount = a => ({uid: a.uid, bankId: a.bankId, accountId: a.id});
const curateProduct = curry((a, p) => mergeAll([inheritAccount(a), {id: p.uuid}, p]));
const inheritProduct = p => ({uid: p.uid, productId: p.id, bankId: p.bankId});
const curateTransaction = curry((p, t) => mergeAll([inheritProduct(p), {execDate: date(t), id: t.uuid}, t]));

module.exports = {
    curateAccount,
    curateProduct,
    curateTransaction
};