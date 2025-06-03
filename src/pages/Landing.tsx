import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Video, Wand2, Users, Music, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-16 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Create Educational Videos
            <span className="block text-purple-600">with AI Assistance</span>
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-slate-600">
            Transform your teaching materials into engaging video content. Our AI-powered platform helps you create professional educational videos with custom characters, voices, and animations.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" leftIcon={<ArrowRight className="h-5 w-5" />}>
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to Create Amazing Educational Content
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Our platform provides all the tools and features you need to create engaging educational videos that your students will love.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* AI Video Generation */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3 text-purple-600">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                AI Video Generation
              </h3>
              <p className="text-slate-600">
                Transform your scripts into professional videos with our advanced AI technology. Add animations, transitions, and visual effects automatically.
              </p>
            </div>

            {/* Smart Script Writing */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3 text-purple-600">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Smart Script Writing
              </h3>
              <p className="text-slate-600">
                Get AI assistance in writing and optimizing your educational scripts. Ensure clear, engaging, and effective content delivery.
              </p>
            </div>

            {/* Custom Characters */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3 text-purple-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Custom Characters
              </h3>
              <p className="text-slate-600">
                Create and customize teaching characters with unique personalities, voices, and appearances to make your content more engaging.
              </p>
            </div>

            {/* Background Music */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3 text-purple-600">
                <Music className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Background Music
              </h3>
              <p className="text-slate-600">
                Choose from our library of royalty-free music tracks to enhance your videos with the perfect background ambiance.
              </p>
            </div>

            {/* Secure Platform */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3 text-purple-600">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">
                Secure Platform
              </h3>
              <p className="text-slate-600">
                Your content is safe with us. Enjoy secure storage, backup, and sharing features for all your educational videos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-purple-600 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Teaching?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-purple-100">
              Join thousands of educators who are already creating engaging video content with our AI-powered platform.
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50"
                leftIcon={<ArrowRight className="h-5 w-5" />}
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase text-white">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/features" className="hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase text-white">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase text-white">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase text-white">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-800 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} EduMotion. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};