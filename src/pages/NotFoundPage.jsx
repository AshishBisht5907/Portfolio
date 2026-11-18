import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="section-wrap not-found" aria-labelledby="not-found-title">
      <span className="section-index">404 — NOT FOUND</span>
      <h1 id="not-found-title">This page took a <span className="gradient-text">wrong turn.</span></h1>
      <Link className="button button-primary" to="/">Back to home</Link>
    </section>
  );
}
