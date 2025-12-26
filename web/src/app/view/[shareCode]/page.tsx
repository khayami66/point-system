'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Child = {
  id: string
  name: string
  nickname: string | null
  total_points: number
  cycle_points: number
}

type Goal = {
  id: string
  title: string
  description: string | null
  target_points: number | null
}

export default function ViewPage() {
  const params = useParams()
  const shareCode = params.shareCode as string

  const [children, setChildren] = useState<Child[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [familyName, setFamilyName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const supabase = createClient()
  const REWARD_THRESHOLD = 100

  useEffect(() => {
    loadData()
  }, [shareCode])

  async function loadData() {
    try {
      // 共有コードから家庭を取得
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id, name')
        .eq('share_code', shareCode)
        .single()

      if (familyError || !family) {
        setNotFound(true)
        setIsLoading(false)
        return
      }

      setFamilyName(family.name || '')

      // 子どもリストを取得
      const { data: childrenData } = await supabase
        .from('children')
        .select('id, name, nickname, total_points, cycle_points')
        .eq('family_id', family.id)
        .order('created_at', { ascending: true })

      setChildren((childrenData || []) as Child[])

      // 目標を取得（未達成のもの）
      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, title, description, target_points')
        .eq('family_id', family.id)
        .eq('is_achieved', false)
        .order('display_order', { ascending: true })

      setGoals((goalsData || []) as Goal[])
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setNotFound(true)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">よみこみちゅう...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-6xl mb-4">😢</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ページがみつかりません
          </h1>
          <p className="text-gray-600">
            URLをかくにんしてね
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-center text-gray-800">
            ごほうびポイント
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 子どもごとのポイント表示 */}
        {children.map((child) => {
          const progress = Math.min((child.cycle_points / REWARD_THRESHOLD) * 100, 100)
          const remaining = Math.max(REWARD_THRESHOLD - child.cycle_points, 0)

          return (
            <div
              key={child.id}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-gray-800">
                  {child.nickname || child.name}
                </p>
              </div>

              {/* ポイント表示 */}
              <div className="text-center mb-6">
                <p className="text-5xl font-bold text-blue-600 mb-1">
                  {child.cycle_points}
                </p>
                <p className="text-gray-500">ポイント</p>
              </div>

              {/* プログレスバー */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>0</span>
                  <span>ごほうびまで</span>
                  <span>{REWARD_THRESHOLD}</span>
                </div>
                <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 残りポイント */}
              {remaining > 0 ? (
                <p className="text-center text-gray-600">
                  あと <span className="font-bold text-purple-600">{remaining}</span> ポイント！
                </p>
              ) : (
                <p className="text-center text-lg font-bold text-green-600">
                  🎉 ごほうびたっせい！
                </p>
              )}

              {/* 累計ポイント */}
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  これまでのごうけい: <span className="font-bold">{child.total_points}</span> ポイント
                </p>
              </div>
            </div>
          )
        })}

        {/* 子どもがいない場合 */}
        {children.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-gray-600">
              まだとうろくされていません
            </p>
          </div>
        )}

        {/* 目標・ごほうび */}
        {goals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
              🎁 もくひょう
            </h2>
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                >
                  <p className="font-medium text-gray-800">
                    {goal.title}
                  </p>
                  {goal.target_points && (
                    <p className="text-sm text-yellow-700 mt-1">
                      {goal.target_points}ポイントでたっせい！
                    </p>
                  )}
                  {goal.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {goal.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        がんばってポイントをためよう！
      </footer>
    </div>
  )
}
