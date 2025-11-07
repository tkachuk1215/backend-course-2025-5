#!/usr/bin/env node
const { program } = require('commander');

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <dir>', 'cache directory');

program.parse(process.argv);

const options = program.opts();
console.log('Host:', options.host);
console.log('Port:', options.port);
console.log('Cache directory:', options.cache);
