import fs from 'fs/promises';
import { existsSync } from 'fs';

class LocalModel {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = null;
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
        return data.filter(item => {
            return Object.keys(query).every(key => item[key] === query[key]);
        }).length;
    }

    find(query = {}) {
        return {
            lean: async () => {
                const data = await this._load();
                if (Object.keys(query).length === 0) return data;
                return data.filter(item => {
                    return Object.keys(query).every(key => item[key] === query[key]);
                });
            }
        };
    }

    async findOne({ id }) {
        const data = await this._load();
        const item = data.find(u => u.id === id);
        if (!item) return null;
        return { ...item, save: async () => this.updateOne({ id }, item) };
    }

    async findOneAndUpdate({ id }, update, options = {}) {
        const data = await this._load();
        let index = data.findIndex(u => u.id === id);

        if (index === -1) {
            if (options.upsert) {
                const newDoc = { id, ...(update.$set || update) };
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

    async create(doc) {
        const data = await this._load();
        data.push(doc);
        await this._save();
        return doc;
    }
}

export const LocalDB = {
    model: (name) => new LocalModel(`./database/${name.toLowerCase()}s.json`)
};
