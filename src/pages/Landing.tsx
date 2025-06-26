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
  Heart
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Bolt.new Badge - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <a 
          href="https://bolt.new/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-110"
        >
          <img 
            src="https://tpeqefpratvytsqnmsst.supabase.co/storage/v1/object/public/assets//black_circle_360x360.png" 
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
            <div className="mb-8 inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-orange-100 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                🚀 AI-Powered Education
              </span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              Transform Your Teaching with
              <span className="relative mt-2 block bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                AI-Generated Videos
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 338 12" fill="none">
                  <path d="M1 5.26C47.65 4.4 94.29 4.35 140.94 5.11c43.86 0.72 87.71 1.45 131.57 2.17 21.44 0.35 42.88 0.7 64.31 1.06" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="100%" stopColor="#EA580C" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            <p className="mb-12 max-w-2xl text-lg leading-relaxed text-slate-600">
              Create stunning educational content in minutes, not hours. Our AI-powered platform helps you generate professional videos with custom characters, engaging animations, and natural voices.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="group h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600"
                  leftIcon={<Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />}
                >
                  Start Creating Now
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-14 px-8 text-lg border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Professional Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Dedicated Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">85%</div>
              <div className="mt-2 text-sm text-slate-600">Improved Information Retention</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">2x</div>
              <div className="mt-2 text-sm text-slate-600">Faster Learning Progress</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">40%</div>
              <div className="mt-2 text-sm text-slate-600">Higher Student Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">75%</div>
              <div className="mt-2 text-sm text-slate-600">Time Saved Creating Content</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-orange-100 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to Create Amazing Educational Content
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Our platform provides all the tools and features you need to create engaging educational videos that your students will love.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* AI Video Generation */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-300">
              <div className="mb-6 inline-flex rounded-xl bg-gradient-to-r from-purple-100 to-orange-100 p-3 text-purple-600 ring-8 ring-purple-50">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                AI Video Generation
              </h3>
              <p className="text-slate-600">
                Transform your scripts into professional videos with our advanced AI technology. Add animations, transitions, and visual effects automatically.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Smart Script Writing */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-300">
              <div className="mb-6 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600 ring-8 ring-purple-50">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                Smart Script Writing
              </h3>
              <p className="text-slate-600">
                Get AI assistance in writing and optimizing your educational scripts. Ensure clear, engaging, and effective content delivery.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-purple-600">
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Custom Characters */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-300">
              <div className="mb-6 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600 ring-8 ring-purple-50">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900">
                Custom Characters
              </h3>
              <p className="text-slate-600">
                Create and customize teaching characters with unique personalities, voices, and appearances to make your content more engaging.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-purple-600">
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="relative overflow-hidden bg-slate-50 py-24">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/4778611/pexels-photo-4778611.jpeg')] bg-cover bg-center bg-no-repeat opacity-5"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-orange-100 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                Simple Process
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Create Videos in 3 Simple Steps
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
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
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Write Your Script</h3>
              <p className="text-slate-600">
                Enter your content or use our AI to help generate an engaging educational script.
              </p>
            </div>

            <div className="relative text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-2xl font-bold text-white">
                  2
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Choose Your Style</h3>
              <p className="text-slate-600">
                Select characters, voices, and visual style to match your content.
              </p>
            </div>

            <div className="relative text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-2xl font-bold text-white">
                  3
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Generate & Share</h3>
              <p className="text-slate-600">
                Let our AI create your video and share it with your students.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative overflow-hidden py-24 bg-white">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/5212703/pexels-photo-5212703.jpeg')] bg-cover bg-center bg-no-repeat opacity-5"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-orange-100 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                Why Choose Us
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Benefits That Make a Difference
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
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
              <div key={index} className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
                  {benefit.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="relative overflow-hidden bg-slate-50 py-24">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/5905502/pexels-photo-5905502.jpeg')] bg-cover bg-center bg-no-repeat opacity-5"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-orange-100 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                Testimonials
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Loved by Educators Worldwide
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
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
              <div key={index} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                  </div>
                </div>
                <div className="mt-6 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current text-yellow-400" />
                  ))}
                </div>
                <p className="mt-4 text-slate-600">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-orange-100 px-4 py-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                Pricing Plans
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Professional Tools for Professional Educators
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Invest in your teaching with our powerful AI video creation platform.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            {[
              {
                name: "Professional",
                price: "$100",
                description: "Perfect for individual educators",
                features: [
                  "Unlimited video creation",
                  "Full HD 1080p quality",
                  "Custom AI characters",
                  "Advanced script generation",
                  "Priority rendering",
                  "Premium voice options",
                  "Analytics dashboard",
                  "Priority email support",
                  "Access to template library",
                  "Regular feature updates"
                ]
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For institutions and organizations",
                features: [
                  "Everything in Professional",
                  "Custom video limits",
                  "4K video quality",
                  "Custom branding",
                  "Team collaboration",
                  "API access",
                  "Dedicated account manager",
                  "Custom integration support",
                  "Training sessions",
                  "SLA guarantees"
                ]
              }
            ].map((plan, index) => (
              <div key={index} className={`rounded-2xl border ${index === 0 ? 'border-purple-300 bg-purple-50' : 'border-slate-200 bg-white'} p-8 shadow-sm`}>
                <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="ml-1 text-slate-600">/month</span>}
                </div>
                <p className="mt-2 text-slate-600">{plan.description}</p>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-8 w-full ${index === 0 ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                  variant={index === 0 ? 'default' : 'outline'}
                >
                  {index === 1 ? 'Contact Sales' : 'Get Started'}
                </Button>
              </div>
            ))}
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
              Join thousands of educators who are already creating engaging video content with our AI-powered platform.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="group h-14 bg-white px-8 text-lg text-purple-600 hover:bg-purple-50"
                  leftIcon={<Zap className="h-5 w-5 transition-transform group-hover:scale-110" />}
                >
                  Get Started Free
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
                <li>
                  <Link to="/templates" className="hover:text-white">
                    Templates
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
                <li>
                  <Link to="/careers" className="hover:text-white">
                    Careers
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
                <li>
                  <Link to="/community" className="hover:text-white">
                    Community
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
                <li>
                  <Link to="/security" className="hover:text-white">
                    Security
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