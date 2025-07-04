import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Video, 
  Wand2, 
  Users, 
  Music, 
  Shield, 
  Brain,
  Sparkles,
  Clock,
  Star,
  CheckCircle2,
  Zap,
  Play,
  Lightbulb,
  Layers,
  Settings,
  BarChart,
  MessageSquare,
  Heart,
  Mic2
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Bolt.new Badge - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <a 
          href="https://bolt.new/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-110"
        >
          <img 
            src="https://tpeqefpratvytsqnmsst.supabase.co/storage/v1/object/public/assets//white_circle_360x360.png" 
            alt="Built with Bolt.new" 
            className="h-12 w-12 sm:h-16 sm:w-16 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 animate-spin hover:animate-pulse"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(147, 51, 234, 0.5)) drop-shadow(0 0 20px rgba(234, 88, 12, 0.3))',
              animationDuration: '8s'
            }}
          />
        </a>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3769714/pexels-photo-3769714.jpeg')] bg-cover bg-center bg-no-repeat opacity-5"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-screen flex-col items-center justify-center py-16 text-center">
            <div className="mb-8 inline-flex items-center rounded-full bg-gradient-to-r from-purple-900/50 to-orange-900/50 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-200 to-orange-200 bg-clip-text text-transparent">
                🚀 AI-Powered Education
              </span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
              Transform Your Teaching with
              <span className="relative mt-2 block bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
                AI-Generated Videos
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 338 12" fill="none">
                  <path d="M1 5.26C47.65 4.4 94.29 4.35 140.94 5.11c43.86 0.72 87.71 1.45 131.57 2.17 21.44 0.35 42.88 0.7 64.31 1.06" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#C084FC" />
                      <stop offset="100%" stopColor="#F97316" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-300">
              Create stunning educational content in minutes, not hours. Our AI-powered platform helps you generate professional videos with custom characters, engaging animations, and natural voices.
            </p>
            
            {/* Early Adopter Pricing Highlight */}
            <div className="mb-8 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-orange-900/30 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">First 100 Customers Only</span>
                <Sparkles className="h-5 w-5 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                $50/month LIFETIME for first 100 customers
              </h3>
              <p className="text-slate-300 text-sm">
                Lock in this special pricing forever! Help us shape the future of AI education tools. 
                
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/login">
                <Button 
                  size="lg" 
                  className="group h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600"
                  leftIcon={<Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />}
                >
                  Become an Early Adopter
                </Button>
              </Link>
             
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-slate-700 bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">85%</div>
              <div className="mt-2 text-sm text-slate-300">Improved Information Retention</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">10x</div>
              <div className="mt-2 text-sm text-slate-300">Faster Learning Progress</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">60%</div>
              <div className="mt-2 text-sm text-slate-300">Higher Student Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">95%</div>
              <div className="mt-2 text-sm text-slate-300">Time Saved Creating Content</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-purple-900/50 to-orange-900/50 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-200 to-orange-200 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything You Need to Create Amazing Educational Content
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Our platform provides all the tools and features you need to create engaging educational videos that your students will love.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* AI Video Generation */}
            <div className="group relative rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-500">
              <div className="mb-6 inline-flex rounded-xl bg-gradient-to-r from-purple-900/50 to-orange-900/50 p-3 text-purple-400 ring-8 ring-purple-900/20">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">
                AI Video Generation
              </h3>
              <p className="text-slate-300">
                Transform your scripts into professional videos with our advanced AI technology. Add animations, transitions, and visual effects automatically.
              </p>
            </div>

            {/* Smart Script Writing */}
            <div className="group relative rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-500">
              <div className="mb-6 inline-flex rounded-xl bg-purple-900/50 p-3 text-purple-400 ring-8 ring-purple-900/20">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">
                AI Script Generation
              </h3>
              <p className="text-slate-300">
                Get AI assistance in writing and optimizing your educational scripts. Ensure clear, engaging, and effective content delivery.
              </p>
            </div>

            {/* ElevenLabs Voices */}
            <div className="group relative rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-500">
              <div className="mb-6 inline-flex rounded-xl bg-purple-900/50 p-3 text-purple-400 ring-8 ring-purple-900/20">
                <Mic2 className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">
                ElevenLabs AI Voices
              </h3>
              <p className="text-slate-300">
                Premium AI-generated voices powered by ElevenLabs technology. Create natural-sounding narration for your educational content.
              </p>
            </div>

            {/* AI Storyboarding */}
            <div className="group relative rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-500">
              <div className="mb-6 inline-flex rounded-xl bg-purple-900/50 p-3 text-purple-400 ring-8 ring-purple-900/20">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">
                AI Storyboarding
              </h3>
              <p className="text-slate-300">
                Automatically generate visual storyboards from your content. Plan your video structure with AI-powered scene suggestions.
              </p>
            </div>

            {/* AI Generated Clips */}
            <div className="group relative rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-500">
              <div className="mb-6 inline-flex rounded-xl bg-purple-900/50 p-3 text-purple-400 ring-8 ring-purple-900/20">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">
                AI Generated Clips
              </h3>
              <p className="text-slate-300">
                Generate custom video clips and animations using AI. Create unique visual content tailored to your educational material.
              </p>
            </div>

            {/* Royalty Free Music */}
            <div className="group relative rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-500">
              <div className="mb-6 inline-flex rounded-xl bg-purple-900/50 p-3 text-purple-400 ring-8 ring-purple-900/20">
                <Music className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">
                Royalty Free Music
              </h3>
              <p className="text-slate-300">
                Access a library of high-quality, royalty-free music tracks. Perfect background music for any educational video style.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="relative overflow-hidden bg-slate-800 py-24">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/4778611/pexels-photo-4778611.jpeg')] bg-cover bg-center bg-no-repeat opacity-5"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-purple-900/50 to-orange-900/50 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-200 to-orange-200 bg-clip-text text-transparent">
                Simple Process
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Create Videos in 3 Simple Steps
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Our streamlined process makes it easy to create professional educational videos in minutes.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <div className="relative text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-orange-500 text-2xl font-bold text-white">
                  1
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Write Your Script</h3>
              <p className="text-slate-300">
                Enter your content or use our AI to help generate an engaging educational script.
              </p>
            </div>

            <div className="relative text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-2xl font-bold text-white">
                  2
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Choose Your Style</h3>
              <p className="text-slate-300">
                Select characters, voices, and visual style to match your content.
              </p>
            </div>

            <div className="relative text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-2xl font-bold text-white">
                  3
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Generate & Share</h3>
              <p className="text-slate-300">
                Let our AI create your video and share it with your students.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative overflow-hidden py-24 bg-slate-900">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/5212703/pexels-photo-5212703.jpeg')] bg-cover bg-center bg-no-repeat opacity-5"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-purple-900/50 to-orange-900/50 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-200 to-orange-200 bg-clip-text text-transparent">
                Why Choose Us
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Benefits That Make a Difference
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Discover how our platform can transform your teaching experience and enhance student engagement.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Clock className="h-6 w-6" />,
                title: "Save Time",
                description: "Create professional videos in minutes instead of hours or days."
              },
              {
                icon: <Lightbulb className="h-6 w-6" />,
                title: "Boost Engagement",
                description: "Keep students engaged with interactive and visually appealing content."
              },
              {
                icon: <BarChart className="h-6 w-6" />,
                title: "Track Progress",
                description: "Monitor student engagement and learning outcomes with analytics."
              },
              {
                icon: <Heart className="h-6 w-6" />,
                title: "Student Success",
                description: "Help students learn better with personalized, engaging content."
              }
            ].map((benefit, index) => (
              <div key={index} className="rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 inline-flex rounded-xl bg-purple-900/50 p-3 text-purple-400">
                  {benefit.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{benefit.title}</h3>
                <p className="text-slate-300">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="relative overflow-hidden bg-slate-800 py-24">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/5905502/pexels-photo-5905502.jpeg')] bg-cover bg-center bg-no-repeat opacity-5"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-purple-900/50 to-orange-900/50 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-200 to-orange-200 bg-clip-text text-transparent">
                Testimonials
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Loved by Educators Worldwide
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              See what teachers and instructors are saying about our platform.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Sarah Johnson",
                role: "High School Teacher",
                image: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=120",
                quote: "This platform has revolutionized how I create content for my students. The AI-generated videos are engaging and save me hours of work."
              },
              {
                name: "Michael Chen",
                role: "University Professor",
                image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=120",
                quote: "The quality of the generated videos is impressive. My students love the interactive characters and clear explanations."
              },
              {
                name: "Emily Rodriguez",
                role: "Online Course Creator",
                image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=120",
                quote: "This tool has helped me scale my online course production. The AI script writing feature is particularly helpful."
              }
            ].map((testimonial, index) => (
              <div key={index} className="rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-300">{testimonial.role}</div>
                  </div>
                </div>
                <div className="mt-6 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current text-yellow-400" />
                  ))}
                </div>
                <p className="mt-4 text-slate-300">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-purple-900/50 to-orange-900/50 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-200 to-orange-200 bg-clip-text text-transparent">
                Early Adopter Pricing
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Join the First 100 Early Adopters
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Help us build the future of AI-powered educational content creation. Your feedback will shape our product.
            </p>
          </div>

          <div className="mt-16 flex justify-center">
            <div className="w-full max-w-lg">
              <div className="rounded-2xl border border-purple-500 bg-gradient-to-br from-purple-900/30 to-orange-900/30 p-8 shadow-lg backdrop-blur-sm">
                <div className="text-center">
                  <div className="mb-4 inline-flex items-center rounded-full bg-yellow-400/20 px-3 py-1">
                    <span className="text-sm font-semibold text-yellow-400">FIRST 100 ONLY</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-2">Early Adopter Lifetime</h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-white">$50</span>
                    <span className="text-slate-300 ml-2">/month for life</span>
                  </div>
                  <p className="text-slate-300 mb-6">
                    Lifetime pricing locked in forever - only for our first 100 customers
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">🔥 Lifetime $50/month pricing lock</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span className="text-slate-300">🎥 10 Video generations/month</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">🗣 60 AI generate voice minutes/month </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">AI Storyboarding Assistant</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">Royalty Free Music Library</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">AI Script Generation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">Direct Feedback Channel</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">Priority Support</span>
                    </div>
                  </div>

                  <Link to="/login">
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600 text-lg py-3"
                      leftIcon={<Sparkles className="h-5 w-5" />}
                    >
                      Become an Early Adopter
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-orange-500 py-24">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/5212339/pexels-photo-5212339.jpeg')] bg-cover bg-center bg-no-repeat opacity-10"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Teaching?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-purple-100">
              Join the first 100 educators who will help shape the future of AI-powered educational content creation.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="group h-14 bg-white px-8 text-lg text-purple-600 hover:bg-purple-50"
                  leftIcon={<Zap className="h-5 w-5 transition-transform group-hover:scale-110" />}
                >
                  Join Early Adopters
                </Button>
              </Link>
              <a 
                href="https://youtu.be/9-I3XtHrMKA"
                target="_blank"
                rel="noopener noreferrer"
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
            <p>&copy; {new Date().getFullYear()} EduAnimated. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};