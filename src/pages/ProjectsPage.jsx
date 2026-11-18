import React from 'react';
import { profile, projects } from '../config/site';
import ProjectCard from '../components/ProjectCard';
import Reveal from '../components/Reveal';

export default function ProjectsPage() {
  return (
    <div className="page-shell">
      <section className="section-wrap page-intro" aria-labelledby="projects-title">
        <Reveal className="section-heading">
          <span className="section-index">SELECTED WORK</span>
          <h1 id="projects-title">Projects I've <span className="gradient-text">built.</span></h1>
          <p>Applications I've worked on and learned from. Source links open the existing GitHub repositories.</p>
        </Reveal>
        <div className="project-list">
          {projects.map((project) => <ProjectCard key={project.name} project={project} />)}
        </div>
      </section>
      <section className="section-wrap page-section project-note">
        <Reveal className="contact-panel">
          <span className="section-index">MORE ON GITHUB</span>
          <h2>Follow the <span className="gradient-text">work.</span></h2>
          <p>Explore my repositories and current project work on GitHub.</p>
          <a className="button button-primary" href={profile.githubUrl} target="_blank" rel="noreferrer">
            Visit GitHub <span aria-hidden="true">↗</span>
          </a>
        </Reveal>
      </section>
    </div>
  );
}
