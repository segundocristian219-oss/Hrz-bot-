import fs from 'fs';

global.owner = [['50432955554'], ['573508941325'], ['16394582266'], ['5216711089134'], ['584228028583']];
global.dev1 = '50432955554';
global.developer = '𝙳𝚎𝚢𝚕𝚒𝚗 𝙴𝚕𝚒𝚊𝚌';
global.key = process.env.API_KEY;
global.v = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;
