'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Child } from '@/types/database'

export default function ChildrenSettingsPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
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

    // 子どもリストを取得
    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('family_id', familyIdValue)
      .order('created_at', { ascending: true })

    setChildren((data || []) as Child[])
    setIsLoading(false)
  }

  function handleEdit(child: Child) {
    setEditingChild(child)
    setName(child.name)
    setNickname(child.nickname || '')
    setShowForm(true)
  }

  function handleAdd() {
    setEditingChild(null)
    setName('')
    setNickname('')
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingChild(null)
    setName('')
    setNickname('')
  }

  async function handleSave() {
    if (!name.trim() || !familyId) return

    setIsSaving(true)

    if (editingChild) {
      // 更新
      await supabase
        .from('children')
        .update({
          name: name.trim(),
          nickname: nickname.trim() || null,
        })
        .eq('id', editingChild.id)
    } else {
      // 新規作成
      await supabase
        .from('children')
        .insert({
          family_id: familyId,
          name: name.trim(),
          nickname: nickname.trim() || null,
        })
    }

    setIsSaving(false)
    handleCancel()
    loadData()
  }

  async function handleDelete(childId: string) {
    if (!confirm('この子どもを削除しますか？記録も全て削除されます。')) return

    await supabase
      .from('children')
      .delete()
      .eq('id', childId)

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
            子ども設定
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 子どもリスト */}
        <div className="bg-white rounded-lg shadow mb-6">
          {children.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              子どもが登録されていません
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {children.map((child) => (
                <li key={child.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{child.name}</p>
                    {child.nickname && (
                      <p className="text-sm text-gray-500">
                        ニックネーム: {child.nickname}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(child)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(child.id)}
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
            + 子どもを追加
          </button>
        )}

        {/* 入力フォーム */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingChild ? '子どもを編集' : '子どもを追加'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：たろう"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ニックネーム（任意）
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：たろちゃん"
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
      </main>
    </div>
  )
}
