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
                const raw = await fs.readFile(this.filePath, 'utf-8');
                this.data = JSON.parse(raw);
            } else {
                this.data = [];
                await this._save();
            }
        }
    }

    async _save() {
        await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
    }

    async findOne({ id }) {
        await this._load();
        const item = this.data.find(u => u.id === id);
        return item ? { ...item, save: async () => this.updateOne({ id }, item) } : null;
    }

    async findOneAndUpdate({ id }, update, options = {}) {
        await this._load();
        let index = this.data.findIndex(u => u.id === id);
        if (index === -1) {
            if (options.upsert) {
                const newDoc = { id, ...update.$set, ...update };
                delete newDoc.$set;
                this.data.push(newDoc);
                await this._save();
                return newDoc;
            }
            return null;
        }
        this.data[index] = { ...this.data[index], ...update.$set, ...update };
        delete this.data[index].$set;
        await this._save();
        return this.data[index];
    }

    async create(doc) {
        await this._load();
        this.data.push(doc);
        await this._save();
        return doc;
    }
}

export const LocalDB = {
    model: (name) => new LocalModel(`./database/${name.toLowerCase()}s.json`)
};
