
export const aimgCommand = {
    category: 'ai',
    commands: {
        aimg: {
            name: 'wn',
            alias: ['m'],
            run: async (m, { conn, text }) => {
                if (!text) return m.reply('Por favor, proporciona el texto en formato Markdown que deseas enviar.');

                await conn.relayMessage(m.chat, {
                  messageContextInfo: {
                    threadId: [],
                    deviceListMetadata: {
                      senderKeyIndexes: [],
                      recipientKeyIndexes: []
                    },
                    deviceListMetadataVersion: 2,
                    botMetadata: {
                      messageDisclaimerText: name(),
                      richResponseSourcesMetadata: {
                        sources: [
                          { provider: 0, sourceQuery: "", citationNumber: 1, sourceTitle: "Mi Bot" }
                        ]
                      }
                    }
                  },
                  botForwardedMessage: {
                    message: {
                      richResponseMessage: {
                        messageType: 1,
                        unifiedResponse: {
                          data: Buffer.from(JSON.stringify({
                            response_id: "100a27ec-19f5-4280-9d99-7f7ab764d2d1",
                            sections: [
                              {
                                view_model: {
                                  primitive: {
                                    text: text,
                                    inline_entities: [],
                                    __typename: "GenAIMarkdownTextUXPrimitive"
                                  },
                                  __typename: "GenAISingleLayoutViewModel"
                                }
                              }
                            ]
                          })).toString('base64')
                        },
                        contextInfo: {
                          forwardingScore: 1,
                          isForwarded: true,
                          forwardedAiBotMessageInfo: {
                            botJid: "0@bot"
                          },
                          forwardOrigin: 4
                        }
                      }
                    }
                  }
                }, {});
            }
        }
    }
};

