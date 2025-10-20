'use strict';

const express = require('express');

const dotenv = require("dotenv");
dotenv.config();

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/', (req, res) => {
  const msg = `${process.env.APPNAME}`;
  res.send(`<html><head><style>body { background-color: ${process.env.COLOR}</style></head><body><h3>APP: ${msg}</h3></body></html>\n`);
});

app.get('/_status/healthz', (req, res) => {
  return res.status(200).send('OK');
})

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);