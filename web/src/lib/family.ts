import { SupabaseClient } from '@supabase/supabase-js'
import { Family } from '@/types/database'

// ランダムな共有コードを生成
function generateShareCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ユーザーの家庭を取得または作成
export async function getOrCreateFamily(
  supabase: SupabaseClient,
  userId: string
): Promise<Family> {
  // 既存の家庭を確認
  const { data: userFamily } = await supabase
    .from('user_families')
    .select('family_id, families(*)')
    .eq('user_id', userId)
    .single()

  if (userFamily?.families) {
    // familiesが配列の場合は最初の要素を、そうでなければそのまま返す
    const family = Array.isArray(userFamily.families)
      ? userFamily.families[0]
      : userFamily.families
    return family as Family
  }

  // 新規家庭を作成
  const shareCode = generateShareCode()
  const { data: newFamily, error: familyError } = await supabase
    .from('families')
    .insert({ share_code: shareCode })
    .select()
    .single()

  if (familyError || !newFamily) {
    throw new Error('家庭の作成に失敗しました')
  }

  // ユーザーと家庭を紐付け
  const { error: linkError } = await supabase
    .from('user_families')
    .insert({
      user_id: userId,
      family_id: newFamily.id,
      role: 'owner',
    })

  if (linkError) {
    throw new Error('ユーザーと家庭の紐付けに失敗しました')
  }

  return newFamily
}

// 家庭IDを取得
export async function getFamilyId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('user_families')
    .select('family_id')
    .eq('user_id', userId)
    .single()

  return data?.family_id || null
}
