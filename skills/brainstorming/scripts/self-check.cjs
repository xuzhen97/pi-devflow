const assert = require('assert');
const vm = require('vm');
const fs = require('fs');

const sent = [];
const context = {
  window: {
    sessionStorage: { getItem: () => 'key' },
    location: { host: 'localhost:1' }
  },
  document: { addEventListener() {}, querySelector: () => null },
  WebSocket: class {
    static OPEN = 1;
    constructor() { this.readyState = 1; }
    send(message) { sent.push(JSON.parse(message)); }
  },
  setTimeout() {},
  clearTimeout() {},
  Date
};
vm.runInNewContext(fs.readFileSync(__dirname + '/helper.js', 'utf8'), context);
context.window.brainstorm.choice('a');
assert.equal(sent.at(-1).choice, 'a');
console.log('brainstorming helper self-check passed');
