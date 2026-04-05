import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

class LocalModel {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = null;
        this._ensureDir();
    }

    _ensureDir() {
        const dir = path.dirname(this.filePath);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    }

    async _load() {
        if (!this.data) {
            if (existsSync(this.filePath)) {
                try {
                    const raw = await fs.readFile(this.filePath, 'utf-8');
                    this.data = JSON.parse(raw);
                } catch {
                    this.data = [];
                }
            } else {
                this.data = [];
                await this._save();
            }
        }
        return this.data;
    }

    async _save() {
        await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
    }

    async countDocuments(query = {}) {
        const data = await this._load();
        if (Object.keys(query).length === 0) return data.length;
        return data.filter(item => this._match(item, query)).length;
    }

    async exists(query = {}) {
        const data = await this._load();
        return data.some(item => this._match(item, query));
    }

    find(query = {}) {
        return {
            lean: async () => {
                const data = await this._load();
                return data.filter(item => this._match(item, query));
            },
            limit: (n) => ({
                lean: async () => {
                    const data = await this._load();
                    return data.filter(item => this._match(item, query)).slice(0, n);
                }
            })
        };
    }

    async findOne(query = {}) {
        const data = await this._load();
        const item = data.find(u => this._match(u, query));
        if (!item) return null;
        return { ...item, save: async () => this.updateOne(query, item) };
    }

    async findOneAndUpdate(query, update, options = {}) {
        const data = await this._load();
        let index = data.findIndex(u => this._match(u, query));

        if (index === -1) {
            if (options.upsert) {
                const newDoc = { ...query, ...(update.$set || update) };
                data.push(newDoc);
                await this._save();
                return newDoc;
            }
            return null;
        }

        data[index] = { ...data[index], ...(update.$set || update) };
        await this._save();
        return data[index];
    }

    async updateOne(query, update) {
        return this.findOneAndUpdate(query, update);
    }

    async create(doc) {
        const data = await this._load();
        data.push(doc);
        await this._save();
        return doc;
    }

    async deleteMany(query = {}) {
        let data = await this._load();
        this.data = data.filter(item => !this._match(item, query));
        await this._save();
        return { deletedCount: data.length - this.data.length };
    }

    _match(item, query) {
        return Object.keys(query).every(key => item[key] === query[key]);
    }
}

export const LocalDB = {
    model: (name) => new LocalModel(path.join(process.cwd(), 'database', `${name.toLowerCase()}.json`))
};
