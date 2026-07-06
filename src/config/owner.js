import fs from 'fs';

global.owner = [['217158512549931'], ['217158512549931'], ['16394582266'], ['5216711089134'], ['584228028583']];
global.dev1 = '50432955554';
global.developer = 'hernandez hrz';
global.key = process.env.API_KEY;
global.v = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;
