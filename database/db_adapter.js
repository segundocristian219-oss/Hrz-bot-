import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import mongoose from 'mongoose';

const DB_DIR = path.join(process.cwd(), 'database');
const SQLITE_PATH = path.join(DB_DIR, 'local_database.db');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const _generateObjectId = () => {
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return timestamp + random;
};

class FakeObjectId {
    constructor(hex) {
        this._hex = hex || _generateObjectId();
    }
    toString() { return this._hex; }
    toHexString() { return this._hex; }
    toJSON() { return this._hex; }
    equals(other) { return this._hex === (other?._hex || other?.toString()); }
}

class LocalDocument {
    constructor(data, model) {
        const plain = data instanceof LocalDocument ? data._toPlain() : { ...data };
        if (!plain._id) {
            plain._id = new FakeObjectId();
        } else if (typeof plain._id === 'string') {
            plain._id = new FakeObjectId(plain._id);
        }
        if (plain.__v === undefined) plain.__v = 0;
        Object.assign(this, plain);
        Object.defineProperty(this, '_model', { value: model, enumerable: false, writable: true });
    }

    async save() {
        const id = this.id || (this.userId && this.groupId ? `${this.userId}_${this.groupId}` : null) || this.botId;
        if (!id) return this;
        this._model._set(id, this._toPlain());
        return this;
    }

    _toPlain() {
        const obj = {};
        for (const key of Object.keys(this)) {
            obj[key] = this[key];
        }
        if (this._id) obj._id = this._id;
        if (this.__v !== undefined) obj.__v = this.__v;
        return obj;
    }

    toObject() {
        return this._toPlain();
    }

    toJSON() {
        const obj = this._toPlain();
        if (obj._id instanceof FakeObjectId) obj._id = obj._id.toHexString();
        return obj;
    }
}


class LocalQuery {
    constructor(promise, model) {
        this._promise = promise;
        this._model = model;
        this._lean = false;
        this._sort = null;
        this._limitVal = null;
        this._skipVal = null;
        this._select = null;
    }

    lean() {
        this._lean = true;
        return this;
    }

    sort(sortObj) {
        this._sort = sortObj;
        return this;
    }

    limit(n) {
        this._limitVal = n;
        return this;
    }

    skip(n) {
        this._skipVal = n;
        return this;
    }

    select(fields) {
        this._select = fields;
        return this;
    }

    catch(fn) {
        return this._resolve().catch(fn);
    }

    then(onfulfilled, onrejected) {
        return this._resolve().then(onfulfilled, onrejected);
    }

    async _resolve() {
    let result = await this._promise;

    if (Array.isArray(result)) {
        if (this._sort) {
            const [key, dir] = Object.entries(this._sort)[0];
            result = result.sort((a, b) => dir === -1 || dir === 'desc' ? (b[key] > a[key] ? 1 : -1) : (a[key] > b[key] ? 1 : -1));
        }
        if (this._skipVal) result = result.slice(this._skipVal);
        if (this._limitVal) result = result.slice(0, this._limitVal);
        if (this._select) {
            const keys = typeof this._select === 'string' ? this._select.split(' ') : Object.keys(this._select);
            result = result.map(item => {
                const out = {};
                keys.forEach(k => { if (item[k] !== undefined) out[k] = item[k]; });
                return out;
            });
        }
        if (!this._lean) {
            return result.map(item => new LocalDocument(item, this._model));
        }
        return result;
    }


    const isPlainObjectDoc = result !== null
        && typeof result === 'object'
        && !(result instanceof FakeObjectId);

    if (isPlainObjectDoc && !this._lean) {
        return new LocalDocument(result, this._model);
    }

    return result;
  }
}



class LocalModel {
    constructor(db, tableName, defaultData = {}) {
        this.db = db;
        this.tableName = tableName;
        this.defaultData = defaultData;
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                id TEXT PRIMARY KEY,
                data TEXT
            )
        `).run();
    }

    _resolveId(query) {
        if (!query) return null;
        
        let targetId = null;
        if (query.id) targetId = query.id;
        else if (query.botId) targetId = query.botId;
        else if (query.userId && query.groupId) targetId = `${query.userId}_${query.groupId}`;
        else if (query.$or && Array.isArray(query.$or)) {
            const found = query.$or.find(q => q.id || q.lid || q.botId);
            if (found) targetId = found.id || found.lid || found.botId;
        }

        if (targetId && typeof targetId === 'object') {
            if (typeof targetId.toString === 'function') {
                targetId = targetId.toString();
            } else {
                return null;
            }
        }

        if (typeof targetId !== 'string' && typeof targetId !== 'number' && typeof targetId !== 'bigint') {
            return null;
        }

        return targetId;
    }

    _get(id) {
        const row = this.db.prepare(`SELECT data FROM ${this.tableName} WHERE id = ?`).get(id);
        if (!row) return null;
        return JSON.parse(row.data, (k, v) => {
            if (v && typeof v === 'object' && v.__fakeOid) return new FakeObjectId(v.__fakeOid);
            return v;
        });
    }

    _set(id, data) {
        const plain = data instanceof LocalDocument ? data._toPlain() : data;
        this.db.prepare(`INSERT OR REPLACE INTO ${this.tableName} (id, data) VALUES (?, ?)`).run(id, JSON.stringify(plain, (k, v) => { if (v instanceof FakeObjectId) return { __fakeOid: v.toHexString() }; return v; }));
    }

    _matches(item, query) {
        if (!item) return false;
        for (const key in query) {
            if (key === '$or') {
                const orArray = query[key];
                if (Array.isArray(orArray)) {
                    if (!orArray.some(subQuery => this._matches(item, subQuery))) return false;
                }
                continue;
            }
            if (key === '$and') {
                const andArray = query[key];
                if (Array.isArray(andArray)) {
                    if (!andArray.every(subQuery => this._matches(item, subQuery))) return false;
                }
                continue;
            }
            const val = query[key];
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                if ('$lte' in val && item[key] > val.$lte) return false;
                if ('$gte' in val && item[key] < val.$gte) return false;
                if ('$lt' in val && item[key] >= val.$lt) return false;
                if ('$gt' in val && item[key] <= val.$gt) return false;
                if ('$ne' in val && item[key] === val.$ne) return false;
                if ('$in' in val && !val.$in.includes(item[key])) return false;
                if ('$nin' in val && val.$nin.includes(item[key])) return false;
                if ('$exists' in val) {
                    const keyExists = key in item && item[key] !== undefined;
                    if (val.$exists !== keyExists) return false;
                }
            } else {
                if (val === null) {
                    if (item[key] !== null && item[key] !== undefined) return false;
                } else {
                    if (item[key] !== val) return false;
                }
            }
        }
        return true;
    }

    _applyUpdate(current, update) {
        if (!update || typeof update !== 'object') return current;
        const hasOperator = ['$set','$unset','$inc','$push','$pull','$addToSet'].some(op => op in update);
        if (!hasOperator) {
            Object.assign(current, update);
            return current;
        }
        if (update.$set) {
            for (const [k, v] of Object.entries(update.$set)) {
                const parts = k.split('.');
                if (parts.length > 1) {
                    let obj = current;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (!obj[parts[i]]) obj[parts[i]] = {};
                        obj = obj[parts[i]];
                    }
                    obj[parts[parts.length - 1]] = v;
                } else {
                    current[k] = v;
                }
            }
        }
        if (update.$unset) {
            for (const k of Object.keys(update.$unset)) {
                delete current[k];
            }
        }
        if (update.$inc) {
            for (const [k, v] of Object.entries(update.$inc)) {
                current[k] = (current[k] || 0) + v;
            }
        }
        if (update.$push) {
            for (const [k, v] of Object.entries(update.$push)) {
                if (!Array.isArray(current[k])) current[k] = [];
                if (v && typeof v === 'object' && '$each' in v) {
                    current[k].push(...v.$each);
                } else {
                    current[k].push(v);
                }
            }
        }
        if (update.$pull) {
            for (const [k, v] of Object.entries(update.$pull)) {
                if (Array.isArray(current[k])) {
                    current[k] = current[k].filter(item => item !== v);
                }
            }
        }
        if (update.$addToSet) {
            for (const [k, v] of Object.entries(update.$addToSet)) {
                if (!Array.isArray(current[k])) current[k] = [];
                if (!current[k].includes(v)) current[k].push(v);
            }
        }
        if (!update.$set && !update.$unset && !update.$inc && !update.$push && !update.$pull && !update.$addToSet) {
            Object.assign(current, update);
        }
        return current;
    }

    findOne(query = {}) {
        const id = this._resolveId(query);
        if (id) {
            const data = this._get(id);
            const matched = data && this._matches(data, query) ? data : (data && !Object.keys(query).some(k => !['id', 'botId', 'userId', 'groupId'].includes(k) && k !== '$or') ? data : null);
            return new LocalQuery(Promise.resolve(matched), this);
        }
        const rows = this.db.prepare(`SELECT data FROM ${this.tableName}`).all();
        for (const row of rows) {
            const item = JSON.parse(row.data);
            if (this._matches(item, query)) {
                return new LocalQuery(Promise.resolve(item), this);
            }
        }
        return new LocalQuery(Promise.resolve(null), this);
    }

    find(query = {}) {
        const rows = this.db.prepare(`SELECT data FROM ${this.tableName}`).all();
        const results = [];
        for (const row of rows) {
            const item = JSON.parse(row.data);
            if (this._matches(item, query)) results.push(item);
        }
        return new LocalQuery(Promise.resolve(results), this);
    }

    countDocuments(query = {}) {
        const rows = this.db.prepare(`SELECT data FROM ${this.tableName}`).all();
        let count = 0;
        for (const row of rows) {
            const item = JSON.parse(row.data);
            if (this._matches(item, query)) count++;
        }
        return new LocalQuery(Promise.resolve(count), this);
    }

    async create(data) {
        const id = data.id || (data.userId && data.groupId ? `${data.userId}_${data.groupId}` : null) || data.botId;
        if (!id) return null;
        const full = { ...this.defaultData, ...data };
        this._set(id, full);
        return new LocalDocument(full, this);
    }

    async findOneAndUpdate(query, update, options = {}) {
        if (!update || typeof update !== 'object') return null;
        const id = this._resolveId(query);
        if (!id) return null;

        let current = this._get(id);

        if (!current) {
            if (!options.upsert) return null;
            current = { ...this.defaultData };
            if (query.id) current.id = query.id;
            if (query.botId) current.botId = query.botId;
            if (query.userId) current.userId = query.userId;
            if (query.groupId) current.groupId = query.groupId;
        }

        current = this._applyUpdate(current, update);
        this._set(id, current);

        if (options.new === false) {
            const old = this._get(id);
            return new LocalDocument(old, this);
        }

        return new LocalDocument(current, this);
    }

    async findOneAndDelete(query) {
        const id = this._resolveId(query);
        if (!id) return null;
        const current = this._get(id);
        if (!current) return null;
        this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
        return new LocalDocument(current, this);
    }

    async updateOne(query, update, options = {}) {
        const id = this._resolveId(query);
        if (!id) return { matchedCount: 0, modifiedCount: 0 };
        let current = this._get(id);
        if (!current) {
            if (!options.upsert) return { matchedCount: 0, modifiedCount: 0 };
            current = { ...this.defaultData };
            if (query.id) current.id = query.id;
        }
        current = this._applyUpdate(current, update);
        this._set(id, current);
        return { matchedCount: 1, modifiedCount: 1 };
    }

    async updateMany(query, update) {
        const rows = this.db.prepare(`SELECT id, data FROM ${this.tableName}`).all();
        let modifiedCount = 0;
        for (const row of rows) {
            const item = JSON.parse(row.data);
            if (this._matches(item, query)) {
                const updated = this._applyUpdate({ ...item }, update);
                this._set(row.id, updated);
                modifiedCount++;
            }
        }
        return { matchedCount: modifiedCount, modifiedCount };
    }

    async deleteOne(query) {
        const id = this._resolveId(query);
        if (!id) return { deletedCount: 0 };
        const exists = this._get(id);
        if (!exists) return { deletedCount: 0 };
        this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
        return { deletedCount: 1 };
    }

    async deleteMany(query = {}) {
        const rows = this.db.prepare(`SELECT id, data FROM ${this.tableName}`).all();
        let deletedCount = 0;
        for (const row of rows) {
            const item = JSON.parse(row.data);
            if (this._matches(item, query)) {
                this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(row.id);
                deletedCount++;
            }
        }
        return { deletedCount };
    }

    async insertMany(docs) {
        const inserted = [];
        for (const doc of docs) {
            const created = await this.create(doc);
            if (created) inserted.push(created);
        }
        return inserted;
    }

    async bulkWrite(ops, options = {}) {
        const transaction = this.db.transaction((operations) => {
            for (const op of operations) {
                if (op.updateOne) {
                    const { filter, update, upsert } = op.updateOne;
                    const id = this._resolveId(filter);
                    if (!id) continue;
                    let current = this._get(id);
                    if (!current) {
                        if (!upsert) continue;
                        current = { ...this.defaultData };
                        if (filter.id) current.id = filter.id;
                        if (filter.botId) current.botId = filter.botId;
                        if (filter.userId) current.userId = filter.userId;
                        if (filter.groupId) current.groupId = filter.groupId;
                    }
                    current = this._applyUpdate(current, update);
                    this._set(id, current);
                }
                if (op.insertOne) {
                    const doc = op.insertOne.document;
                    const id = this._resolveId(doc);
                    if (!id) continue;
                    this._set(id, { ...this.defaultData, ...doc });
                }
                if (op.deleteOne) {
                    const id = this._resolveId(op.deleteOne.filter);
                    if (!id) continue;
                    this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
                }
                if (op.replaceOne) {
                    const { filter, replacement, upsert } = op.replaceOne;
                    const id = this._resolveId(filter);
                    if (!id) continue;
                    const exists = this._get(id);
                    if (!exists && !upsert) continue;
                    this._set(id, { ...this.defaultData, ...replacement });
                }
            }
        });
        transaction(ops);
        return { ok: 1 };
    }

    async distinct(field, query = {}) {
        const rows = this.db.prepare(`SELECT data FROM ${this.tableName}`).all();
        const values = new Set();
        for (const row of rows) {
            const item = JSON.parse(row.data);
            if (this._matches(item, query) && item[field] !== undefined) {
                values.add(item[field]);
            }
        }
        return [...values];
    }

    aggregate(pipeline) {
        let rows = this.db.prepare(`SELECT data FROM ${this.tableName}`).all().map(r => JSON.parse(r.data));
        for (const stage of pipeline) {
            if (stage.$match) {
                rows = rows.filter(item => this._matches(item, stage.$match));
            }
            if (stage.$sort) {
                const [key, dir] = Object.entries(stage.$sort)[0];
                rows = rows.sort((a, b) => dir === -1 ? (b[key] > a[key] ? 1 : -1) : (a[key] > b[key] ? 1 : -1));
            }
            if (stage.$limit) {
                rows = rows.slice(0, stage.$limit);
            }
            if (stage.$skip) {
                rows = rows.slice(stage.$skip);
            }
            if (stage.$project) {
                rows = rows.map(item => {
                    const out = {};
                    for (const [k, v] of Object.entries(stage.$project)) {
                        if (v && item[k] !== undefined) out[k] = item[k];
                    }
                    return out;
                });
            }
        }
        return new LocalQuery(Promise.resolve(rows), this);
    }
}

class DatabaseManager {
    constructor() {
        this.isLocal = false;
        this.db = null;
    }

    async init() {
        const dbUrl = process.env.MONGODB_URI || global.config?.dbUrl || '';

        if (dbUrl) {
            try {
                await mongoose.connect(dbUrl, {
                    serverSelectionTimeoutMS: 5000,
                    family: 4,
                    maxPoolSize: 10
                });

                const chatSchema = new mongoose.Schema({ id: { type: String, unique: true }, isBanned: { type: Boolean, default: false } }, { strict: false });
                global.Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

                const warnSchema = new mongoose.Schema({
                    userId: { type: String, required: true },
                    groupId: { type: String, required: true },
                    reasons: { type: [String], default: [] },
                    warnCount: { type: Number, default: 0 },
                    date: { type: Date, default: Date.now }
                });
                warnSchema.index({ userId: 1, groupId: 1 }, { unique: true });
                global.Warns = mongoose.models.Warns || mongoose.model('Warns', warnSchema);

                const subBotSettingsSchema = new mongoose.Schema({
                    botId: { type: String, unique: true },
                    botName: { type: String, default: 'Bot' },
                    botImage: { type: String, default: null },
                    botUrl: { type: String, default: null },
                    prefix: { type: String, default: '.' },
                    status: { type: Boolean, default: true }
                }, { strict: false });
                global.SubBotSettings = mongoose.models.SubBotSettings || mongoose.model('SubBotSettings', subBotSettingsSchema);

                const botRestrictionSchema = new mongoose.Schema({
                    botId: { type: String, unique: true },
                    restrictedMode: { type: Boolean, default: false },
                    hiddenCommands: { type: [String], default: [] }
                }, { strict: false });
                global.BotRestrictions = mongoose.models.BotRestrictions || mongoose.model('BotRestrictions', botRestrictionSchema);

                const userSchema = new mongoose.Schema({
                    id: { type: String, unique: true },
                    monedas: { type: Number, default: 0 },
                    marry: { type: String, default: null },
                    name: { type: String, default: 'Usuario' },
                    exp: { type: Number, default: 0 },
                    warnAntiLink: { type: Number, default: 0 },
                    col: { type: Number, default: 0 },
                    banned: { type: Boolean, default: false },
                    lastSeen: { type: Date, default: Date.now },
                    gender: { type: String, default: 'No definido' },
                    identity: { type: String, default: 'No definido' },
                    age: { type: Number, default: 0 },
                    description: { type: String, default: '' }
                }, { strict: false });
                global.User = mongoose.models.User || mongoose.model('User', userSchema);

                global.db = mongoose.connection.db;
                this.isLocal = false;
                this.startGarbageCollector();
                return;
            } catch (e) {
                this.isLocal = true;
            }
        } else {
            this.isLocal = true;
        }

        if (this.isLocal) {
            this.db = new Database(SQLITE_PATH);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');

            const userDefaults = {
                monedas: 0,
                marry: null,
                name: 'Usuario',
                exp: 0,
                warnAntiLink: 0,
                col: 0,
                banned: false,
                lastSeen: new Date().toISOString(),
                gender: 'No definido',
                identity: 'No definido',
                age: 0,
                description: ''
            };

            const chatDefaults = {
                isBanned: false,
                welcome: true,
                muto: false,
                antiLink: true,
                antiLink2: false,
                antiCall: false,
                modoadmin: false,
                antisub: false,
                antiBots: false,
                mutos: [],
                nsfw: false,
                antiStatus: false,
                antiToxic: true,
                warns: [],
                botAsignado: ''
            };

            global.User = new LocalModel(this.db, 'users', userDefaults);
            global.Chat = new LocalModel(this.db, 'chats', chatDefaults);
            global.Warns = new LocalModel(this.db, 'warns', { reasons: [], warnCount: 0, date: new Date().toISOString() });
            global.SubBotSettings = new LocalModel(this.db, 'subbots', { botName: 'Bot', prefix: '.', status: true, botImage: null, botUrl: null });
            global.BotRestrictions = new LocalModel(this.db, 'restrictions', { restrictedMode: false, hiddenCommands: [] });

            this.startGarbageCollector();
        }
    }

    async saveUsersBulk(dataArray) {
        const ops = dataArray.map(data => ({
            updateOne: {
                filter: { id: data.id },
                update: { $set: data },
                upsert: true
            }
        }));
        if (ops.length > 0) {
            await global.User.bulkWrite(ops, { ordered: false });
        }
    }

    async getBotRestrictions(botId) {
        return await global.BotRestrictions.findOne({ botId }).lean().catch(() => null);
    }

    async updateBotRestrictions(botId, update) {
        return await global.BotRestrictions.findOneAndUpdate(
            { botId },
            { $set: update },
            { upsert: true, new: true }
        );
    }

    async getActiveSubBots() {
        return await global.SubBotSettings.find({ status: true }).lean().catch(() => null);
    }

    startGarbageCollector() {
        setInterval(async () => {
            try {
                const targetQuery = {
                    monedas: { $lte: 0 },
                    exp: { $lte: 0 },
                    marry: null,
                    banned: false,
                    age: { $lte: 0 },
                    $or: [
                        { description: '' },
                        { description: 'Hola' },
                        { description: { $exists: false } }
                    ],
                    gender: 'No definido',
                    identity: 'No definido'
                };

                const result = await global.User.deleteMany(targetQuery);

                if (result && result.deletedCount > 0) {
                    console.log(`┃ SYSTEM ┃ Limpieza completada: ${result.deletedCount} usuarios fantasma eliminados.`);
                }
            } catch (e) {
                console.error('┃ SYSTEM ERROR ┃ Error en recolector de basura de la base de datos:', e);
            }
        }, 1000 * 60 * 60 * 2);
    }
}

export const databaseManager = new DatabaseManager();
