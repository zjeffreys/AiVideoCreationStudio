import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Video, 
  Youtube,
  Wand2,
  Sparkles,
  CheckCircle2,
  Zap,
  Play,
  Upload,
  Settings2,
  Share2,
  Star
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2773498/pexels-photo-2773498.jpeg')] bg-cover bg-center bg-no-repeat opacity-10"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-screen flex-col items-center justify-center py-16 text-center">
            <div className="mb-8 inline-flex items-center rounded-full bg-purple-100 px-4 py-1.5">
              <span className="text-sm font-medium text-purple-800">
                Professional Video Creation • Direct YouTube Publishing
              </span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              Create Stunning
              <span className="relative mt-2 block text-purple-600">
                1080p Videos with AI
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 338 12" fill="none">
                  <path d="M1 5.26C47.65 4.4 94.29 4.35 140.94 5.11c43.86 0.72 87.71 1.45 131.57 2.17 21.44 0.35 42.88 0.7 64.31 1.06" stroke="#C084FC" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            <p className="mb-12 max-w-2xl text-lg leading-relaxed text-slate-600">
              Transform your content creation with our professional AI video editor. Create, edit, and publish directly to YouTube with just a few clicks. Get stunning results powered by industry-leading AI models.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="group h-14 px-8 text-lg"
                  leftIcon={<Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />}
                >
                  Start Creating Now
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-14 px-8 text-lg"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">1080p</div>
              <div className="mt-2 text-sm text-slate-600">HD Video Quality</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">1-Click</div>
              <div className="mt-2 text-sm text-slate-600">YouTube Upload</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">24/7</div>
              <div className="mt-2 text-sm text-slate-600">AI Processing</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">100%</div>
              <div className="mt-2 text-sm text-slate-600">Cloud-Based</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Professional Video Creation Made Simple
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Our AI-powered platform handles the technical details, letting you focus on creating amazing content.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-6 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                AI-Powered Editing
              </h3>
              <p className="text-slate-600">
                Let our advanced AI handle transitions, effects, and timing. Get professional results without the technical hassle.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-6 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
                <Youtube className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                YouTube Integration
              </h3>
              <p className="text-slate-600">
                Publish directly to your YouTube channel with one click. Optimize titles, descriptions, and tags automatically.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-6 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
                <Settings2 className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                Professional Quality
              </h3>
              <p className="text-slate-600">
                Create stunning 1080p videos with crystal-clear audio. Perfect for any content type or platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Create Videos in Minutes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Our streamlined process makes video creation fast and effortless.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Upload className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Upload Your Content</h3>
              <p className="mt-2 text-slate-600">
                Import your footage or start with our templates
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Wand2 className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">AI Enhancement</h3>
              <p className="mt-2 text-slate-600">
                Let our AI optimize and enhance your video
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Share2 className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Share & Publish</h3>
              <p className="mt-2 text-slate-600">
                Export in 1080p or publish directly to YouTube
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Professional Tools for Content Creators
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Professional</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-slate-900">$100</span>
                <span className="ml-1 text-slate-600">/month</span>
              </div>
              <p className="mt-2 text-slate-600">Perfect for content creators</p>
              <ul className="mt-6 space-y-4">
                {[
                  "Unlimited 1080p video exports",
                  "Direct YouTube publishing",
                  "AI-powered editing",
                  "Premium effects library",
                  "Priority processing",
                  "Advanced audio tools",
                  "Email support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" fullWidth>Get Started</Button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Enterprise</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-slate-900">Custom</span>
              </div>
              <p className="mt-2 text-slate-600">For teams and organizations</p>
              <ul className="mt-6 space-y-4">
                {[
                  "Everything in Professional",
                  "Custom video limits",
                  "4K video quality",
                  "Custom branding",
                  "Team collaboration",
                  "API access",
                  "24/7 priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8" variant="outline" fullWidth>Contact Sales</Button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-purple-600 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Create Amazing Videos?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-purple-100">
              Join creators who are already using our AI-powered platform to produce stunning videos.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="group h-14 bg-white px-8 text-lg text-purple-600 hover:bg-purple-50"
                  leftIcon={<Zap className="h-5 w-5 transition-transform group-hover:scale-110" />}
                >
                  Start Creating Now
                </Button>
              </Link>
              <a 
                href="#watch-demo" 
                className="inline-flex items-center gap-2 text-purple-100 hover:text-white"
              >
                <Play className="h-5 w-5" />
                Watch Demo
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};