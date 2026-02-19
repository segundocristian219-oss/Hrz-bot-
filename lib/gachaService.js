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
    return data || []
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

  async getUserClaims(groupId, ownerJid) {
    const { data, error } = await supabase
      .from('claims')
      .select('character_id')
      .eq('group_id', groupId)
      .eq('owner_jid', ownerJid)
    if (error) throw error
    return data || []
  },

  async addVote(id, amount) {
    const { data: char, error: fetchError } = await supabase
      .from('characters')
      .select('votes, buy')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError

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
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('character_id', characterId)
      .eq('group_id', groupId)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async setClaim(characterId, groupId, ownerJid) {
    const { error } = await supabase
      .from('claims')
      .insert([{ 
        character_id: parseInt(characterId), 
        group_id: groupId, 
        owner_jid: ownerJid 
      }])
    if (error) throw error
  }
}
