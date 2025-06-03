import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Brain, Wand2, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-slate-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-xl font-bold text-slate-900">EduMotion</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
              >
                Sign in
              </Button>
              <Button
                onClick={() => navigate('/signup')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Create Engaging Educational Videos
              <span className="block text-purple-600">with AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Transform your lessons into captivating animated videos. Our AI-powered platform helps educators create professional educational content in minutes, not hours.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/signup')}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Start Creating for Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const demoSection = document.getElementById('how-it-works');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to Create Amazing Videos
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Our platform combines powerful AI technology with an intuitive interface to make video creation effortless.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Brain className="h-6 w-6" />,
                title: 'AI Script Generation',
                description: 'Turn your lesson plans into engaging scripts optimized for video content.',
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: 'Custom Characters',
                description: 'Create and customize animated characters to bring your lessons to life.',
              },
              {
                icon: <Wand2 className="h-6 w-6" />,
                title: 'One-Click Generation',
                description: 'Generate professional videos with a single click using our AI technology.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50 p-8 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 inline-block rounded-lg bg-purple-100 p-3 text-purple-600">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Create professional educational videos in three simple steps.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Input Your Content',
                description: 'Enter your lesson plan or learning objectives. Our AI will help structure it for video.',
              },
              {
                step: '02',
                title: 'Choose Your Style',
                description: 'Select characters, voices, and visual styles that match your teaching approach.',
              },
              {
                step: '03',
                title: 'Generate & Share',
                description: 'Click generate and let our AI create a professional educational video ready to share.',
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="mb-4 text-4xl font-bold text-purple-200">
                  {step.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-600 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Teaching?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-purple-100">
              Join thousands of educators creating engaging video content with EduMotion.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50"
                onClick={() => navigate('/signup')}
              >
                Get Started for Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-white">
              <Sparkles className="h-6 w-6" />
              <span className="ml-2 text-lg font-bold">EduMotion</span>
            </div>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} EduMotion. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};