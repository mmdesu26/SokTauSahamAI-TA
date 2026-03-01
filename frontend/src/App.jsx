import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="rounded-2xl bg-white p-8 shadow-lg">  {/* tambah shadow-lg biar lebih kelihatan */}
        <h1 className="text-2xl font-bold text-gray-800">Frontend React + Tailwind ✅</h1>
        <p className="mt-2 text-slate-600">Sudah siap lanjut bikin layout untuk SokTauSaham.</p>
        
        <div className="mt-6 space-y-4">
          <button 
            onClick={() => setCount((prev) => prev + 1)}
            className="rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Count is {count}
          </button>

          <button className="rounded-xl bg-green-600 px-6 py-3 text-white font-medium hover:bg-green-700 transition-colors">
            Tombol Lain
          </button>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Edit <code className="font-mono bg-slate-100 px-1 rounded">src/App.jsx</code> dan save untuk test.
        </p>
      </div>
    </div>
  )
}

export default App