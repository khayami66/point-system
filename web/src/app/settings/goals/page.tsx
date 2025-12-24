'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Goal } from '@/types/database'

export default function GoalsSettingsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetPoints, setTargetPoints] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // 家庭IDを取得
    const { data: userFamilyData } = await supabase
      .from('user_families')
      .select('family_id')
      .eq('user_id', user.id)
      .single()

    const userFamily = userFamilyData as { family_id: string } | null
    if (!userFamily) {
      router.push('/dashboard')
      return
    }

    const familyIdValue = userFamily.family_id
    setFamilyId(familyIdValue)

    // 目標リストを取得
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('family_id', familyIdValue)
      .order('display_order', { ascending: true })

    setGoals((data || []) as Goal[])
    setIsLoading(false)
  }

  function handleEdit(goal: Goal) {
    setEditingGoal(goal)
    setTitle(goal.title)
    setDescription(goal.description || '')
    setTargetPoints(goal.target_points?.toString() || '')
    setShowForm(true)
  }

  function handleAdd() {
    setEditingGoal(null)
    setTitle('')
    setDescription('')
    setTargetPoints('')
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingGoal(null)
    setTitle('')
    setDescription('')
    setTargetPoints('')
  }

  async function handleSave() {
    if (!title.trim() || !familyId) return

    setIsSaving(true)

    const targetPointsNum = targetPoints ? parseInt(targetPoints) : null

    if (editingGoal) {
      // 更新
      await supabase
        .from('goals')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          target_points: targetPointsNum,
        })
        .eq('id', editingGoal.id)
    } else {
      // 新規作成
      const maxOrder = goals.length > 0
        ? Math.max(...goals.map(g => g.display_order))
        : 0

      await supabase
        .from('goals')
        .insert({
          family_id: familyId,
          title: title.trim(),
          description: description.trim() || null,
          target_points: targetPointsNum,
          display_order: maxOrder + 1,
        })
    }

    setIsSaving(false)
    handleCancel()
    loadData()
  }

  async function handleToggleAchieved(goal: Goal) {
    await supabase
      .from('goals')
      .update({ is_achieved: !goal.is_achieved })
      .eq('id', goal.id)

    loadData()
  }

  async function handleDelete(goalId: string) {
    if (!confirm('この目標を削除しますか？')) return

    await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)

    loadData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            目標設定
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 目標リスト */}
        <div className="bg-white rounded-lg shadow mb-6">
          {goals.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              目標が登録されていません
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className={`p-4 ${goal.is_achieved ? 'bg-green-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleAchieved(goal)}
                        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          goal.is_achieved
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {goal.is_achieved && '✓'}
                      </button>
                      <div>
                        <p className={`font-medium ${
                          goal.is_achieved ? 'text-green-700 line-through' : 'text-gray-800'
                        }`}>
                          {goal.title}
                        </p>
                        {goal.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {goal.description}
                          </p>
                        )}
                        {goal.target_points && (
                          <p className="text-sm text-blue-600 font-semibold mt-1">
                            目標: {goal.target_points} ポイント
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 追加ボタン */}
        {!showForm && (
          <button
            onClick={handleAdd}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 目標を追加
          </button>
        )}

        {/* 入力フォーム */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingGoal ? '目標を編集' : '目標を追加'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  目標（ごほうび内容） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：アイスを買う"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  詳細（任意）
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：好きな味を選べる"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  必要ポイント（任意）
                </label>
                <input
                  type="number"
                  value={targetPoints}
                  onChange={(e) => setTargetPoints(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || isSaving}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ヒント */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ヒント:</strong> 丸いチェックボックスで達成済みにできます。
            ポイント数は任意で設定できます。
          </p>
        </div>
      </main>
    </div>
  )
}
