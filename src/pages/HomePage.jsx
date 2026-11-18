import React, { useRef } from 'react';
import { ArrowDown, ArrowUpRight, Github, Mail, MapPin } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { profile, projects, skills } from '../config/site';
import ProjectCard from '../components/ProjectCard';
import Reveal from '../components/Reveal';
import SkillGrid from '../components/SkillGrid';

function HeroArtwork() {
  const artworkRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: artworkRef,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [16, -16]);

  return (
    <motion.div ref={artworkRef} className="hero-art" style={{ y: reduceMotion ? 0 : y }} aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="art-glow" />
      <div className="code-card">
        <div className="code-top">
          <span />
          <span />
          <span />
          <small>developer.js</small>
        </div>
        <div className="code-content">
          <p><i>01</i> <b>const</b> <em>developer</em> = {'{'}</p>
          <p><i>02</i> &nbsp;name: <strong>'Ashish'</strong>,</p>
          <p><i>03</i> &nbsp;focus: <strong>'Full Stack'</strong>,</p>
          <p><i>04</i> &nbsp;build: <strong>'Ideas → Products'</strong></p>
          <p><i>05</i> {'};'}</p>
          <p className="code-comment"><i>06</i> // Always learning...</p>
        </div>
        <div className="code-bottom"><span className="live-pulse" /> BUILDING SOMETHING USEFUL</div>
      </div>
      <div className="float-chip chip-react"><span>⚛</span> React</div>
      <div className="float-chip chip-python"><span>⌘</span> Python</div>
      <div className="float-chip chip-db">PostgreSQL</div>
      <div className="art-caption">DESIGN. DEVELOP. ITERATE.</div>
    </motion.div>
  );
}

export default function HomePage() {
  const reduceMotion = useReducedMotion();
  return (
    <>
      <section className="hero section-wrap" aria-labelledby="home-title">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" />
              FULL STACK DEVELOPER · CSE STUDENT
            </div>
            <p className="hero-kicker">HELLO, I'M</p>
            <motion.h1
              id="home-title"
              initial={reduceMotion ? false : 'hidden'}
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.13, delayChildren: 0.08 } },
              }}
            >
              <motion.span
                className="hero-title-line"
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                Ashish
              </motion.span>
              <motion.span
                className="hero-title-line"
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                Bisht.
              </motion.span>
            </motion.h1>
            <p className="role-line">
              <span className="role-prefix">I'M A</span>{' '}
              <span className="typed">{profile.role}</span>
            </p>
            <p className="hero-desc">
              I build thoughtful digital experiences, from clean interfaces to reliable backend systems.
              Currently exploring the craft of full-stack development.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/projects">
                Explore my work <ArrowUpRight aria-hidden="true" size={17} />
              </Link>
              <Link className="button button-ghost" to="/contact">
                Get in touch <Mail aria-hidden="true" size={16} />
              </Link>
            </div>
            <div className="social-row">
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub">
                <Github aria-hidden="true" size={19} />
              </a>
              <a href={`mailto:${profile.email}`} aria-label="Email"><Mail aria-hidden="true" size={19} /></a>
              <span className="social-divider" />
              <span className="location"><MapPin aria-hidden="true" size={14} /> India</span>
            </div>
          </div>
          <HeroArtwork />
        </div>
        <a href="#home-skills" className="scroll-cue">
          <span>SCROLL TO EXPLORE</span><ArrowDown aria-hidden="true" size={16} />
        </a>
        <span className="hero-index">01 / 05</span>
      </section>

      <section className="section-wrap home-section" id="home-skills" aria-labelledby="skills-title">
        <Reveal className="section-heading">
          <span className="section-index">01 — TOOLKIT</span>
          <h2 id="skills-title">Tools of the <span className="gradient-text">trade.</span></h2>
          <p>Technologies I've used while learning and building projects.</p>
        </Reveal>
        <SkillGrid skills={skills.slice(0, 5)} />
        <Link className="text-link" to="/about">
          More about my toolkit <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
      </section>

      <section className="section-wrap home-section" aria-labelledby="featured-title">
        <Reveal className="section-heading">
          <span className="section-index">02 — SELECTED WORK</span>
          <h2 id="featured-title">Things I've <span className="gradient-text">built.</span></h2>
          <p>A selection of projects I've worked on and learned from.</p>
        </Reveal>
        <div className="project-list">
          {projects.map((project) => <ProjectCard key={project.name} project={project} />)}
        </div>
        <Link className="text-link" to="/projects">
          View all project details <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
      </section>
    </>
  );
}
