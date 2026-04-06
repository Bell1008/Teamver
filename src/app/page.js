export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Teamver</h1>
        <p className="text-lg text-gray-600 mb-8">AI와 함께 완성하는 학생 팀플 협업 도구</p>
        <a href="/projects/new" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">새 팀플 시작하기</a>
      </div>
    </main>
  );
}
