"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { School, Users, ShieldCheck, BarChart2, ArrowRight, Quote, Send, CheckCircle, AlertCircle } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

export default function Home() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('features');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Smooth scrolling for navigation links
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Scroll spy for active navigation
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'stats', 'testimonials', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Get Started button
  const handleGetStarted = () => {
    router.push('/login');
  };

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      setSubmitStatus('success');
      setContactForm({ name: '', email: '', message: '' });
      toast.success('Message sent successfully! We\'ll get back to you soon.');
    } catch (error) {
      setSubmitStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <School className="w-7 h-7 text-blue-600" />
            <span className="font-bold text-xl text-blue-700 tracking-tight">ICCT Smart Attendance</span>
          </div>
          <nav className="hidden md:flex gap-8 text-blue-700 font-medium">
            <button 
              onClick={() => scrollToSection('features')}
              className={`hover:text-blue-900 transition ${activeSection === 'features' ? 'text-blue-900 font-semibold' : ''}`}
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('stats')}
              className={`hover:text-blue-900 transition ${activeSection === 'stats' ? 'text-blue-900 font-semibold' : ''}`}
            >
              Why Us
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className={`hover:text-blue-900 transition ${activeSection === 'testimonials' ? 'text-blue-900 font-semibold' : ''}`}
            >
              Testimonials
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className={`hover:text-blue-900 transition ${activeSection === 'contact' ? 'text-blue-900 font-semibold' : ''}`}
            >
              Contact
            </button>
          </nav>
          <Button asChild className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between min-h-screen px-4 md:px-12 py-20 bg-gradient-to-br from-[var(--icctSAS-blue-light)] via-white to-[var(--icctSAS-blue-light)] overflow-hidden font-sans">
        <div className="flex-1 z-10 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold text-[color:var(--icctSAS-blue)] mb-6 leading-tight drop-shadow-sm">
            The Identity Platform<br className="hidden md:block" /> for Education
          </h1>
          <p className="max-w-xl text-lg md:text-2xl text-[color:var(--icctSAS-gray-dark)] mb-10">
            Secure, unified access for students, teachers, and schools. Accelerate learning with seamless digital identity and smart attendance.
          </p>
          <Button 
            onClick={handleGetStarted}
            className="bg-[color:var(--icctSAS-blue)] hover:bg-[color:var(--icctSAS-blue-dark)] text-white font-semibold px-10 py-4 text-xl rounded-md shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[color:var(--icctSAS-blue-light)]"
          >
            Get Started
          </Button>
        </div>
        <ParallaxHeroImage />
        <AnimatedGradientBackground />
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[{
          Icon: ShieldCheck,
          title: "Secure Identity",
          description: "Layered security and access management for your entire school community.",
        }, {
          Icon: BarChart2,
          title: "Analytics & Insights",
          description: "Real-time attendance analytics and actionable insights for educators and admins.",
        }, {
          Icon: Users,
          title: "Unified Access",
          description: "One place for students and teachers to access all their digital learning tools.",
        }].map(({ Icon, title, description }, i) => (
          <motion.div
            key={i}
            {...fadeInUp}
            viewport={{ once: true, amount: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center border border-[color:var(--icctSAS-blue-light)] hover:shadow-2xl transition"
          >
            <Icon className="w-10 h-10 text-[color:var(--icctSAS-blue)] mb-4" />
            <h3 className="font-bold text-xl text-[color:var(--icctSAS-blue)] mb-2">{title}</h3>
            <p className="text-[color:var(--icctSAS-gray-dark)]">{description}</p>
          </motion.div>
        ))}
      </section>

      {/* Section Divider */}
      <WaveDivider color="var(--icctSAS-blue-light)" />

      {/* Stats Section */}
      <section id="stats" className="bg-[color:var(--icctSAS-blue-light)] py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { label: "Uptime for Schools", value: "99.99%" },
            { label: "Students Supported", value: "1M+" },
            { label: "Support & Security", value: "24/7" },
          ].map((stat, i) => (
            <motion.div key={i} {...fadeInUp} viewport={{ once: true, amount: 0.3 }}>
              <div className="text-4xl font-extrabold text-[color:var(--icctSAS-blue)] mb-2">{stat.value}</div>
              <div className="text-[color:var(--icctSAS-blue)] font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section Divider */}
      <WaveDivider color="#fff" />

      {/* Testimonials Section */}
      <section id="testimonials" className="max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-[color:var(--icctSAS-blue)] text-center mb-10">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            "ICCT Smart Attendance has made our school's digital transition seamless and secure.",
            "The analytics dashboard gives us real-time insights we never had before.",
            "Our teachers and students love the unified access and easy sign-in.",
          ].map((text, i) => (
            <motion.div
              key={i}
              {...fadeInUp}
              viewport={{ once: true, amount: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-8 border border-[color:var(--icctSAS-blue-light)] flex flex-col items-center text-center hover:shadow-2xl transition"
            >
              <Quote className="w-8 h-8 text-[color:var(--icctSAS-blue-light)] mb-2" />
              <p className="text-[color:var(--icctSAS-gray-dark)] italic mb-4">“{text}”</p>
              <div className="font-bold text-[color:var(--icctSAS-blue)]">- User {i + 1}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section Divider */}
      <WaveDivider color="var(--icctSAS-blue-light)" />

      {/* Contact Section */}
      <section id="contact" className="bg-[color:var(--icctSAS-blue-light)] py-16 px-4">
        <div className="max-w-2xl mx-auto rounded-2xl shadow-lg bg-white p-8 border border-[color:var(--icctSAS-blue-light)]">
          <h2 className="text-2xl md:text-3xl font-bold text-[color:var(--icctSAS-blue)] mb-6 text-center">Contact Us</h2>
          
          {submitStatus === 'success' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">Message Sent Successfully!</h3>
              <p className="text-gray-600">We'll get back to you within 24 hours.</p>
              <Button 
                onClick={() => setSubmitStatus('idle')}
                variant="outline" 
                className="mt-4"
              >
                Send Another Message
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full border border-[color:var(--icctSAS-gray)] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--icctSAS-blue)]" 
                />
              </div>
              <div>
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full border border-[color:var(--icctSAS-gray)] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--icctSAS-blue)]" 
                />
              </div>
              <div>
                <textarea 
                  placeholder="Your Message" 
                  rows={4} 
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  required
                  className="w-full border border-[color:var(--icctSAS-gray)] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--icctSAS-blue)]" 
                />
              </div>
              
              {submitStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Failed to send message. Please try again.</span>
                </div>
              )}
              
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-[color:var(--icctSAS-blue)] hover:bg-[color:var(--icctSAS-blue-dark)] text-white px-6 py-2 rounded-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Message
                  </div>
                )}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[color:var(--icctSAS-blue-light)] py-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-[color:var(--icctSAS-blue)]" />
            <span className="font-bold text-lg text-[color:var(--icctSAS-blue)]">ICCT Smart Attendance</span>
          </div>
          <div className="text-[color:var(--icctSAS-gray)] text-sm">&copy; {new Date().getFullYear()} ICCT Smart Attendance. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

// Shared Wave Component
const WaveDivider = ({ color }: { color: string }) => (
  <div className="w-full overflow-hidden">
    <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
      <path fill={color} d="M0,80 C480,0 960,160 1440,80 L1440,0 L0,0 Z" />
    </svg>
  </div>
);

// Parallax Image with enhanced animations
function ParallaxHeroImage() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setOffset((window.scrollY || 0) * 0.08);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    // Initial check
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      ref={ref}
      className="flex-1 flex justify-center md:justify-end z-10 mt-10 md:mt-0"
      style={{ transform: `translateY(${offset}px)`, transition: "transform 0.2s linear" }}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ 
        opacity: isVisible ? 1 : 0.7, 
        scale: isVisible ? 1 : 0.95,
        rotate: isVisible ? 0 : -2
      }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.img
        src="/hero-illustration.svg"
        alt="Smart Attendance Illustration"
        className="w-80 md:w-[32rem] drop-shadow-2xl select-none pointer-events-none"
        draggable="false"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}

// Gradient Background
function AnimatedGradientBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none -z-10">
      <svg className="absolute top-0 right-0 w-1/2 h-1/2 opacity-40 animate-float" viewBox="0 0 600 600" aria-hidden="true">
        <ellipse cx="300" cy="300" rx="300" ry="200" fill="#3b82f6" fillOpacity="0.15" />
      </svg>
      <div className="w-full h-full animate-gradient-move bg-gradient-to-tr from-blue-200/40 via-white/0 to-blue-400/20 blur-2xl opacity-60" />
      <style jsx global>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradient-move 16s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
