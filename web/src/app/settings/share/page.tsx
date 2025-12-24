'use client'

import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ShareSettingsPage() {
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
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

    // 家庭情報を取得
    const { data: userFamily } = await supabase
      .from('user_families')
      .select('family_id, families(share_code)')
      .eq('user_id', user.id)
      .single()

    if (!userFamily?.families) {
      router.push('/dashboard')
      return
    }

    // families が配列の場合と単一オブジェクトの場合を処理
    type FamilyWithShareCode = { share_code: string }
    const families = userFamily.families as FamilyWithShareCode | FamilyWithShareCode[]
    const family = Array.isArray(families) ? families[0] : families

    setShareCode(family.share_code)
    setIsLoading(false)
  }

  function getShareUrl() {
    if (typeof window === 'undefined' || !shareCode) return ''
    return `${window.location.origin}/view/${shareCode}`
  }

  async function handleCopy() {
    const url = getShareUrl()
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // フォールバック
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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
            共有URL
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            子ども用閲覧URL
          </h2>
          <p className="text-gray-600 mb-4">
            このURLを子どもに共有すると、ログインなしでポイントや目標を確認できます。
          </p>

          {/* URL表示 */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500 mb-1">共有URL</p>
            <p className="text-blue-600 break-all font-mono text-sm">
              {getShareUrl()}
            </p>
          </div>

          {/* コピーボタン */}
          <button
            onClick={handleCopy}
            className={`w-full py-3 rounded-lg transition-colors ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? 'コピーしました！' : 'URLをコピー'}
          </button>

          {/* 注意事項 */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">
              ご注意
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>・このURLを知っている人は誰でも閲覧できます</li>
              <li>・URLは第三者に共有しないでください</li>
              <li>・閲覧のみで、編集はできません</li>
            </ul>
          </div>
        </div>

        {/* QRコード（将来の機能） */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            QRコード
          </h2>
          <p className="text-gray-500 text-sm">
            QRコード機能は今後追加予定です
          </p>
        </div>
      </main>
    </div>
  )
}
