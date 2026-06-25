import { getRealJid } from '../../core/identifier.js';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

const normalizarTexto = (texto) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const PALABRAS_PROHIBIDAS = [
  'mierda', 'estupido', 'pendejo', 'escoria', 'puta', 'puto', 'marico', 'maricon',
  'cabron', 'cabrona', 'gilipollas', 'imbecil', 'perra', 'zorra', 'maldito', 'maldita',
  'basura', 'pete', 'cono', 'chingar', 'chinga', 'joder', 'culiao', 'culiando',
  'gonorrea', 'malparido', 'malparida', 'hijueputa', 'mrd', 'hdp', 'ctm', 'pto', 'pta',
  'vrg', 'verga', 'pija', 'weon', 'aweonao', 'cagon', 'mamabicho', 'sapo', 'ramera',
  'tarado', 'idiota', 'baboso', 'menso', 'asqueroso', 'pendeja', 'perrito', 'soplapollas',
  'tocapelotas', 'chupapija', 'lameculos', 'tragaleche', 'pajero', 'pajera', 'conchesumare',
  'csm', 'qliao', 'chucha', 'chuchatumare', 'rompebolas', 'pelotudo', 'boludo', 'forro',
  'sorete', 'guampa', 'cornudo', 'coño', 'hostia', 'joputa', 'malnacido', 'mamaguevo',
  'mmg', 'mmgv', 'mamon', 'wey', 'pinche', 'piojoso', 'zarrapastroso', 'nazi', 'hitler',
  'torres gemelas', 'suicidio', 'matate', 'muerete', 'aborto', 'violador', 'acosador',
  'pedofilo', 'enfermo', 'retrasado', 'estupida', 'lerdo', 'tonto', 'huevon', 'huevada',
  'carajo', 'mierdero', 'putita', 'zorrita', 'perrilla', 'chupala', 'mamala', 'chupame',
  'shit', 'fuck', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'slut', 'whore',
  'bastard', 'motherfucker', 'mofo', 'wtf', 'stfu', 'gtfo', 'bullshit', 'damn', 'dammit',
  'crap', 'prick', 'twat', 'wanker', 'tosser', 'douche', 'douchebag', 'turd', 'idiot',
  'moron', 'stupid', 'dumbass', 'dumb', 'loser', 'sucks', 'cock', 'cocksucker', 'dildo',
  'jackass', 'jerk', 'jerkoff', 'slutty', 'skank', 'bimbo', 'hoe', 'thot', 'nazi',
  'hitler', 'twin towers', '911', 'terrorist', 'rape', 'rapist', 'kill yourself', 'kys',
  'die', 'suicide', 'fck', 'bxtch', 'sh1t', 'a55', 'ass', 'asswipe', 'butthole', 'clit',
  'cum', 'jizz', 'semen', 'sperm', 'smut', 'porn', 'porno', 'nsfw', 'boobs', 'tits',
  'titties', 'vagina', 'penis', 'schlong', 'shaft', 'willy', 'boner', 'horny', 'masturbate',
  'incest', 'nudes', 'naked', 'strip', 'hooker', 'escort', 'prostitute', 'brothel', 'scam',
  'scammer', 'fucker', 'fucking', 'bullcrap', 'dipshit', 'horseshit', 'shithead', 'slutbag',
  'merda', 'caralho', 'porra', 'buceta', 'foda', 'cu', 'puta', 'piranha', 'vagabunda',
  'corno', 'viado', 'bicha', 'cacete', 'carai', 'fdps', 'fdp', 'krl', 'vtnc', 'tnc',
  'vsf', 'arrombado', 'babaca', 'otario', 'trouxa', 'lixo', 'desgraça', 'maldito',
  'foder', 'fudido', 'punheta', 'punheteiro', 'siririca', 'bosta', 'escroto', 'cuzão',
  'nazi', 'hitler', 'torres gemeas', 'suicídio', 'morra', 'se mata', 'estupro', 'pedofilo',
  'assediador', 'burro', 'idiota', 'imbecil', 'estupido', 'retardado', 'anta', 'jumento',
  'cabaço', 'corna', 'chifrudo', 'rapariga', 'quenga', 'kenga', 'safada', 'cadela',
  'cachorra', 'pica', 'rola', 'piroca', 'pinto', 'caceta', 'xoxota', 'xana', 'peito',
  'tetas', 'gozo', 'porno', 'putaria', 'nudes', 'pelada', 'pqp', 'caralhos', 'fodendo',
  'fudendo', 'chupador', 'boquete', 'chupeta', 'manso', 'viadinho', 'fresco', 'mariquinha',
  'boiola', 'zé ruela', 'caloteiro', 'larápio', 'bandido', 'traficante', 'miliciano',
  'aborto', 'verme', 'inseto', 'peste', 'diabo', 'demonio', 'capeta', 'satanás', 'foda-se',
  '操', '肏', '傻逼', 'sb', '妈的', '他妈的', '婊子', '贱人', '王八蛋', '狗屎', '垃圾',
  '滚', '去死', '神经病', '脑残', '智障', '白痴', '笨蛋', '猪头', '混蛋', '绿茶婊', '屌丝',
  '绿帽子', '操你妈', '靠北', '靠', '尼玛', '鸡巴', '傻屌', '烂货', '骚货', '贱货', '杂种',
  '变态', '色狼', '淫娃', '强奸犯', '恋童癖', '纳粹', '希特勒', '双子塔', '恐怖分子', '杀人犯',
  '妓女', '鸭子', '鸡', '卖淫', '嫖娼', '打飞机', '撸管', '走狗', '狗娘养的', '贱种', '畜生',
  '禽兽', '败类', '人渣', '废柴', '弱智', '脑进水', '有病', '神经', '疯子', '傻瓜', '呆子',
  '丑八怪', '死胖子', '穷光蛋', '小三', '狐狸精', '奸夫', '淫妇', '绿帽', '王八', '狗东西',
  '龟孙子', '孙子', '尼玛的', '卧槽', '我草', '泥马', '妹的', '奶奶的', '大爷的', '滚蛋',
  '去你的', '找死', '找抽', '欠揍', '欠扁', '找骂', '找不自在', '丧心病狂', '丧尽天良',
  '狼心狗肺', '猪狗不如', '衣冠禽兽', '乌龟王八蛋', '去死吧', '草泥马', '死全家',
  'scheiße', 'fick', 'ficken', 'arschloch', 'hure', 'schlampe', 'nutte', 'fotze',
  'bastard', 'hurensohn', 'wixxer', 'wichser', 'miststück', 'drecksau', 'verpiss',
  'halt die fresse', 'hdf', 'wtf', 'scheiss', 'kacke', 'dreck', 'idiot', 'dummkopf',
  'vollidiot', 'spast', 'spasti', 'behindert', 'affe', 'penner', 'sau', 'schwein',
  'schweinehund', 'missgeburt', 'lutscher', 'pimmel', 'schwanz', 'fotzkopf',
  'arschkriecher', 'arschgesicht', 'dumm', 'blöd', 'blödmann', 'trottel', 'hornochse',
  'rindvieh', 'depp', 'lauch', 'opfer', 'nazi', 'hitler', 'zwillingstürme', 'terror',
  'terrorist', 'selbstmord', 'stirb', 'vergewaltiger', 'pädophil', 'wichsen', 'fotz',
  'ficker', 'dreckskerl', 'dreckspatz', 'mistkerl', 'lump', 'schuft', 'schurke',
  'bösewicht', 'krimineller', 'betrüger', 'lügner', 'heuchler', 'schleimer', 'speichellecker',
  'analritter', 'stricher', 'freier', 'puff', 'bordell', 'hurenhaus', 'sex', 'porno',
  'nackt', 'titten', 'brüste', 'mumu', 'muschi', 'vagina', 'penis', 'glied', 'sack',
  'hoden', 'eier', 'samen', 'sperma', 'orgasmus', 'geil', 'hornig', 'nuttige', 'bims',
  'bimsen', 'rammeln', 'vögeln', 'knallen', 'poppen', 'bums', 'bumsen', 'fickfehler',
  'كس', 'قحبة', 'شرموطة', 'كلب', 'ابن الكلب', 'حمار', 'خرا', 'زب', 'طيز', 'عرص',
  'خول', 'منيوك', 'شاذ', 'ديوث', 'عاهرة', 'زانية', 'نيك', 'مومس', 'ابن القحبة',
  'ابن الشرموطة', 'منيكة', 'علق', 'سافل', 'واطي', 'حقير', 'كلبة', 'مخنث', 'لوطي',
  'حيوان', 'بغل', 'غبي', 'تفه', 'انيكك', 'مص', 'مصي', 'قواد', 'قوادة', 'عاهره',
  'شرمط', 'شرمطة', 'تنيكو', 'مبون', 'قلاوي', 'زبي', 'كسي', 'طيزي', 'لحس',
  'نازي', 'هتلر', 'برجي التجارة', 'انتحار', 'اقتل نفسك', 'موت', 'مغتصب', 'بيدوفيل',
  'متحرش', 'ارهابي', 'ارهاب', 'تفجير', 'ابن الحرام', 'وسخ', 'زبالة', 'خنزير',
  'نجس', 'لعنة', 'يلعنك', 'يلعن', 'دينك', 'كسمك', 'كس امك', 'احا', 'خخخ',
  'مفلقس', 'نيك امك', 'اخو الشرموطة', 'اخو القحبة', 'سخيف', 'زق', 'تف عليك',
  'مجنون', 'مريض', 'معتوه', 'متخلف', 'عبيط', 'اهبل', 'عاهر', 'شرموط', 'مقرف',
  'قذر', 'بصاق', 'دعارة', 'اباحي', 'جنس', 'مهبل', 'قضيب', 'خصية', 'سائل منوي',
  'مؤخرة', 'صدر', 'بزاز', 'نهود', 'استمناء', 'عاده سريه'
];

const BLACKLIST_NORMALIZADA = PALABRAS_PROHIBIDAS.map(p => ({
  palabra: p,
  regex: new RegExp(`(^|\\s|[^\\p{L}])${normalizarTexto(p)}([^\\p{L}]|\\s|$)`, 'iu')
}));

const withTimeout = (promise, ms = 5000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ]);

const processingUsers = new Set();

async function procesarMensajeTóxico(m, conn) {
  const rawWho = m.sender;

  if (processingUsers.has(rawWho)) return;
  processingUsers.add(rawWho);

  try {
    const userJid = jidNormalizedUser(
      await withTimeout(getRealJid(conn, rawWho, m))
    );

    await conn.sendMessage(m.chat, { delete: m.key }).catch(() => null);

    const warnDoc = await withTimeout(
      global.Warns.findOneAndUpdate(
        { userId: userJid, groupId: m.chat },
        { $inc: { warnCount: 1 } },
        { new: true, upsert: true }
      )
    );

    const cantidadAdvertencias = warnDoc?.warnCount ?? 1;

    if (cantidadAdvertencias >= 4) {
      await withTimeout(
        global.Warns.deleteOne({ userId: userJid, groupId: m.chat })
      );

      const groupMetadata = await withTimeout(
        conn.groupMetadata(m.chat), 4000
      ).catch(() => null);

      const participants = groupMetadata?.participants || [];
      const targetUser = participants.find(p =>
        jidNormalizedUser(p.id) === userJid ||
        (p.phoneNumber && jidNormalizedUser(p.phoneNumber) === userJid)
      );

      const actualExpulsionId = targetUser ? targetUser.id : userJid;

      await conn.groupParticipantsUpdate(m.chat, [actualExpulsionId], 'remove').catch(() => null);
      await conn.sendMessage(m.chat, {
        text: `> 🚫 *@${userJid.split('@')[0]}* ha alcanzado el límite de 4 advertencias por \`AntiToxic\` y ha sido eliminado del grupo.`,
        contextInfo: { mentionedJid: [userJid] }
      }).catch(() => null);

    } else {
      await conn.sendMessage(m.chat, {
        text: `> ⚠️ *Palabra Prohibida Detectada* por \`AntiToxic\`.\n\nUsuario: *@${userJid.split('@')[0]}*\nAdvertencias: *${cantidadAdvertencias}/4*\n\n_Evita usar lenguaje ofensivo para mantener un ambiente limpio._`,
        contextInfo: { mentionedJid: [userJid] }
      }).catch(() => null);
    }

  } catch (error) {
    console.error(error.message);
  } finally {
    processingUsers.delete(rawWho);
  }
}

export default {
  before: async function(m, { conn, isOwner }) {
    if (!m.isGroup || m.fromMe || isOwner) return false;

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => ({}));
    const participants = groupMetadata.participants || [];
    
    const botJid = jidNormalizedUser(conn.user.id);
    const userJid = jidNormalizedUser(m.sender);

    const isBotAdmin = participants.some(p => jidNormalizedUser(p.id) === botJid && (p.admin === 'admin' || p.admin === 'superadmin'));
    const isUserAdmin = participants.some(p => jidNormalizedUser(p.id) === userJid && (p.admin === 'admin' || p.admin === 'superadmin'));

    if (!isBotAdmin || isUserAdmin) return false;

    const chatData = await global.Chat.findOne({ id: m.chat }).lean();
    if (!chatData?.antiToxic) return false;

    const textoRaw = m.text || m.msg?.caption || m.msg?.text || '';
    if (!textoRaw) return false;

    const contenido = normalizarTexto(textoRaw);
    
    const tienePalabraProhibida = BLACKLIST_NORMALIZADA.some(({ regex }) => regex.test(contenido));

    if (tienePalabraProhibida) {
      procesarMensajeTóxico(m, conn);
      return true;
    }

    return false;
  }
};