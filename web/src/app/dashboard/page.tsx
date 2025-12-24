import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            ようこそ！
          </h2>
          <p className="text-gray-600 mb-4">
            ログイン中: {user.email}
          </p>
          <p className="text-gray-600">
            初期設定を行って、ポイント管理を始めましょう。
          </p>
        </div>

        {/* メニューカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/settings/children"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              子ども設定
            </h3>
            <p className="text-gray-600 text-sm">
              子どもの名前・ニックネームを登録します
            </p>
          </Link>

          <Link
            href="/settings/actions"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              行動・ポイント設定
            </h3>
            <p className="text-gray-600 text-sm">
              行動名とポイント数を設定します
            </p>
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
