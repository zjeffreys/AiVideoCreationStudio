import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Brain, Wand2, Users, Play, CheckCircle, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-slate-50">
      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className="h-8 w-8 text-purple-600" />
              </motion.div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                EduMotion
              </span>
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
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <motion.div 
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,0,255,0.1),rgba(120,0,255,0))]" />
        </motion.div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 mb-8">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Video Creation</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeIn}
              className="text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl"
            >
              Create Engaging
              <span className="block mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Educational Videos
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="mx-auto mt-8 max-w-2xl text-lg text-slate-600"
            >
              Transform your lessons into captivating animated videos in minutes. Our AI-powered platform helps educators create professional content that engages students and makes learning fun.
            </motion.p>
            
            <motion.div 
              variants={fadeIn}
              className="mt-10 flex items-center justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => navigate('/signup')}
                rightIcon={<ArrowRight className="h-5 w-5" />}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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
                leftIcon={<Play className="h-4 w-4" />}
              >
                See How It Works
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 
              variants={fadeIn}
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              Everything You Need to Create
              <span className="block text-purple-600">Amazing Educational Videos</span>
            </motion.h2>
            <motion.p 
              variants={fadeIn}
              className="mx-auto mt-4 max-w-2xl text-lg text-slate-600"
            >
              Our platform combines cutting-edge AI technology with an intuitive interface to make video creation effortless and enjoyable.
            </motion.p>
          </motion.div>

          <motion.div 
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                icon: <Brain className="h-6 w-6" />,
                title: 'AI Script Generation',
                description: 'Transform your lesson plans into engaging scripts optimized for video content, with smart suggestions and automatic improvements.',
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: 'Custom Characters',
                description: 'Create and customize animated characters with unique personalities, voices, and teaching styles to bring your lessons to life.',
              },
              {
                icon: <Wand2 className="h-6 w-6" />,
                title: 'One-Click Generation',
                description: 'Generate professional-quality videos instantly with our advanced AI technology, complete with animations and synchronized audio.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-200"
              >
                <div className="mb-4 inline-block rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 p-3 text-purple-600 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 
              variants={fadeIn}
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              Create Videos in Three Simple Steps
            </motion.h2>
            <motion.p 
              variants={fadeIn}
              className="mx-auto mt-4 max-w-2xl text-lg text-slate-600"
            >
              Our streamlined process makes it easy to create professional educational videos.
            </motion.p>
          </motion.div>

          <motion.div 
            className="mt-16 grid gap-8 lg:grid-cols-3"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                step: '01',
                title: 'Input Your Content',
                description: 'Enter your lesson plan or learning objectives. Our AI will help structure it for maximum engagement.',
              },
              {
                step: '02',
                title: 'Customize Your Style',
                description: 'Choose from our library of characters, voices, and visual styles to match your teaching approach.',
              },
              {
                step: '03',
                title: 'Generate & Share',
                description: 'Let our AI create a professional video, then share it with your students or publish it to your platform.',
              },
            ].map((step, index) => (
              <motion.div 
                key={index} 
                variants={fadeIn}
                className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm"
              >
                <div className="mb-4 text-6xl font-bold text-purple-100">
                  {step.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-slate-600">{step.description}</p>
                <div className="absolute top-4 right-4">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),rgba(255,255,255,0))]" />
        
        <motion.div 
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div 
            className="text-center"
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Teaching?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-purple-100">
              Join thousands of educators creating engaging video content with EduMotion.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 min-w-[200px]"
                onClick={() => navigate('/signup')}
              >
                Get Started for Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white/10 min-w-[200px]"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center text-white mb-4">
                <Sparkles className="h-6 w-6" />
                <span className="ml-2 text-lg font-bold">EduMotion</span>
              </div>
              <p className="text-sm text-slate-400">
                Creating the future of educational content with AI.
              </p>
            </div>
            
            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Examples', 'Documentation'],
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Contact'],
              },
              {
                title: 'Legal',
                links: ['Privacy', 'Terms', 'Security'],
              },
            ].map((section, index) => (
              <div key={index}>
                <h4 className="font-medium text-white mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} EduMotion. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};