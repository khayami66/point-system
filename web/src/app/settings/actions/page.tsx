'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Action } from '@/types/database'

export default function ActionsSettingsPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAction, setEditingAction] = useState<Action | null>(null)
  const [name, setName] = useState('')
  const [points, setPoints] = useState('1')
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

    // 行動マスタを取得
    const { data } = await supabase
      .from('actions')
      .select('*')
      .eq('family_id', familyIdValue)
      .order('display_order', { ascending: true })

    setActions((data || []) as Action[])
    setIsLoading(false)
  }

  function handleEdit(action: Action) {
    setEditingAction(action)
    setName(action.name)
    setPoints(action.points.toString())
    setShowForm(true)
  }

  function handleAdd() {
    setEditingAction(null)
    setName('')
    setPoints('1')
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingAction(null)
    setName('')
    setPoints('1')
  }

  async function handleSave() {
    if (!name.trim() || !familyId) return

    const pointsNum = parseInt(points) || 1

    setIsSaving(true)

    if (editingAction) {
      // 更新
      await supabase
        .from('actions')
        .update({
          name: name.trim(),
          points: pointsNum,
        })
        .eq('id', editingAction.id)
    } else {
      // 新規作成
      const maxOrder = actions.length > 0
        ? Math.max(...actions.map(a => a.display_order))
        : 0

      await supabase
        .from('actions')
        .insert({
          family_id: familyId,
          name: name.trim(),
          points: pointsNum,
          display_order: maxOrder + 1,
        })
    }

    setIsSaving(false)
    handleCancel()
    loadData()
  }

  async function handleToggleActive(action: Action) {
    await supabase
      .from('actions')
      .update({ is_active: !action.is_active })
      .eq('id', action.id)

    loadData()
  }

  async function handleDelete(actionId: string) {
    if (!confirm('この行動を削除しますか？')) return

    await supabase
      .from('actions')
      .delete()
      .eq('id', actionId)

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
            行動・ポイント設定
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 行動リスト */}
        <div className="bg-white rounded-lg shadow mb-6">
          {actions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              行動が登録されていません
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {actions.map((action) => (
                <li
                  key={action.id}
                  className={`p-4 flex items-center justify-between ${
                    !action.is_active ? 'bg-gray-50 opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleActive(action)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        action.is_active
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {action.is_active && '✓'}
                    </button>
                    <div>
                      <p className="font-medium text-gray-800">{action.name}</p>
                      <p className="text-sm text-blue-600 font-semibold">
                        {action.points} ポイント
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(action)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(action.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
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
            + 行動を追加
          </button>
        )}

        {/* 入力フォーム */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingAction ? '行動を編集' : '行動を追加'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  行動名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：宿題"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ポイント数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  disabled={!name.trim() || isSaving}
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
            <strong>ヒント:</strong> チェックボックスで行動の有効/無効を切り替えられます。
            無効にすると、LINE Botで記録できなくなります。
          </p>
        </div>
      </main>
    </div>
  )
}
