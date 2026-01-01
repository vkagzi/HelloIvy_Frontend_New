'use client';
import React, { useState } from 'react';
import './LandingPage.css';

export default function Home(): React.ReactElement {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <img
              src="/images/icon.png"
              alt="HelloIvy - AI Powered Education Platform Logo"
              className="logo-img responsive-img"
            />
            <a href="#intro" className="logo-text" aria-label="HelloIvy - AI Powered Education Platform">
              hello<span className="logo-highlight">ivy</span>
            </a>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            ☰
          </button>

          <nav className="nav-desktop" role="navigation" aria-label="Main navigation">
            <ul className="nav-list">
              <li><a href="#intro" onClick={(e) => { e.preventDefault(); scrollToSection('intro'); }} className="nav-link" aria-label="Go to introduction section">Intro</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }} className="nav-link" aria-label="Go to about us section">About Us</a></li>
              <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} className="nav-link" aria-label="Go to features section">Features</a></li>
              <li><a href="#users" onClick={(e) => { e.preventDefault(); scrollToSection('users'); }} className="nav-link" aria-label="Go to users section">Users</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }} className="nav-link" aria-label="Go to contact section">Contact Us</a></li>
            </ul>
          </nav>

          <div className="desktop-buttons">
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = '/contact'}
            >
              Talk To Expert
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => window.location.href = '/signup'}
            >
              Login/Register
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {showMobileMenu && (
          <>
            <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)} />
            <div className={`mobile-menu ${showMobileMenu ? 'open' : ''}`}>
              <button className="mobile-menu-close" onClick={() => setShowMobileMenu(false)}>
                ✕
              </button>
              <nav>
                <ul className="mobile-nav-list">
                  <li className="mobile-nav-item">
                    <a href="#intro" onClick={(e) => { e.preventDefault(); scrollToSection('intro'); setShowMobileMenu(false); }} className="mobile-nav-link">Intro</a>
                  </li>
                  <li className="mobile-nav-item">
                    <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); setShowMobileMenu(false); }} className="mobile-nav-link">About Us</a>
                  </li>
                  <li className="mobile-nav-item">
                    <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); setShowMobileMenu(false); }} className="mobile-nav-link">Features</a>
                  </li>
                  <li className="mobile-nav-item">
                    <a href="#users" onClick={(e) => { e.preventDefault(); scrollToSection('users'); setShowMobileMenu(false); }} className="mobile-nav-link">Users</a>
                  </li>
                  <li className="mobile-nav-item">
                    <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); setShowMobileMenu(false); }} className="mobile-nav-link">Contact Us</a>
                  </li>
                </ul>
                <div className="mobile-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={() => { setShowMobileMenu(false); window.location.href = '/contact'; }}
                  >
                    Talk To Expert
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setShowMobileMenu(false); window.location.href = '/signup'; }}
                  >
                    Login/Register
                  </button>
                </div>
              </nav>
            </div>
          </>
        )}
      </header>

      <main>
        {/* Intro Section */}
        <section id="intro" className="section intro-section">
          <div className="section-container">
            <div className="intro-content">
              <div className="intro-text">
                <h1>
                  Your <span className="gradient-text">AI Powered</span> Platform for Career & Educational Success
                </h1>
                <p>
                  Empowering schools & colleges with personalized, data-driven guidance—from career discovery to college admission—backed by 14+ years of expertise.
                </p>
              </div>
              <div className="intro-image">
                <img
                  src="/images/OBJECTS.png"
                  alt="HelloIvy AI-powered educational platform dashboard showing career discovery and college selection tools"
                  className="responsive-img"
                />
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="section about-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">ABOUT US</span>
              <h2 className="section-title" style={{
                background: 'linear-gradient(90deg, #6B68FE, #312ED0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Where Human Expertise <span className="gradient-text">Meets AI</span>
              </h2>
              <p className="about-description">
                An AI-powered platform built to elevate counselors, empower students, and transform the career discovery journey. Designed as a smart co-pilot, it delivers personalized, data-driven support to help students uncover passions, build standout profiles, and gain admission to top global universities.
              </p>
            </div>

            {/* University Logos */}
            <div className="university-logos">
              <img
                src="/images/college logos.png"
                alt="Top universities and colleges including Oxford, Stanford, UCLA, MIT, Georgia Tech, University of Michigan, LSE, USC, Cambridge, and HEC Paris"
                className="responsive-img"
              />
            </div>

            {/* Founder Section */}
            <div className="founder-section">
              <div className="founder-image-container">
                <div className="founder-image-wrapper">
                  <img
                    src="/images/VK.png"
                    alt="Vibha Kagzi, Founder and CEO of HelloIvy, education technology expert with 14+ years of experience"
                    className="founder-image responsive-img"
                  />
                </div>
                <div className="founder-quote">
                  <p className="founder-quote-text">
                    &quot;We&apos;re not here to sell dreams. We&apos;re here to architect reality.&quot;
                  </p>
                  <p className="founder-quote-author">
                    — Vibha Kagzi, Founder & CEO
                  </p>
                </div>
              </div>
              <div className="founder-content">
                <h3>Who we are:</h3>
                <p>
                  A company born from the expertise of Reachivy.com — trusted advisors to the dreamers, the doers, and the disruptors of tomorrow.
                </p>
                <p>
                  For over 14+ yrs, we&apos;ve guided thousands of students to top universities and careers around the world. Trusted by thousands of students to navigate their academic and professional journeys. Now, we are harnessing the power of AI to revolutionize how career and college guidance is delivered in institutions worldwide.
                </p>
                <p>
                  We&apos;re taking it a step further.
                </p>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="statistics-section">
              <img src="/images/pointers.png" alt="HelloIvy key statistics: 1M+ real student data points, 14+ years of expertise, 2 published books on admissions, top programs in STEM and Business, 95% satisfaction score, 10+ intelligent models, 5,000 students admitted to top universities, 2x faster application process, 0% commission model" className="responsive-img" />
            </div>

            {/* Why Ivy Section */}
            <div className="why-ivy-section">
              <span className="section-tag">WHY IVY</span>
              <h2 className="section-title">
                Based on Research to <span style={{ color: '#E842A5' }}>Solve</span> <span style={{ color: '#A16BFE' }}>Real</span> <span style={{ color: '#4C4AF6' }}>Problems</span>
              </h2>

              <div className="problems-grid">
                <div className="problem-item">
                  <h3 className="problem-title">
                    High Student: Counsellor Ratio
                  </h3>
                  <p className="problem-description">
                    &quot;Our school counselor is a subject teacher as well, so she&apos;s booked with other commitments... She hasn&apos;t really given us individual support.&quot;
                  </p>
                  <p className="problem-author">
                    - Hemaprabha Ashwin, Parent, IB Board, Dubai
                  </p>
                </div>

                <div className="problem-item">
                  <h3 className="problem-title">
                    Outdated Tools
                  </h3>
                  <p className="problem-description">
                    &quot;Most tools we&apos;ve seen are static - they don&apos;t talk, they don&apos;t adapt, and they certainly don&apos;t counsel.&quot;
                  </p>
                  <p className="problem-author">
                    - Kunal Dalal, Promoter, JBCN School, Mumbai
                  </p>
                </div>

                <div className="problem-item">
                  <h3 className="problem-title">
                    Overwhelming Process
                  </h3>
                  <p className="problem-description">
                    &quot;It&apos;s like standing at the base of a mountain - no map, no guide, just noise. You&apos;re stuck, overwhelmed, and afraid to take the first step.&quot;
                  </p>
                  <p className="problem-author">
                    - Alman Merchant, Parent, IGCSE Board, American School of Bombay, Mumbai
                  </p>
                </div>

                <div className="problem-item">
                  <h3 className="problem-title">
                    Lack of Affordable, Personalized Guidance
                  </h3>
                  <p className="problem-description">
                    &quot;We don&apos;t have any counselor for international admissions... That kind of guidance is non-existent in cities like ours.&quot;
                  </p>
                  <p className="problem-author">
                    - Amitava Ghosh, Principal, Bharatiya Vidya Bhavan, Raipur
                  </p>
                </div>

                <div className="problem-item">
                  <h3 className="problem-title">
                    Great Guidance Exists but at a Cost
                  </h3>
                  <p className="problem-description">
                    &quot;Experienced counselors who know how to guide you aren&apos;t accessible unless you pay lakhs. The rest of us get vague advice and outdated info - it&apos;s just not fair.&quot;
                  </p>
                  <p className="problem-author">
                    - Sushri, Student, XIM Bhubaneswar
                  </p>
                </div>

                <div className="problem-item">
                  <h3 className="problem-title">
                    No Contextual Advice
                  </h3>
                  <p className="problem-description">
                    &quot;Where is the space for a counsellor to do upgradation and understand the dynamics of the career market?&quot;
                  </p>
                  <p className="problem-author">
                    - Manju Surendran, Principal, Faravanahi International Academy, Nashik
                  </p>
                </div>

                <div className="problem-item">
                  <h3 className="problem-title">
                    Lack of Support
                  </h3>
                  <p className="problem-description">
                    &quot;In school, we got zero real help. My parents and I had to figure out everything on our own.&quot;
                  </p>
                  <p className="problem-author">
                    - Dia Soman, Student, DPS-Modern Indian School, Qatar
                  </p>
                </div>

                <div className="problem-item">
                  <h3 className="problem-title">
                    Barriers to Emotional Openness
                  </h3>
                  <p className="problem-description">
                    &quot;With a counselor, there&apos;s intimidation - it takes a lot of time to open up.&quot;
                  </p>
                  <p className="problem-author">
                    - Archita Saraf Rajpuria, Trustee, RSET
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section features-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">FEATURES</span>
              <h2 className="section-title">
                <span style={{ color: '#E842A5' }}>Smart</span> <span style={{ color: '#A16BFE' }}>Features</span> That Transform Education Planning
              </h2>
            </div>

            <div className="features-content">
              <div className="features-list">
                {[
                  { icon: '💼', text: 'Career Discovery' },
                  { icon: '👤', text: 'Profile Builder' },
                  { icon: '🎓', text: 'Degree Selector' },
                  { icon: '🏫', text: 'College Selection' },
                  { icon: '🧠', text: 'Essay Brainstormer' },
                  { icon: '📝', text: 'Essay Evaluator' },
                  { icon: '📄', text: 'Resume Builder' },
                  { icon: '🎤', text: 'Interview Preparation' },
                  { icon: '💰', text: 'Scholarship & Financial Aid Finder' }
                ].map((feature, index) => (
                  <div key={index} className="feature-item">
                    <span className="feature-icon">
                      {feature.icon}
                    </span>
                    {feature.text}
                  </div>
                ))}
              </div>

              <div className="video-container">
                <iframe
                  src="https://www.youtube.com/embed/ax3L6hP9GU0?controls=1&rel=0"
                  title="HelloIvy Platform Demo"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-iframe"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Users Section */}
        <section id="users" className="section users-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-tag">USERS</span>
              <h2 className="section-title" style={{
                background: 'linear-gradient(90deg, #6B68FE, #312ED0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Built for Every Role in the <span className="gradient-text">Education Journey</span>
              </h2>
            </div>

            <div className="users-grid">
              {[
                {
                  image: '/images/Frame.png',
                  title: 'Students',
                  features: ['24x7 Personalised Guidance', 'Ivy-League level Expertise', 'Conversational Experience']
                },
                {
                  image: '/images/Frame (1).png',
                  title: 'Educational Institutes',
                  features: ['Improved Student Outcomes', 'Scalable Support System', 'White-Labeled Solution']
                },
                {
                  image: '/images/Frame (2).png',
                  title: 'Counsellors',
                  features: ['AI-Powered Co-Pilot', '80% Less Admin Time', 'Real-Time Dashboards']
                }
              ].map((user, index) => (
                <div key={index} className="user-card">
                  <img
                    src={user.image}
                    alt={user.title}
                    className="user-image responsive-img"
                  />
                  <h3 className="user-title">{user.title}</h3>
                  <ul className="user-features">
                    {user.features.map((feature, idx) => (
                      <li key={idx} className="user-feature">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="section contact-section">
          <div className="section-container">
            <div className="contact-card">
              <h2 className="contact-title">Contact Us</h2>
              <p className="contact-text">
                Are you a student, parent, or educator inspired by our mission?
              </p>
              <p className="contact-text">
                If you&apos;re exploring job opportunities and want to be part of our team, get in touch at{' '}
                <a href="mailto:partners@reachivy.com" className="contact-link">
                  partners@reachivy.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div>
            <p className="footer-text">
              © 2025. All rights reserved |{' '}
              <a href="/privacy" className="footer-link">Privacy policy</a> |{' '}
              <a href="/terms" className="footer-link">Terms & Condition</a>
            </p>
          </div>
          <div className="footer-social">
            <div className="social-icons">
              <a href="https://www.facebook.com/reachivy" className="social-link" target="_blank" rel="noopener noreferrer">
                <img src="/images/facebook.png" alt="Facebook" className="social-icon" />
              </a>
              <a href="http://instagram.com/reach_ivy/" className="social-link" target="_blank" rel="noopener noreferrer">
                <img src="/images/instagram.png" alt="Instagram" className="social-icon" />
              </a>
              <a href="https://www.linkedin.com/company/reachivy/" className="social-link" target="_blank" rel="noopener noreferrer">
                <img src="/images/linkedin.png" alt="LinkedIn" className="social-icon" />
              </a>
              <a href="https://www.youtube.com/user/reachivy" className="social-link" target="_blank" rel="noopener noreferrer">
                <img src="/images/youtube.png" alt="Youtube" className="social-icon" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
