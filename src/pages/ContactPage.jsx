import React, { useState } from 'react';
import { ArrowUpRight, Mail, Send } from 'lucide-react';
import { profile } from '../config/site';
import Reveal from '../components/Reveal';
import SocialLinks from '../components/SocialLinks';

export default function ContactPage() {
  const [notice, setNotice] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name').trim();
    const senderEmail = formData.get('email').trim();
    const message = formData.get('message').trim();
    const subject = encodeURIComponent(`Portfolio message from ${name}`);
    const body = encodeURIComponent(`From: ${name} (${senderEmail})\n\n${message}`);

    setNotice('Your email app should open with the message ready to send. If it does not, use the email link below.');
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="page-shell">
      <section className="section-wrap page-intro contact-page-intro" aria-labelledby="contact-title">
        <Reveal className="section-heading">
          <span className="section-index">CONTACT</span>
          <h1 id="contact-title">Let's start a <span className="gradient-text">conversation.</span></h1>
          <p>Have an idea or want to talk about software development? Send me a message.</p>
        </Reveal>

        <div className="contact-layout">
          <Reveal className="contact-copy">
            <span className="contact-icon"><Mail aria-hidden="true" size={22} /></span>
            <h2>Get in touch</h2>
            <p>Use the form to open a message in your email app, or find me on these platforms.</p>
            <a className="contact-email" href={`mailto:${profile.email}`}>
              {profile.email} <ArrowUpRight aria-hidden="true" size={16} />
            </a>
            <h3>Find me online</h3>
            <SocialLinks links={profile.socials} className="contact-socials" />
          </Reveal>

          <Reveal as="form" className="contact-form" onSubmit={handleSubmit}>
            <label>
              Your name
              <input name="name" type="text" autoComplete="name" maxLength={100} required />
            </label>
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" maxLength={254} required />
            </label>
            <label>
              Message
              <textarea name="message" rows="6" maxLength={3000} required />
            </label>
            <button className="button button-primary" type="submit">
              <Send aria-hidden="true" size={16} />
              Open email app
              <ArrowUpRight aria-hidden="true" size={15} />
            </button>
            <p className="contact-form-note">
              This form uses your email app. Your message is not sent to or stored by this website.
            </p>
            {notice && <p className="form-message form-success" role="status">{notice}</p>}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
