import React from 'react';
import Reveal from './Reveal';

export default function SkillGrid({ skills }) {
  return (
    <div className="skills-grid">
      {skills.map(({ name, group, icon: Icon }, index) => (
        <Reveal
          as="article"
          className="skill-card"
          style={{ '--delay': `${Math.min(index, 6) * 45}ms` }}
          key={name}
        >
          <Icon aria-hidden="true" size={20} />
          <span>{name}</span>
          <small>{group}</small>
        </Reveal>
      ))}
    </div>
  );
}
