import React from 'react';
import { ArrowUpRight, ExternalLink, Github } from 'lucide-react';
import Reveal from './Reveal';

function ProjectPreview({ project }) {
  return (
    <div className="project-visual" aria-hidden="true">
      <div className="project-preview-meta">
        <span>{project.name === 'LifeLink' ? 'CARE COORDINATION' : 'ONLINE STORE'}</span>
        <span>ILLUSTRATIVE PREVIEW</span>
      </div>
      <div className={`project-window ${project.accent}-window`}>
        {project.name === 'LifeLink' ? (
          <div className="lifelink-preview">
            <div className="clinic-rail">
              <span className="clinic-mark">L</span>
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="clinic-board">
              <div className="clinic-topline">
                <span>Care overview</span><i>Today</i>
              </div>
              <div className="clinic-stats">
                <div><small>Patients</small><b>Overview</b></div>
                <div><small>Coordination</small><b>In progress</b></div>
              </div>
              <div className="clinic-patient">
                <span /><b /><i /><em />
              </div>
              <div className="clinic-patient">
                <span /><b /><i /><em />
              </div>
              <div className="clinic-patient short">
                <span /><b /><i /><em />
              </div>
            </div>
          </div>
        ) : (
          <div className="crate-preview">
            <div className="crate-topline">
              <span>URBAN CRATE</span><span>COLLECTION / 01</span>
            </div>
            <div className="crate-feature">
              <div className="crate-product-shape"><i /></div>
              <div className="crate-copy-lines"><b /><i /><i /><span /></div>
            </div>
            <div className="crate-product-row">
              <i /><i /><i />
            </div>
        </div>
        )}
      </div>
      <span className="project-number">{project.number}</span>
    </div>
  );
}

export default function ProjectCard({ project }) {
  return (
    <Reveal as="article" className={`project-card ${project.accent}`}>
      <ProjectPreview project={project} />
      <div className="project-info">
        <span className="project-type">{project.type}</span>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <div className="tag-list" aria-label={`${project.name} technologies`}>
          {project.stack.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
        <div className="project-links">
          <a href={project.github} target="_blank" rel="noreferrer">
            <Github aria-hidden="true" size={17} />
            Source code
            <ArrowUpRight aria-hidden="true" size={15} />
          </a>
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" size={16} />
              Live demo
            </a>
          )}
        </div>
      </div>
    </Reveal>
  );
}
