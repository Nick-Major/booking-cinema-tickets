import React from 'react'

export default function Welcome({ version, phpVersion }) {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Welcome to Laravel + Inertia + React!
          </h1>
          <div className="space-y-3 text-gray-700">
            <p className="text-lg">
              <span className="font-semibold">Laravel version:</span> {version}
            </p>
            <p className="text-lg">
              <span className="font-semibold">PHP version:</span> {phpVersion}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Frontend:</span> React with Tailwind CSS
            </p>
            <p className="text-lg text-purple-500 font-semibold">
              ✅ HMR should work now!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
