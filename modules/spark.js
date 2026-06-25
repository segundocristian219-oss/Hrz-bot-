import fs from 'fs';

export const gCommand = {
    commands: {
        g: {
          name: 'logger_actividad',
    async before(m) {
        if (!m.isGroup || m.fromMe || m.isBaileys) return false;

        const dbPath = './database';
        const filePath = './database/actividad.json';

        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath, { recursive: true });
        }

        let db = {};
        if (fs.existsSync(filePath)) {
            db = JSON.parse(fs.readFileSync(filePath, 'utf-8') || '{}');
        }

        if (!db[m.chat]) db[m.chat] = {};
        db[m.chat][m.sender] = (db[m.chat][m.sender] || 0) + 1;

        fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
        return false;
      }
    }
  }
};

