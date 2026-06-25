const data = [
  { p: "El corazón de un camarón está en su cabeza.", r: "VERDADERO", nota: "Se encuentra en el cefalotórax, que es la fusión de la cabeza y el tórax." },
  { p: "Los seres humanos pueden respirar y tragar al mismo tiempo.", r: "FALSO", nota: "La epiglotis sella las vías respiratorias al tragar para evitar que la comida pase a los pulmones." },
  { p: "Las abejas pueden reconocer rostros humanos.", r: "VERDADERO", nota: "Utilizan un tipo de procesamiento visual que combina diferentes características faciales de forma similar a los humanos." },
  { p: "El Monte Everest es la montaña más alta del mundo respecto al centro de la Tierra.", r: "FALSO", nota: "El Volcán Chimborazo en Ecuador es el punto más alejado del centro de la Tierra debido al ensanchamiento ecuatorial." },
  { p: "Un día en Venus es más largo que un año en Venus.", r: "VERDADERO", nota: "Venus tarda 243 días terrestres en rotar sobre su propio eje, pero solo 225 días terrestres en dar la vuelta al Sol." },
  { p: "Los pulpos tienen tres corazones.", r: "VERDADERO", nota: "Dos bombean sangre a las branquias y el tercero se encarga de enviarla al resto de los órganos corporales." },
  { p: "El oro es comestible para los seres humanos.", r: "VERDADERO", nota: "El oro puro de 24 quilates es biológicamente inerte, por lo que pasa a través del sistema digestivo sin ser absorbido." },
  { p: "Los toros ven el color rojo y por eso se enojan con las capas.", r: "FALSO", nota: "Los toros sufren de dicromacia y no ven el rojo; reaccionan puramente ante el movimiento y el ondeado de la capa." },
  { p: "Las jirafas no tienen cuerdas vocales.", r: "FALSO", nota: "Sí poseen cuerdas vocales, aunque producen sonidos de frecuencias infrasónicas que los humanos no captamos con facilidad." },
  { p: "Los plátanos crecen en árboles.", r: "FALSO", nota: "La planta del plátano es técnicamente una hierba gigante o megaforbia, carente de un tronco leñoso real." },
  { p: "El sonido viaja más rápido en el agua que en el aire.", r: "VERDADERO", nota: "El agua es un medio mucho más denso y elástico, permitiendo que las ondas sonoras se propaguen unas 4 veces más velozmente." },
  { p: "Los seres humanos comparten aproximadamente el 60% de su ADN con los plátanos.", r: "VERDADERO", nota: "Esto se debe a los genes housekeeping esenciales que regulan funciones celulares básicas compartidas por todos los seres vivos." },
  { p: "Australia es un continente y un país al mismo tiempo.", r: "VERDADERO", nota: "Es catalogado geopolíticamente como el único país del mundo que ejerce soberanía sobre una masa continental completa." },
  { p: "El sol es una estrella de color azul.", r: "FALSO", nota: "El Sol es una estrella de secuencia principal de tipo G que emite luz blanca pura, la cual vemos amarilla debido a la atmósfera." },
  { p: "Las mariposas saborean con sus pies.", r: "VERDADERO", nota: "Poseen quimiorreceptores en sus patas que les permiten detectar los azúcares de las plantas al posarse sobre ellas." },
  { p: "El ojo del avestruz es más grande que su cerebro.", r: "VERDADERO", nota: "Sus ojos miden unos 5 centímetros de diámetro ocupando gran parte del cráneo, lo cual limita el espacio para el desarrollo cerebral." },
  { p: "La Gran Muralla China es visible desde la Luna a simple vista.", r: "FALSO", nota: "Es un mito espacial desmentido por los astronautas; su ancho es demasiado reducido y se camufla visualmente con el entorno." },
  { p: "El agua caliente se congela más rápido que el agua fría bajo ciertas condiciones.", r: "VERDADERO", nota: "Este fenómeno se conoce como el Efecto Mpemba, acelerado por procesos mecánicos de evaporación y convección térmica." },
  { p: "Las huellas dactilares de los koalas son casi idénticas a las humanas.", r: "VERDADERO", nota: "Bajo un microscopio electrónico de barrido resulta extremadamente complejo diferenciar las crestas dactilares de ambas especies." },
  { p: "El sonido no puede propagarse en el espacio exterior.", r: "VERDADERO", nota: "Al ser un vacío mecánico casi absoluto, no existen partículas o moléculas que actúen como medio para vibrar y transmitir las ondas." },
  { p: "La Torre Eiffel puede ser 15 cm más alta durante el verano.", r: "VERDADERO", nota: "La estructura de hierro experimenta una expansión térmica significativa debido al aumento drástico de la temperatura." },
  { p: "Los relámpagos nunca caen dos veces en el mismo lugar.", r: "FALSO", nota: "El Empire State de Nueva York, por ejemplo, es impactado por descargas eléctricas un promedio de 25 a 100 veces cada año." },
  { p: "Los camellos almacenan agua pura dentro de sus jorobas.", r: "FALSO", nota: "Sus jorobas están compuestas por depósitos de tejido graso que el organismo metaboliza para producir energía y nutrientes." },
  { p: "El desierto más grande del mundo es el Sáhara.", r: "FALSO", nota: "El desierto más extenso de la Tierra es la Antártida, clasificado formalmente de este modo por sus bajísimos niveles de precipitación." },
  { p: "Las uñas de las manos crecen más rápido que las de los pies.", r: "VERDADERO", nota: "Las uñas de las manos reciben un mayor flujo sanguíneo y estímulo por uso continuo, acelerando su ritmo metabólico celular." }
];

export const trueFalseCommand = {
    category: 'game',
    commands: {
        verdaderofalso: {
            name: 'verdaderofalso',
            alias: ['vf', 'truefalse'],
            async before(m, { conn }) {
                global.vfGames = global.vfGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                const game = global.vfGames[gameId];
                if (!game || m.isBaileys || m.fromMe) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== game.msgId) return false;

                const txt = (m.text || '').trim().toUpperCase();
                const esVerdadero = txt === 'V' || txt === 'VERDADERO';
                const esFalso = txt === 'F' || txt === 'FALSO';
                if (!esVerdadero && !esFalso) return false;

                if ((esVerdadero && game.respuesta === 'VERDADERO') || (esFalso && game.respuesta === 'FALSO')) {
                    await m.react('✅');
                    await conn.sendMessage(m.chat, {
                        text: `🎉 *¡Correcto!*\n\nLa respuesta es efectivamente *${game.respuesta}*.\n\n💡 *Dato Curioso:* ${game.nota}`
                    }, { quoted: m });
                } else {
                    await m.react('❌');
                    await conn.sendMessage(m.chat, {
                        text: `❌ *¡Incorrecto!*\n\nLa respuesta correcta era *${game.respuesta}*.\n\n💡 *Explicación:* ${game.nota}`
                    }, { quoted: m });
                }

                delete global.vfGames[gameId];
                return true;
            },
            run: async (m, { conn }) => {
                global.vfGames = global.vfGames || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.vfGames[gameId]) {
                    return conn.sendMessage(m.chat, { text: `⚠️ Ya tienes una trivia activa. Responde al mensaje de la pregunta anterior para continuar.` }, { quoted: m });
                }

                let lastIndex = global.lastVfIndex || -1;
                let randomIndex;
                do { randomIndex = Math.floor(Math.random() * data.length); }
                while (randomIndex === lastIndex && data.length > 1);

                global.lastVfIndex = randomIndex;
                const reto = data[randomIndex];

                const texto = `🤔 *Verdadero o Falso*\n\n${reto.p}\n\nResponde directamente a este mensaje con una *V* (Verdadero) o una *F* (Falso).`;
                const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

                global.vfGames[gameId] = { respuesta: reto.r, nota: reto.nota, msgId: enviado.key.id };
                return true;
            }
        }
    }
};
