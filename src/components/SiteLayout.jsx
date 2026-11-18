import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { navigation, profile } from '../config/site';
import SocialLinks from './SocialLinks';

export default function SiteLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }, [location.pathname]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <Link className="brand" to="/" aria-label={`${profile.name} home`}>
          <span className="brand-mark">A.</span>
          <span>ASHISH<span className="brand-dot">.</span></span>
        </Link>
        <nav
          id="primary-navigation"
          className={menuOpen ? 'nav nav-open' : 'nav'}
          aria-label="Main navigation"
        >
          <div className="nav-pages">
            {navigation.map(({ label, to }) => (
              <NavLink
                end={to === '/'}
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </div>
          <SocialLinks links={profile.socials} className="nav-socials" />
          <Link className="nav-cta" to="/contact" onClick={() => setMenuOpen(false)}>
            Let's talk <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </nav>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      <main id="main-content" className="route-main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="route-view"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="footer site-footer">
        <Link className="brand" to="/" aria-label={`${profile.name} home`}>
          <span className="brand-mark">A.</span>
          <span>ASHISH<span className="brand-dot">.</span></span>
        </Link>
        <span>Designed &amp; built with curiosity.</span>
        <SocialLinks links={profile.socials} className="footer-socials" />
        <span>© {new Date().getFullYear()} {profile.name}</span>
      </footer>
    </>
  );
}
