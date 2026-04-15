import { jidNormalizedUser } from '@whiskeysockets/baileys';

const ECO_CONFIG = { BASE_COL: 1000 };
const formatCol = (n) => Number(n).toLocaleString('de-DE');
const delay = (ms) => new Promise(r => setTimeout(r, ms));

const symbolsMap = {
    classic: ["💀","🔔","💎","👑","🌠","7️⃣"],
    neon: ["🟣","🔵","🟢","🟡","🔴","⚡"],
    gold: ["👑","💎","🏆","🥇","💰","🪙"],
    galaxy: ["🌌","✨","🪐","🌠","💫","⭐"],
    inferno: ["🔥","🌋","💀","⚡","☠️","🩸"]
};

const shop = {
    skins: {
        neon: 15000,
        gold: 30000,
        galaxy: 50000,
        inferno: 80000
    }
};

const lootTable = [
    { t: "coins", p: 0.55 },
    { t: "skin", p: 0.2 },
    { t: "box", p: 0.15 },
    { t: "jackpot", p: 0.07 },
    { t: "mega", p: 0.03 }
];

const missions = [
    { id: "play", goal: 5, reward: 5000 },
    { id: "win", goal: 3, reward: 7000 },
    { id: "bet", goal: 10000, reward: 10000 }
];

global.$casino = global.$casino || {
    pvp: {},
    trades: {},
    auctions: {},
    logs: []
};

const getSettings = async () => {
    let s = await global.Settings.findOne({ id: 'casino' });
    if (!s) {
        s = await global.Settings.create({
            id: 'casino',
            jackpot: 0,
            mega: 0,
            season: 1,
            resetAt: Date.now() + 604800000,
            event: null
        });
    }
    return s;
};

const secureNumber = (n) => {
    n = parseInt(n);
    if (isNaN(n) || n <= 0) return 0;
    return Math.floor(n);
};

const rollSymbol = (arr) => arr[Math.floor(Math.random()*arr.length)];

const pickLoot = () => {
    let r = Math.random(), acc = 0;
    for (let i of lootTable) {
        acc += i.p;
        if (r <= acc) return i.t;
    }
    return "coins";
};

const slotCommand = {
    name: 'slot',
    alias: ['casino','slots'],
    category: 'rpg',
    run: async (m, { conn, args, usedPrefix, command }) => {
        try {

            let sub = (args[0] || '').toLowerCase();

            let user = await global.User.findOne({ id: m.sender });
            if (!user) user = await global.User.create({
                id: m.sender,
                col: ECO_CONFIG.BASE_COL,
                xp: 0,
                level: 1,
                skin: 'classic',
                ownedSkins: ['classic'],
                inv: [],
                clan: null,
                last: 0,
                daily: { last: 0, prog: {} }
            });

            let s = await getSettings();

            if (Date.now() > s.resetAt) {
                s.season++;
                s.resetAt = Date.now() + 604800000;
                await global.User.updateMany({}, { $set: { col: ECO_CONFIG.BASE_COL } });
            }

            if (sub === 'shop') {
                let txt = '';
                for (let k in shop.skins) txt += `${k} ${formatCol(shop.skins[k])}\n`;
                return m.reply(txt);
            }

            if (sub === 'buy') {
                let item = args[1];
                if (!shop.skins[item]) return m.reply("No existe");
                if (user.col < shop.skins[item]) return m.reply("No dinero");
                user.col -= shop.skins[item];
                if (!user.ownedSkins.includes(item)) user.ownedSkins.push(item);
                await user.save();
                return m.reply(`Comprado ${item}`);
            }

            if (sub === 'skin') {
                let sk = args[1];
                if (!symbolsMap[sk]) return m.reply("No existe");
                if (!user.ownedSkins.includes(sk)) return m.reply("No tienes");
                user.skin = sk;
                await user.save();
                return m.reply(`Skin ${sk}`);
            }

            if (sub === 'inv') return m.reply(user.inv.join('\n') || 'Vacío');

            if (sub === 'open') {
                if (!user.inv.includes('box')) return m.reply("No caja");
                user.inv = user.inv.filter(x=>x!=='box');
                let loot = pickLoot();

                if (loot === "coins") user.col += Math.floor(Math.random()*10000);
                if (loot === "skin") {
                    let k = Object.keys(symbolsMap);
                    let r = k[Math.floor(Math.random()*k.length)];
                    if (!user.ownedSkins.includes(r)) user.ownedSkins.push(r);
                }
                if (loot === "box") user.inv.push('box');
                if (loot === "jackpot") { user.col += s.jackpot; s.jackpot = 0; }
                if (loot === "mega") { user.col += s.mega; s.mega = 0; }

                await user.save();
                await s.save();
                return m.reply(`Reward ${loot}`);
            }

            if (sub === 'pvp') {
                let target = m.mentionedJid?.[0];
                let amt = secureNumber(args[2]);
                if (!target || !amt) return m.reply("Uso");
                if (user.col < amt) return m.reply("No dinero");
                global.$casino.pvp[m.sender] = { t: target, a: amt };
                return m.reply("Desafío enviado");
            }

            if (sub === 'accept') {
                let k = Object.keys(global.$casino.pvp).find(x => global.$casino.pvp[x].t === m.sender);
                if (!k) return m.reply("Nada");
                let duel = global.$casino.pvp[k];

                let u1 = await global.User.findOne({ id: k });
                let u2 = user;

                let r1 = Math.random(), r2 = Math.random();

                let w = r1 > r2 ? u1 : u2;
                let l = r1 > r2 ? u2 : u1;

                w.col += duel.a;
                l.col -= duel.a;

                await w.save();
                await l.save();

                delete global.$casino.pvp[k];

                return m.reply(`Ganador ${w.id.split('@')[0]}`);
            }

            if (sub === 'clan') {
                let name = args[1];
                if (!name) return m.reply("Nombre");
                user.clan = name;
                await user.save();
                return m.reply(`Clan ${name}`);
            }

            if (sub === 'top') {
                let top = await global.User.find().sort({ col: -1 }).limit(5);
                let t = '';
                let i = 1;
                for (let u of top) {
                    t += `${i}. ${u.id.split('@')[0]} ${formatCol(u.col)}\n`;
                    i++;
                }
                return m.reply(t);
            }

            let amount = args[0] === 'all' ? user.col : secureNumber(args[0]);
            if (!amount) return m.reply(`Uso: ${usedPrefix+command}`);
            if (user.col < amount) return m.reply("No dinero");

            let now = Date.now();
            if (now - user.last < 5000) return m.reply("Cooldown");
            user.last = now;

            s.jackpot += Math.floor(amount * 0.1);
            s.mega += Math.floor(amount * 0.05);

            const symbols = symbolsMap[user.skin];

            let r1 = rollSymbol(symbols);
            let r2 = rollSymbol(symbols);
            let r3 = rollSymbol(symbols);

            const { key } = await conn.sendMessage(m.chat,{text:`[ 🌀 | 🌀 | 🌀 ]`},{quoted:m});

            await delay(250);
            await conn.sendMessage(m.chat,{text:`[ ${rollSymbol(symbols)} | 🌀 | 🌀 ]`,edit:key});
            await delay(250);
            await conn.sendMessage(m.chat,{text:`[ ${r1} | ${rollSymbol(symbols)} | 🌀 ]`,edit:key});
            await delay(400);
            await conn.sendMessage(m.chat,{text:`[ ${r1} | ${r2} | ${r3} ]`,edit:key});

            let triple = r1===r2 && r2===r3;
            let double = r1===r2 || r2===r3 || r1===r3;

            let res = 0, st = "";

            if (triple) {
                if (Math.random()<0.01) { res+=s.mega; s.mega=0; st="MEGA"; }
                else if (Math.random()<0.05) { res+=s.jackpot; s.jackpot=0; st="GLOBAL"; }
                else { res=amount*5; st="WIN"; }
            } else if (double) {
                res=amount*2; st="OK";
            } else {
                res=-amount; st="LOSE";
            }

            user.col += res;
            user.xp += Math.floor(amount/100);

            if (user.xp >= user.level*100) {
                user.xp = 0;
                user.level++;
                user.inv.push('box');
            }

            if (user.daily) {
                user.daily.prog.play = (user.daily.prog.play||0)+1;
                user.daily.prog.bet = (user.daily.prog.bet||0)+amount;
                if (res>0) user.daily.prog.win = (user.daily.prog.win||0)+1;

                for (let d of missions) {
                    if (user.daily.prog[d.id] >= d.goal) {
                        user.col += d.reward;
                        user.daily.prog[d.id] = 0;
                    }
                }
            }

            global.$casino.logs.push({ u: m.sender, a: amount, r: res, t: Date.now() });

            await user.save();
            await s.save();

            let txt = `[ ${r1} | ${r2} | ${r3} ]\n${st}\n${formatCol(res)}\n💰 ${formatCol(user.col)}\n🎁 ${formatCol(s.jackpot)}\n🌋 ${formatCol(s.mega)}\n🏆 S${s.season} Lv${user.level}`;

            await delay(250);
            await conn.sendMessage(m.chat,{text:txt,edit:key});

        } catch(e){
            console.error(e);
            await m.react("⚠️");
        }
    }
};

export default slotCommand;
