import { SignIn, SignUp } from '@clerk/clerk-react'
import { useState } from 'react'
import { Briefcase, Sparkles, Target, Zap } from 'lucide-react'

export default function LandingPage() {
  const [showSignIn, setShowSignIn] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Auto Job Hunter
            </h1>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Hero content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                Find Your Dream Job with
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI-Powered </span>
                Precision
              </h2>
              <p className="text-xl text-gray-600">
                Let our intelligent agents scan, match, and craft personalized outreach for the perfect opportunities.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Smart Scanning</h3>
                  <p className="text-sm text-gray-600">AI agents search multiple job boards simultaneously</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Perfect Matching</h3>
                  <p className="text-sm text-gray-600">Intelligent algorithms find jobs that fit your skills</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Auto Outreach</h3>
                  <p className="text-sm text-gray-600">Personalized emails and messages generated for you</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Track Everything</h3>
                  <p className="text-sm text-gray-600">Manage all your applications in one dashboard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth forms */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setShowSignIn(true)}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                      showSignIn
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowSignIn(false)}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                      !showSignIn
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <div className="flex justify-center">
                  {showSignIn ? (
                    <SignIn routing="hash" signUpUrl="#" />
                  ) : (
                    <SignUp routing="hash" signInUrl="#" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
