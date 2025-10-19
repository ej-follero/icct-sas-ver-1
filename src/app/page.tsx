"use client";

import React, { useState, useEffect } from 'react';
import { School, Users, ShieldCheck, BarChart2, ArrowRight, Menu, X, CheckCircle, Clock, Target, Star, Zap, Globe, Award, CreditCard } from 'lucide-react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignIn = () => {
    window.location.href = '/login';
  };

  const handleGetStarted = () => {
    window.location.href = '/register';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-xl border-b border-gray-200' : 'bg-white/90 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg">
                <School className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ICCT Smart Attendance
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">Features</a>
              <a href="#benefits" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">About</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">Team</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">Contact</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleSignIn}
                className="text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 hover:scale-105"
              >
                Login
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Try Demo
              </button>
            </div>

            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
            <div className="px-4 py-2 space-y-2">
              <a href="#features" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">Features</a>
              <a href="#benefits" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">About</a>
              <a href="#testimonials" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">Team</a>
              <a href="#contact" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
              <div className="pt-4 pb-2 space-y-2">
                <button 
                  onClick={handleSignIn}
                  className="block w-full text-left py-2 text-blue-600 font-medium"
                >
                  Login
                </button>
                <button 
                  onClick={handleGetStarted}
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-medium"
                >
                  Try Demo
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                Thesis Project - ICCT Colleges
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
                Smart ID-Based
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Attendance System
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                An innovative student attendance tracking system using ID card scanning technology. 
                Developed as a capstone project to modernize classroom attendance management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <button 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl flex items-center justify-center group"
                >
                  Try Demo System
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={handleSignIn}
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm"
                >
                  Admin Login
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  ID Card Scanning
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  Real-time Tracking
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  Automated Reports
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative">
                <div className="bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-500 border border-gray-100">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6">
                    <BarChart2 className="w-12 h-12 text-white mb-4" />
                    <h3 className="text-white text-xl font-bold">Attendance Dashboard</h3>
                    <p className="text-blue-100 text-sm mt-2">Live attendance monitoring</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Today's Attendance</span>
                      <div className="flex items-center">
                        <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                          <div className="w-20 h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
                        </div>
                        <span className="text-green-600 font-bold">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Students Present</span>
                      <span className="text-blue-600 font-bold text-lg">34/40</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Last Scan</span>
                      <span className="text-green-600 font-bold">2 mins ago</span>
                    </div>
                  </div>
                </div>

                {/* Floating Notification Card */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-bounce">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">ID Scanned</p>
                      <p className="text-xs text-gray-500">Student ID: 2024-001</p>
                    </div>
                  </div>
                </div>

                {/* Floating Stats Card */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Class Attendance</p>
                      <p className="text-xs text-gray-500">IT-4A: 34 of 40 present</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium mb-6">
              <Star className="w-4 h-4 mr-2" />
              System Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Key Features of Our System
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive attendance management solution designed specifically for ICCT Colleges 
              to streamline student attendance tracking through ID card scanning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CreditCard,
                title: "ID Card Scanning",
                description: "Students simply scan their ID cards using the integrated scanner to mark their attendance automatically and instantly.",
                color: "from-green-500 to-emerald-600"
              },
              {
                icon: BarChart2,
                title: "Real-time Dashboard",
                description: "Teachers and administrators can monitor attendance in real-time with comprehensive analytics and visual reports.",
                color: "from-blue-500 to-cyan-600"
              },
              {
                icon: Users,
                title: "Student Management",
                description: "Complete student database management with class schedules, attendance history, and performance tracking.",
                color: "from-purple-500 to-violet-600"
              },
              {
                icon: Clock,
                title: "Automated Tracking",
                description: "No more manual roll calls. The system automatically records timestamps and generates attendance reports.",
                color: "from-orange-500 to-red-600"
              },
              {
                icon: Target,
                title: "Class Integration",
                description: "Seamlessly integrates with class schedules and subject assignments for accurate attendance recording.",
                color: "from-indigo-500 to-blue-600"
              },
              {
                icon: ShieldCheck,
                title: "Secure Database",
                description: "All student data and attendance records are securely stored with proper access controls and data protection.",
                color: "from-teal-500 to-green-600"
              }
            ].map((feature, index) => (
              <div key={index} className="group bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:border-blue-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className={`bg-gradient-to-r ${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium mb-6">
              <Award className="w-4 h-4 mr-2" />
              About This Project
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Why We Built This System
            </h2>
            <p className="text-xl text-gray-600">
              A thesis project aimed at solving real attendance management challenges
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                value: "100%",
                label: "Accurate Tracking",
                description: "Eliminates manual attendance errors",
                icon: CheckCircle,
                color: "from-green-500 to-emerald-600"
              },
              {
                value: "3 Secs",
                label: "Scan Time",
                description: "Quick ID scanning for efficiency",
                icon: Clock,
                color: "from-blue-500 to-cyan-600"
              },
              {
                value: "Real-time",
                label: "Data Updates",
                description: "Instant attendance monitoring",
                icon: Zap,
                color: "from-indigo-500 to-purple-600"
              }
            ].map((stat, index) => (
              <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/50">
                <div className={`bg-gradient-to-r ${stat.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">{stat.value}</div>
                <div className="text-xl font-semibold text-gray-900 mb-3">{stat.label}</div>
                <p className="text-gray-600">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium mb-6">
              <Users className="w-4 h-4 mr-2" />
              Development Team
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600">
              Computer Science students working together to create innovative solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "As the lead developer, I focused on creating an intuitive user interface and seamless ID scanning functionality for students and teachers.",
                author: "Team Member 1",
                role: "Lead Developer & UI/UX Designer",
                avatar: "T1"
              },
              {
                quote: "I handled the backend development and database design, ensuring secure data storage and efficient attendance record management.",
                author: "Team Member 2",
                role: "Backend Developer & Database Administrator",
                avatar: "T2"
              },
              {
                quote: "My role involved system testing, documentation, and ensuring the application meets all requirements for our thesis project.",
                author: "Team Member 3",
                role: "Quality Assurance & Documentation",
                avatar: "T3"
              }
            ].map((member, index) => (
              <div key={index} className="group bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <p className="text-gray-700 mb-8 italic text-lg leading-relaxed">"{member.quote}"</p>
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      {member.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{member.author}</div>
                      <div className="text-gray-600">{member.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Test Our System?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Experience our ID-based attendance system developed as part of our Computer Science thesis project
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={handleGetStarted}
              className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Try Demo System
            </button>
            <button 
              onClick={handleSignIn}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm"
            >
              Administrator Login
            </button>
          </div>
          
          <div className="mt-12 flex items-center justify-center space-x-8 text-blue-100">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Thesis Project
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              ID Card Scanning
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Real-time Monitoring
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                  <School className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">ICCT Smart Attendance</span>
              </div>
              <p className="text-gray-400 mb-6 text-lg leading-relaxed max-w-md">
                A thesis project by Computer Science students at ICCT Colleges. 
                Modernizing attendance management through innovative ID scanning technology.
              </p>
              <div className="flex space-x-4">
                <div className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                  <Users className="w-5 h-5" />
                </div>
                <div className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                  <Star className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">System</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Features</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">About</a></li>
                <li><a href="/demo" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Demo</a></li>
                <li><a href="/documentation" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Project</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#testimonials" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Team</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Contact</a></li>
                <li><a href="/thesis" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Thesis Paper</a></li>
                <li><a href="/github" className="hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Source Code</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-lg">
              © {new Date().getFullYear()} ICCT Smart Attendance System. Thesis Project - All rights reserved.
            </p>
            <div className="flex space-x-6 mt-6 md:mt-0">
              <button 
                onClick={handleSignIn}
                className="text-gray-400 hover:text-white transition-colors text-lg"
              >
                Admin Login
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Try Demo
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}