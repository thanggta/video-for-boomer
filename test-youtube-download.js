#!/usr/bin/env node

const http = require('http');

const testUrl = 'https://youtu.be/TQ8WlA2GXbk?si=yGjmPa4vRvqiM4zp';

const data = JSON.stringify({ url: testUrl });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/youtube/download',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

console.log('Testing YouTube download locally...');
console.log('URL:', testUrl);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);

  let chunks = [];
  let size = 0;

  res.on('data', (chunk) => {
    chunks.push(chunk);
    size += chunk.length;
    process.stdout.write(`\rDownloaded: ${(size / 1024).toFixed(0)} KB`);
  });

  res.on('end', () => {
    console.log('\n');
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS!');
      console.log(`Total size: ${(size / 1024).toFixed(2)} KB`);
      console.log(`Duration: ${res.headers['x-video-duration']} seconds`);
      console.log(`Content-Type: ${res.headers['content-type']}`);
    } else {
      const body = Buffer.concat(chunks).toString();
      console.log('❌ FAILED:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(data);
req.end();
