import React from 'react';
import { Camera, Code2, Layers3 } from 'lucide-react';
import { profile, skills } from '../config/site';
import Reveal from '../components/Reveal';
import SkillGrid from '../components/SkillGrid';

const interests = [
  { label: 'Web development', icon: Code2 },
  { label: 'Photography', icon: Camera },
  { label: 'Creative work', icon: Layers3 },
];

export default function AboutPage() {
  return (
    <div className="page-shell">
      <section className="section-wrap page-intro" aria-labelledby="about-title">
        <Reveal className="section-heading">
          <span className="section-index">ABOUT</span>
          <h1 id="about-title">Curious by nature.<br /><span className="gradient-text">Builder by choice.</span></h1>
          <p>{profile.role} · {profile.education}</p>
        </Reveal>
        <div className="about-grid">
          <Reveal className="about-lead">
            <span className="big-quote" aria-hidden="true">“</span>
            <h2>Learning by making<br /><span className="muted">useful things.</span></h2>
          </Reveal>
          <Reveal className="about-copy">
            <p>
              I'm a Computer Science Engineering student interested in full-stack web development
              and software engineering. I enjoy turning ideas into practical applications and
              learning how products work end to end.
            </p>
            <p>
              My current toolkit includes Python, Django, JavaScript, React, Next.js, TypeScript
              and PostgreSQL. My projects include LifeLink, a healthcare coordination system,
              and Urban Crate, an e-commerce web application.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-wrap page-section" aria-labelledby="education-title">
        <Reveal className="section-heading">
          <span className="section-index">EDUCATION & JOURNEY</span>
          <h2 id="education-title">Learning in <span className="gradient-text">progress.</span></h2>
        </Reveal>
        <div className="timeline">
          <Reveal as="article" className="timeline-item">
            <span className="timeline-dot" aria-hidden="true" />
            <div>
              <small>EDUCATION</small>
              <h3>Diploma in Computer Science Engineering</h3>
              <p>Building a foundation in programming, computer science and software development.</p>
              <span className="timeline-meta">Srinagar Garhwal · Uttarakhand</span>
            </div>
          </Reveal>
          <Reveal as="article" className="timeline-item">
            <span className="timeline-dot" aria-hidden="true" />
            <div>
              <small>DEVELOPMENT JOURNEY</small>
              <h3>Full Stack Web Development</h3>
              <p>Practicing frontend development, backend APIs, databases and end-to-end application workflows.</p>
              <span className="timeline-meta">Continuous learning</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-wrap page-section" aria-labelledby="about-skills-title">
        <Reveal className="section-heading">
          <span className="section-index">TECHNICAL SKILLS</span>
          <h2 id="about-skills-title">My <span className="gradient-text">toolkit.</span></h2>
          <p>Technologies used across learning and project work.</p>
        </Reveal>
        <SkillGrid skills={skills} />
      </section>

      <section className="section-wrap page-section interests-section" aria-labelledby="interests-title">
        <Reveal className="section-heading">
          <span className="section-index">INTERESTS</span>
          <h2 id="interests-title">Beyond the <span className="gradient-text">editor.</span></h2>
        </Reveal>
        <div className="interest-list">
          {interests.map(({ label, icon: Icon }) => (
            <Reveal as="div" className="interest-card" key={label}>
              <Icon aria-hidden="true" size={20} />
              <span>{label}</span>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
