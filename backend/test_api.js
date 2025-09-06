const http = require('http');

http.get('http://localhost:3001/api/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try { console.log(JSON.parse(data)); } catch (e) { console.log(data); }
    process.exit(0);
  });
}).on('error', err => { console.error('ERR', err); process.exit(1); });
