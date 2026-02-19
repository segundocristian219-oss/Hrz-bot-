import { createClient } from '@supabase/supabase-js'

const SB_URL = "https://kzuvndqicwcclhayyttc.supabase.co"
const SB_KEY = "sb_publishable_06Cs4IemHbf35JVVFKcBPQ_BlwJWa3M"
const supabase = createClient(SB_URL, SB_KEY)

export const gachaService = {
  
  async getAllCharacters() {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
    if (error) throw error
    return data
  },

  async getCharacter(id) {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async addVote(id, amount) {
    const { data: char } = await supabase.from('characters').select('votes, buy').eq('id', id).single()
    const { data, error } = await supabase
      .from('characters')
      .update({ 
        votes: (char.votes || 0) + 1, 
        buy: (char.buy || 0) + amount 
      })
      .eq('id', id)
    if (error) throw error
    return data
  },

  async getClaim(characterId, groupId) {
    const { data } = await supabase
      .from('claims')
      .select('*')
      .eq('character_id', characterId)
      .eq('group_id', groupId)
      .single()
    return data
  },

  async setClaim(characterId, groupId, ownerJid) {
    const { error } = await supabase
      .from('claims')
      .insert([{ character_id: characterId, group_id: groupId, owner_jid: ownerJid }])
    if (error) throw error
  }
}
