# ing-api

ING api library to fetch any information needed.

## Prerequisites

- node > v7
- [a server running my ing images model](https://github.com/donflopez/ing-pinpad-recognition)

## Installation

`npm i ing-api`

## API

### new ING(cred, uid, tensorURL) => Ing

```javascript
const bank = new ING(
    {
        loginDocument: '11223344X',
        birthday: '21/03/1945',
        password: 001122
    },
    'my_user_id',
    'http://my.classifierserver.com'
);
```

### .auth() => Promise
```javascript
ing.auth().then(() => {
    // Do api requests here
});

// Async context
await ing.auth();
// Do api requests here
```

### .getAccount() => Promise<{account}>
```javascript
// Async context
const account = await ing.getAccount();
account.name // => francisco
```

### .getProducts(account) => Promise<[{product}]>
```javascript
//Async context
const products = await ing.getProducts(account);
products[0].iban // => "ESXXXX..."
```

### .getTransactions({offset, limit, product}) => Promise<[transaction]>
```javascript
// Async context
const transactions = await ing.getTransactionDetail({
    offset:0,
    limit: 10,
    product
    });
map(prop('amount'), transactions) // => [-12.95, -56.30, ...]
```

### .getTransaction({uuid: xxx}) => Promise\<transaction>
```javascript
// Async context
const transaction = await ing.getTransactionDetail({uuid: 'xxx'});
transaction.amount // => -12.95
```
