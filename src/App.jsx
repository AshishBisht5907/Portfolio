import React, { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import AboutPage from './pages/AboutPage';
import AdminGalleryPage from './pages/AdminGalleryPage';
import ContactPage from './pages/ContactPage';
import HobbiesPage from './pages/HobbiesPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import ProjectsPage from './pages/ProjectsPage';

const pageMetadata = {
  '/': {
    title: 'Ashish Bisht — Full Stack Developer',
    description:
      'Ashish Bisht is a Full Stack Developer and Computer Science Engineering student. Explore projects, skills, photography and creative work.',
  },
  '/about': {
    title: 'About — Ashish Bisht',
    description: 'Learn about Ashish Bisht, his education, technical skills, development journey and interests.',
  },
  '/projects': {
    title: 'Projects — Ashish Bisht',
    description: 'Explore LifeLink, a healthcare coordination system, and Urban Crate, an e-commerce web application.',
  },
  '/hobbies': {
    title: 'Photography & Hobbies — Ashish Bisht',
    description: 'A personal photography and creative-work gallery by Ashish Bisht.',
  },
  '/contact': {
    title: 'Contact — Ashish Bisht',
    description: 'Contact Ashish Bisht and find his social profiles.',
  },
  '/admin/gallery': {
    title: 'Gallery Studio — Ashish Bisht',
    description: 'Private owner dashboard for managing approved photography and visitor submissions.',
  },
};

function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = pageMetadata[pathname] || {
      title: 'Page not found — Ashish Bisht',
      description: 'The requested page could not be found.',
    };
    document.title = metadata.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = metadata.description;
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <SiteLayout>
      <PageMetadata />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/hobbies" element={<HobbiesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/gallery" element={<AdminGalleryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteLayout>
  );
}
