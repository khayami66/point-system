import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrCreateFamily } from '@/lib/family'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Child, Action } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 家庭を取得または作成
  const family = await getOrCreateFamily(supabase, user.id)

  // 子どもの情報を取得
  const { data: childrenData } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', family.id)
    .order('created_at', { ascending: true })

  // 行動マスタを取得
  const { data: actionsData } = await supabase
    .from('actions')
    .select('*')
    .eq('family_id', family.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const children = (childrenData || []) as Child[]
  const actions = (actionsData || []) as Action[]
  const hasChildren = children.length > 0
  const hasActions = actions.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            ごほうびポイント
          </h1>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 初期設定ガイド */}
        {(!hasChildren || !hasActions) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              初期設定を完了しましょう
            </h2>
            <ul className="text-yellow-700 text-sm space-y-1">
              {!hasChildren && (
                <li>・子どもの登録がまだです</li>
              )}
              {!hasActions && (
                <li>・行動・ポイントの設定がまだです</li>
              )}
            </ul>
          </div>
        )}

        {/* 子どもの状況 */}
        {hasChildren && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              ポイント状況
            </h2>
            <div className="space-y-4">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {child.nickname || child.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      累計: {child.total_points}pt
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {child.cycle_points}
                    </p>
                    <p className="text-xs text-gray-500">現在のポイント</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* メニューカード */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">設定</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/settings/children"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  子ども設定
                </h3>
                <p className="text-gray-600 text-sm">
                  子どもの名前・ニックネームを登録します
                </p>
              </div>
              {!hasChildren && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                  未設定
                </span>
              )}
            </div>
          </Link>

          <Link
            href="/settings/actions"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  行動・ポイント設定
                </h3>
                <p className="text-gray-600 text-sm">
                  行動名とポイント数を設定します
                </p>
              </div>
              {!hasActions && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                  未設定
                </span>
              )}
            </div>
          </Link>

          <Link
            href="/settings/goals"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              目標設定
            </h3>
            <p className="text-gray-600 text-sm">
              ごほうびの目標を設定します
            </p>
          </Link>

          <Link
            href="/settings/share"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              共有URL
            </h3>
            <p className="text-gray-600 text-sm">
              子ども用の閲覧URLを確認します
            </p>
          </Link>
        </div>
      </main>
    </div>
  )
}
