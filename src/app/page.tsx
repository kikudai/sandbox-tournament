import Link from 'next/link'
import dynamic from 'next/dynamic'

const TournamentPreview = dynamic(() => import('../components/TournamentPreview'), {
  ssr: false,
})

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">トーナメント管理アプリケーション</h1>
        <p className="text-lg mb-8">
          対戦時の立ち位置を管理できるトーナメント管理アプリケーションへようこそ！
        </p>
        <div className="mb-8">
          <TournamentPreview />
        </div>
        <div className="flex justify-center">
          <Link
            href="/tournaments/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            新規トーナメントを作成
          </Link>
        </div>
      </div>
    </main>
  )
} 