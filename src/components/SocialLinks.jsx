import React from 'react';

export default function SocialLinks({ links, className = '' }) {
  return (
    <div className={`social-links ${className}`.trim()} role="group" aria-label="Social links">
      {links.map(({ name, href, icon: Icon }) => (
        <a
          key={name}
          href={href}
          aria-label={name}
          title={name}
          target={href.startsWith('mailto:') ? undefined : '_blank'}
          rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
        >
          <Icon aria-hidden="true" size={18} />
          <span className="social-link-label">{name}</span>
        </a>
      ))}
    </div>
  );
}
