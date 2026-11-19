import { photos } from "../data/photography";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import {
  isCloudGalleryEnabled,
  listGalleryImages,
  releaseGalleryImageUrls,
  submitVisitorPhoto,
} from '../lib/galleryStore';

const categories = ['Photography', 'Creative work', 'Travel', 'Other'];
const maximumImageSize = 12 * 1024 * 1024;
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

function GalleryImage({ image, onOpen }) {
  return (
    <article className="gallery-card">
      <button
        className="gallery-image-button"
        type="button"
        aria-label={`Open ${image.title} in full-screen view`}
        onClick={() => onOpen(image)}
      >
        <img src={image.imageUrl} alt={image.title} loading="lazy" />
        <span className="gallery-image-open">View photo</span>
      </button>
      <div className="gallery-card-copy">
        <span className="gallery-category">{image.category}</span>
        <h2>{image.title}</h2>
        {image.description && <p>{image.description}</p>}
      </div>
    </article>
  );
}

export default function HobbiesPage() {
  const [images, setImages] = useState([]);

  const personalImages = photos.map((photo, index) => ({
  id: `personal-${index}`,
  imageUrl: photo,
  title: `Photograph ${index + 1}`,
  category: "Photography",
  description: "Captured by Ashish",
}));


  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);
  const imagesRef = useRef([]);
  const requestId = useRef(0);
  const dialogRef = useRef(null);

  const refreshGallery = useCallback(async () => {
    const request = ++requestId.current;
    setIsLoading(true);
    setLoadError('');
    try {
      const nextImages = await listGalleryImages();
      if (request !== requestId.current) {
        releaseGalleryImageUrls(nextImages);
        return;
      }
      releaseGalleryImageUrls(imagesRef.current);
      imagesRef.current = nextImages;
      setImages(nextImages);
    } catch (error) {
      if (request === requestId.current) setLoadError(error.message);
    } finally {
      if (request === requestId.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshGallery();
    return () => {
      requestId.current += 1;
      releaseGalleryImageUrls(imagesRef.current);
      imagesRef.current = [];
    };
  }, [refreshGallery]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (lightboxImage && !dialog.open) dialog.showModal();
    if (!lightboxImage && dialog.open) dialog.close();
  }, [lightboxImage]);

  const allImages = [...personalImages, ...images];

const visibleImages = selectedCategory === 'All'
  ? allImages
  : allImages.filter((image) => image.category === selectedCategory);
  const availableCategories = [
    'All',
    ...new Set([...categories, ...images.map((image) => image.category)]),
  ];

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFormError('');
    if (nextFile && !allowedImageTypes.includes(nextFile.type)) {
      setFile(null);
      setFormError('Choose a JPG, PNG or WebP image.');
    } else if (nextFile && (nextFile.size === 0 || nextFile.size > maximumImageSize)) {
      setFile(null);
      setFormError('Choose an image no larger than 12 MiB.');
    } else {
      setFile(nextFile);
    }
    event.target.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setNotice('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (!file) {
      setFormError('Choose a photo to submit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVisitorPhoto(file, {
        name: formData.get('name'),
        email: formData.get('email'),
        title: formData.get('title'),
        message: formData.get('message'),
      });
      form.reset();
      setFile(null);
      setNotice('Thanks for sharing. Your photo is private while it is reviewed and will appear only if approved.');
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="section-wrap page-intro hobby-intro" aria-labelledby="hobbies-title">
        <Reveal className="section-heading">
          <span className="section-index">HOBBIES & CREATIVE WORK</span>
          <h1 id="hobbies-title">Photography, <span className="gradient-text">collected.</span></h1>
          <p>A personal gallery for photographs and creative work, gathered one frame at a time.</p>
        </Reveal>

        <div className="gallery-toolbar">
          <div className="gallery-mode">
            <Camera aria-hidden="true" size={19} />
            <div>
              <strong>{isCloudGalleryEnabled ? 'Approved photographs' : 'Gallery setup required'}</strong>
              <span>
                {isCloudGalleryEnabled
                  ? 'Only photos approved by Ashish appear in this gallery.'
                  : 'Secure online submissions are unavailable until Supabase is configured.'}
              </span>
            </div>
          </div>
          <Link className="text-link" to="/admin/gallery">
            Gallery owner sign-in <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {!isCloudGalleryEnabled && (
          <p className="gallery-local-note">
            Public uploads are intentionally disabled without the secured backend. See the README
            for Supabase setup; this prevents visitor photos from being published without review.
          </p>
        )}
      </section>

      <section className="section-wrap gallery-layout" aria-label="Approved photo gallery">
        <div className="gallery-heading">
          <div>
            <span className="section-index">THE GALLERY</span>
            <h2>Collected <span className="gradient-text">moments.</span></h2>
          </div>
          <span className="gallery-count">
            {allImages.length} {allImages.length === 1 ? 'photo' : 'photos'}
          </span>
        </div>

        <div className="gallery-filters" aria-label="Filter photos by category">
          {availableCategories.map((option) => (
            <button
              key={option}
              className={selectedCategory === option ? 'filter-chip active' : 'filter-chip'}
              type="button"
              aria-pressed={selectedCategory === option}
              onClick={() => setSelectedCategory(option)}
            >
              {option}
            </button>
          ))}
        </div>

        {loadError && <p className="form-message form-error" role="alert">{loadError}</p>}

        {isLoading ? (
          <div className="gallery-state" role="status">
            <span className="loading-spinner" /> Loading gallery…
          </div>
        ) : loadError ? (
          <div className="gallery-state gallery-empty">
            <Camera aria-hidden="true" size={28} />
            <h3>Gallery unavailable</h3>
            <p>The approved gallery could not be loaded. Your submissions and stored photos remain private.</p>
            <button className="button button-ghost" type="button" onClick={refreshGallery}>Try again</button>
          </div>
        ) : visibleImages.length ? (
          <div className="gallery-grid">
            {visibleImages.map((image) => (
              <GalleryImage key={image.id} image={image} onOpen={setLightboxImage} />
            ))}
          </div>
        ) : (
          <div className="gallery-state gallery-empty">
            <Camera aria-hidden="true" size={28} />
            <h3>{images.length ? 'No photos in this category yet.' : 'The gallery is waiting for its first frame.'}</h3>
            <p>
              {images.length
                ? 'Choose another category to see more photos.'
                : 'Approved photographs will appear here. Visitor submissions stay private until Ashish approves them.'}
            </p>
          </div>
        )}

        <section className="submission-panel" aria-labelledby="submission-title">
          <div className="submission-heading">
            <span className="section-index">VISITOR SUBMISSIONS</span>
            <h2 id="submission-title">Share a photo <span className="gradient-text">with me.</span></h2>
            <p>
              Send a photo and a little context. It goes to a private review queue and is never
              shown publicly unless I approve it.
            </p>
          </div>
          <form className="submission-form" onSubmit={handleSubmit}>
            <label>
              Your name
              <input name="name" type="text" autoComplete="name" maxLength={100} required />
            </label>
            <label>
              Email <span>(optional)</span>
              <input name="email" type="email" autoComplete="email" maxLength={254} />
            </label>
            <label>
              Photo title
              <input name="title" type="text" maxLength={100} required />
            </label>
            <label className="submission-message">
              Message <span>(optional)</span>
              <textarea name="message" rows="3" maxLength={1000} />
            </label>
            <label className="submission-file">
              <ImagePlus aria-hidden="true" size={18} />
              <span>{file ? file.name : 'Choose an image to submit'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={!isCloudGalleryEnabled || isSubmitting}
              />
              <small>JPG, PNG or WebP · up to 12 MiB</small>
            </label>
            {previewUrl && (
              <div className="submission-preview">
                <img src={previewUrl} alt="Preview of your photo submission" />
              </div>
            )}
            {formError && <p className="form-message form-error" role="alert">{formError}</p>}
            {notice && <p className="form-message form-success" role="status">{notice}</p>}
            <div className="submission-actions">
              <button
                className="button button-primary"
                type="submit"
                disabled={!isCloudGalleryEnabled || isSubmitting}
              >
                <Send aria-hidden="true" size={16} />
                {isSubmitting ? 'Sending for review…' : 'Submit for review'}
              </button>
              <small>Submissions are private until approved.</small>
            </div>
            {!isCloudGalleryEnabled && (
              <p className="form-message">
                Photo submissions are temporarily unavailable because the secure gallery backend
                has not been configured.
              </p>
            )}
          </form>
        </section>
      </section>

      <dialog
        ref={dialogRef}
        className="gallery-lightbox"
        aria-label={lightboxImage ? `Photo: ${lightboxImage.title}` : 'Photo viewer'}
        onClose={() => setLightboxImage(null)}
        onCancel={(event) => {
          event.preventDefault();
          setLightboxImage(null);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setLightboxImage(null);
        }}
      >
        {lightboxImage && (
          <>
            <button
              className="lightbox-close icon-button"
              type="button"
              aria-label="Close photo viewer"
              onClick={() => setLightboxImage(null)}
            >
              <X aria-hidden="true" size={22} />
            </button>
            <img src={lightboxImage.imageUrl} alt={lightboxImage.title} />
            <div className="lightbox-caption">
              <span className="gallery-category">{lightboxImage.category}</span>
              <h2>{lightboxImage.title}</h2>
              {lightboxImage.description && <p>{lightboxImage.description}</p>}
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
