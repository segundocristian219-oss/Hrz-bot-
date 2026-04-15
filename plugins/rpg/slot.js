import { jidNormalizedUser } from '@whiskeysockets/baileys';

const format = n => Number(n).toLocaleString('de-DE');
const delay = ms => new Promise(r => setTimeout(r, ms));

global.$casino = global.$casino || {
    locks: new Map(),
    pvp: {},
    market: [],
    logs: []
};

const symbolsMap = {
    classic: ["💀","🔔","💎","👑","🌠","7️⃣"],
    neon: ["🟣","🔵","🟢","🟡","🔴","⚡"],
    gold: ["👑","💎","🏆","🥇","💰","🪙"],
    galaxy: ["🌌","✨","🪐","🌠","💫","⭐"]
};

const shop = {
    skins: { neon:15000, gold:30000, galaxy:50000 }
};

const missions = [
    { id:"play", goal:5, reward:5000 },
    { id:"win", goal:3, reward:7000 },
    { id:"bet", goal:10000, reward:10000 }
];

const roll = arr => arr[Math.floor(Math.random()*arr.length)];

const lock = id => {
    if (global.$casino.locks.has(id)) return false;
    global.$casino.locks.set(id, true);
    return true;
};

const unlock = id => global.$casino.locks.delete(id);

const cmd = {
name:'slot',
alias:['casino'],
category:'rpg',

run: async (m,{conn,args,usedPrefix,command})=>{
try{

let sub = (args[0]||'').toLowerCase();

let user = await global.User.findOne({id:m.sender});
if(!user) user = await global.User.create({
id:m.sender,col:1000,xp:0,level:1,skin:'classic',
ownedSkins:['classic'],inv:[],clan:null,last:0,
daily:{prog:{}}
});

let s = await global.Settings.findOne({id:'casino'});
if(!s) s = await global.Settings.create({
id:'casino',jackpot:0,mega:0,season:1,reset:Date.now()+604800000
});

if(Date.now()>s.reset){
s.season++;
s.reset=Date.now()+604800000;
await global.User.updateMany({},{$set:{col:1000}});
}

if(sub==='shop'){
let t='';
for(let k in shop.skins) t+=`${k}: ${format(shop.skins[k])}\n`;
return m.reply(t);
}

if(sub==='buy'){
let item=args[1];
if(!shop.skins[item]) return m.reply("No existe");
if(user.col<shop.skins[item]) return m.reply("No dinero");
user.col-=shop.skins[item];
if(!user.ownedSkins.includes(item)) user.ownedSkins.push(item);
await user.save();
return m.reply("Comprado");
}

if(sub==='skin'){
let sk=args[1];
if(!symbolsMap[sk]) return m.reply("No existe");
if(!user.ownedSkins.includes(sk)) return m.reply("No tienes");
user.skin=sk;
await user.save();
return m.reply("Equipado");
}

if(sub==='top'){
let top=await global.User.find().sort({col:-1}).limit(5);
let txt='';
let i=1;
for(let u of top){
txt+=`${i}. ${u.id.split('@')[0]} ${format(u.col)}\n`; i++;
}
return m.reply(txt);
}

if(sub==='pvp'){
let t=m.mentionedJid?.[0];
let a=parseInt(args[2]);
if(!t||!a) return m.reply("Uso");
if(user.col<a) return m.reply("No dinero");
global.$casino.pvp[m.sender]={t,a};
return m.reply("Desafío enviado");
}

if(sub==='accept'){
let k=Object.keys(global.$casino.pvp).find(x=>global.$casino.pvp[x].t===m.sender);
if(!k) return m.reply("Nada");
let duel=global.$casino.pvp[k];

let u1=await global.User.findOne({id:k});
let u2=user;

let w=Math.random()>0.5?u1:u2;
let l=w===u1?u2:u1;

w.col+=duel.a;
l.col-=duel.a;

await w.save(); await l.save();

delete global.$casino.pvp[k];

return m.reply(`Ganador ${w.id.split('@')[0]}`);
}

let amount = args[0]==='all'?user.col:parseInt(args[0]);

if(!amount||amount<=0) return m.reply(`Uso: ${usedPrefix+command} <cantidad>`);
if(user.col<amount) return m.reply("No dinero");
if(Date.now()-user.last<3000) return m.reply("Cooldown");
if(!lock(m.sender)) return m.reply("Procesando...");

user.last=Date.now();

s.jackpot+=Math.floor(amount*0.1);
s.mega+=Math.floor(amount*0.05);

const symbols=symbolsMap[user.skin];

let r1=roll(symbols);
let r2=roll(symbols);
let r3=roll(symbols);

const {key}=await conn.sendMessage(m.chat,{text:`[ 🌀 | 🌀 | 🌀 ]`},{quoted:m});

await delay(300);
await conn.sendMessage(m.chat,{text:`[ ${roll(symbols)} | 🌀 | 🌀 ]`,edit:key});
await delay(300);
await conn.sendMessage(m.chat,{text:`[ ${r1} | ${roll(symbols)} | 🌀 ]`,edit:key});
await delay(500);
await conn.sendMessage(m.chat,{text:`[ ${r1} | ${r2} | ${r3} ]`,edit:key});

let triple=r1===r2&&r2===r3;
let double=r1===r2||r2===r3||r1===r3;

let res=0,st="LOSE";

if(triple){
if(Math.random()<0.01){res+=s.mega; s.mega=0; st="MEGA";}
else if(Math.random()<0.05){res+=s.jackpot; s.jackpot=0; st="GLOBAL";}
else{res=amount*5; st="WIN";}
}else if(double){
res=amount*2; st="OK";
}else res=-amount;

user.col+=res;
user.xp+=Math.floor(amount/100);

if(user.xp>=user.level*100){
user.xp=0;
user.level++;
user.inv.push('box');
}

user.daily.prog.play=(user.daily.prog.play||0)+1;
user.daily.prog.bet=(user.daily.prog.bet||0)+amount;
if(res>0) user.daily.prog.win=(user.daily.prog.win||0)+1;

for(let d of missions){
if(user.daily.prog[d.id]>=d.goal){
user.col+=d.reward;
user.daily.prog[d.id]=0;
}
}

global.$casino.logs.push({u:m.sender,a:amount,r:res});

await user.save();
await s.save();

let txt=`[ ${r1} | ${r2} | ${r3} ]
${st}
${res>0?'+':''}${format(res)}
💰 ${format(user.col)}
🎰 ${format(s.jackpot)}
🌋 ${format(s.mega)}
🏆 S${s.season} Lv${user.level}`;

await delay(300);
await conn.sendMessage(m.chat,{text:txt,edit:key});

unlock(m.sender);

}catch(e){
console.error(e);
unlock(m.sender);
await m.react("⚠️");
}
}
};

export default cmd;
