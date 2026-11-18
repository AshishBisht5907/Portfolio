import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, LogOut, RefreshCw, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import Reveal from '../components/Reveal';
import {
  approveSubmission,
  getGalleryAdminSession,
  isCloudGalleryEnabled,
  listAdminGalleryImages,
  listPendingSubmissions,
  rejectSubmission,
  removeGalleryImage,
  requestGallerySignIn,
  signOutGallery,
  subscribeToGalleryAuth,
  updateGalleryImage,
  uploadApprovedGalleryImage,
} from '../lib/galleryStore';

const categories = ['Photography', 'Creative work', 'Travel', 'Other'];

function dateLabel(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function AdminPhotoCard({ image, edit, onChange, onSave, onDelete, busy }) {
  return (
    <article className="admin-review-card">
      <img src={image.imageUrl} alt={image.title} loading="lazy" />
      <div className="admin-review-copy">
        <span className="admin-status">Published · {dateLabel(image.created_at)}</span>
        <form className="admin-edit-form" onSubmit={(event) => {
          event.preventDefault();
          onSave(image);
        }}>
          <label>
            Title
            <input
              value={edit.title}
              maxLength={100}
              required
              onChange={(event) => onChange(image.id, 'title', event.target.value)}
            />
          </label>
          <label>
            Category
            <select
              value={edit.category}
              onChange={(event) => onChange(image.id, 'category', event.target.value)}
            >
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="admin-edit-description">
            Description
            <textarea
              value={edit.description}
              maxLength={500}
              rows="2"
              onChange={(event) => onChange(image.id, 'description', event.target.value)}
            />
          </label>
          <div className="admin-review-actions admin-edit-description">
            <button className="button button-primary" type="submit" disabled={busy}>
              <Check aria-hidden="true" size={15} /> Save details
            </button>
            <button
              className="button button-ghost"
              type="button"
              disabled={busy}
              onClick={() => onDelete(image)}
            >
              <Trash2 aria-hidden="true" size={15} /> Delete photo
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}

function SubmissionCard({ submission, edit, onChange, onApprove, onReject, busy }) {
  return (
    <article className="admin-review-card">
      <img src={submission.imageUrl} alt={`Submitted photo: ${submission.title}`} loading="lazy" />
      <div className="admin-review-copy">
        <span className="admin-status pending">Pending review · {dateLabel(submission.created_at)}</span>
        <h3>{submission.title}</h3>
        <p>Shared by {submission.name}{submission.email ? ` · ${submission.email}` : ''}</p>
        {submission.message && <p>{submission.message}</p>}
        <form className="admin-edit-form" onSubmit={(event) => {
          event.preventDefault();
          onApprove(submission);
        }}>
          <label>
            Published title
            <input
              value={edit.title}
              maxLength={100}
              required
              onChange={(event) => onChange(submission.id, 'title', event.target.value)}
            />
          </label>
          <label>
            Category
            <select
              value={edit.category}
              onChange={(event) => onChange(submission.id, 'category', event.target.value)}
            >
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="admin-edit-description">
            Public description
            <textarea
              value={edit.description}
              maxLength={500}
              rows="2"
              onChange={(event) => onChange(submission.id, 'description', event.target.value)}
            />
          </label>
          <div className="admin-review-actions admin-edit-description">
            <button className="button button-primary" type="submit" disabled={busy}>
              <Check aria-hidden="true" size={15} /> Approve &amp; publish
            </button>
            <button
              className="button button-ghost"
              type="button"
              disabled={busy}
              onClick={() => onReject(submission)}
            >
              <X aria-hidden="true" size={15} /> Reject
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}

export default function AdminGalleryPage() {
  const [session, setSession] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [loginNotice, setLoginNotice] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [photoEdits, setPhotoEdits] = useState({});
  const [submissionEdits, setSubmissionEdits] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refreshId = useRef(0);

  const refreshDashboard = useCallback(async () => {
    const request = ++refreshId.current;
    setIsLoading(true);
    setError('');
    try {
      const [nextPhotos, nextSubmissions] = await Promise.all([
        listAdminGalleryImages(),
        listPendingSubmissions(),
      ]);
      if (request !== refreshId.current) return;
      setPhotos(nextPhotos);
      setSubmissions(nextSubmissions);
      setPhotoEdits(Object.fromEntries(nextPhotos.map((photo) => [
        photo.id,
        { title: photo.title, description: photo.description, category: photo.category },
      ])));
      setSubmissionEdits(Object.fromEntries(nextSubmissions.map((submission) => [
        submission.id,
        { title: submission.title, description: '', category: 'Photography' },
      ])));
    } catch (loadError) {
      if (request === refreshId.current) setError(loadError.message);
    } finally {
      if (request === refreshId.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    if (!isCloudGalleryEnabled) {
      setIsChecking(false);
      return undefined;
    }
    (async () => {
      try {
        const stopListening = await subscribeToGalleryAuth((nextSession, event) => {
          if (!active) return;
          setSession(nextSession);
          setLoginNotice(
            event === 'SIGNED_IN' && !nextSession
              ? 'This account does not have gallery administrator access.'
              : '',
          );
        });
        if (!active) {
          stopListening();
          return;
        }
        unsubscribe = stopListening;

        const currentSession = await getGalleryAdminSession();
        if (active) {
          setSession(currentSession);
          setIsChecking(false);
        }
      } catch (sessionError) {
        if (active) {
          setError(sessionError.message);
          setIsChecking(false);
        }
      }
    })();
    return () => {
      active = false;
      unsubscribe();
      refreshId.current += 1;
    };
  }, []);

  useEffect(() => {
    if (session) refreshDashboard();
  }, [session, refreshDashboard]);

  useEffect(() => {
    if (!uploadFile) {
      setUploadPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(uploadFile);
    setUploadPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadFile]);

  const setEditValue = (setter) => (id, field, value) => {
    setter((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoginNotice('');
    setIsSendingLink(true);
    try {
      await requestGallerySignIn(email.trim());
      setLoginNotice('If this email belongs to the invited gallery administrator, a sign-in link is on its way.');
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    try {
      await signOutGallery();
      setSession(null);
      setPhotos([]);
      setSubmissions([]);
    } catch (signOutError) {
      setError(signOutError.message);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const form = event.currentTarget;
    if (!uploadFile) {
      setError('Choose a photo to publish.');
      return;
    }
    const data = new FormData(form);
    setUploading(true);
    try {
      await uploadApprovedGalleryImage(uploadFile, {
        title: data.get('title'),
        description: data.get('description'),
        category: data.get('category'),
      });
      form.reset();
      setUploadFile(null);
      setNotice('Photo published to the public gallery.');
      await refreshDashboard();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoSave = async (photo) => {
    setActionId(photo.id);
    setError('');
    setNotice('');
    try {
      await updateGalleryImage(photo.id, photoEdits[photo.id]);
      setNotice('Photo details updated.');
      await refreshDashboard();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setActionId('');
    }
  };

  const handlePhotoDelete = async (photo) => {
    if (!window.confirm(`Delete “${photo.title}” from the public gallery?`)) return;
    setActionId(photo.id);
    setError('');
    setNotice('');
    try {
      await removeGalleryImage(photo);
      setNotice('Photo deleted from the public gallery.');
      await refreshDashboard();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setActionId('');
    }
  };

  const handleApprove = async (submission) => {
    setActionId(submission.id);
    setError('');
    setNotice('');
    try {
      await approveSubmission(submission, submissionEdits[submission.id]);
      setNotice('Submission approved and published.');
      await refreshDashboard();
    } catch (approveError) {
      setError(approveError.message);
    } finally {
      setActionId('');
    }
  };

  const handleReject = async (submission) => {
    if (!window.confirm(`Reject the photo submission “${submission.title}”?`)) return;
    setActionId(submission.id);
    setError('');
    setNotice('');
    try {
      await rejectSubmission(submission.id);
      setNotice('Submission rejected. Its photo remains private.');
      await refreshDashboard();
    } catch (rejectError) {
      setError(rejectError.message);
    } finally {
      setActionId('');
    }
  };

  return (
    <div className="page-shell admin-page">
      <section className="section-wrap page-intro" aria-labelledby="admin-title">
        <Reveal className="section-heading">
          <span className="section-index">PRIVATE GALLERY MANAGEMENT</span>
          <h1 id="admin-title">Gallery <span className="gradient-text">studio.</span></h1>
          <p>Only the invited gallery administrator can publish photos or review visitor submissions.</p>
        </Reveal>

        {!isCloudGalleryEnabled ? (
          <div className="admin-login">
            <ShieldCheck aria-hidden="true" size={26} />
            <h2>Secure gallery unavailable</h2>
            <p>Configure Supabase Auth and the private Storage buckets to enable owner access.</p>
          </div>
        ) : isChecking ? (
          <div className="gallery-state" role="status"><span className="loading-spinner" /> Checking administrator access…</div>
        ) : !session ? (
          <Reveal className="admin-login">
            <ShieldCheck aria-hidden="true" size={26} />
            <h2>Owner sign-in</h2>
            <p>Use the invited administrator email. A link is sent only to existing accounts.</p>
            <form className="admin-login-form" onSubmit={handleLogin}>
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <button className="button button-primary" type="submit" disabled={isSendingLink}>
                {isSendingLink ? 'Sending link…' : 'Send sign-in link'}
              </button>
            </form>
            {loginNotice && <p className="form-message form-success" role="status">{loginNotice}</p>}
            {error && <p className="form-message form-error" role="alert">{error}</p>}
          </Reveal>
        ) : (
          <>
            <div className="admin-toolbar">
              <p>Signed in as <strong>{session.user.email}</strong></p>
              <div className="submission-actions">
                <button className="button button-ghost" type="button" onClick={refreshDashboard} disabled={isLoading}>
                  <RefreshCw aria-hidden="true" size={15} /> Refresh
                </button>
                <button className="button button-ghost" type="button" onClick={handleSignOut}>
                  <LogOut aria-hidden="true" size={15} /> Sign out
                </button>
              </div>
            </div>
            {error && <p className="form-message form-error" role="alert">{error}</p>}
            {notice && <p className="form-message form-success" role="status">{notice}</p>}

            <section className="admin-review-section" aria-labelledby="admin-upload-title">
              <h2 id="admin-upload-title">Publish a photo</h2>
              <form className="submission-form" onSubmit={handleUpload}>
                <label>
                  Title
                  <input name="title" type="text" maxLength={100} required />
                </label>
                <label>
                  Category
                  <select name="category" defaultValue={categories[0]}>
                    {categories.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <label className="submission-message">
                  Description
                  <textarea name="description" rows="3" maxLength={500} />
                </label>
                <label className="submission-file">
                  <Upload aria-hidden="true" size={18} />
                  <span>{uploadFile?.name || 'Choose a photo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      setUploadFile(event.target.files?.[0] || null);
                      event.target.value = '';
                    }}
                    disabled={uploading}
                  />
                  <small>JPG, PNG or WebP · up to 12 MiB</small>
                </label>
                {uploadPreview && (
                  <div className="submission-preview">
                    <img src={uploadPreview} alt="Preview of the photo to publish" />
                  </div>
                )}
                <div className="submission-actions">
                  <button className="button button-primary" type="submit" disabled={uploading}>
                    <Upload aria-hidden="true" size={15} />
                    {uploading ? 'Publishing…' : 'Publish to gallery'}
                  </button>
                </div>
              </form>
            </section>

            <section className="admin-review-section" aria-labelledby="pending-title">
              <h2 id="pending-title">Pending submissions <span className="gallery-count">({submissions.length})</span></h2>
              {isLoading ? (
                <div className="gallery-state" role="status"><span className="loading-spinner" /> Loading private queue…</div>
              ) : submissions.length ? (
                <div className="admin-review-list">
                  {submissions.map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      edit={submissionEdits[submission.id] || { title: submission.title, description: '', category: categories[0] }}
                      onChange={setEditValue(setSubmissionEdits)}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      busy={actionId === submission.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="gallery-state">
                  <ShieldCheck aria-hidden="true" size={25} />
                  <h3>No photos awaiting review.</h3>
                  <p>Visitor submissions appear here privately until you approve or reject them.</p>
                </div>
              )}
            </section>

            <section className="admin-review-section" aria-labelledby="published-title">
              <h2 id="published-title">Published photos <span className="gallery-count">({photos.length})</span></h2>
              {isLoading ? (
                <div className="gallery-state" role="status"><span className="loading-spinner" /> Loading published photos…</div>
              ) : photos.length ? (
                <div className="admin-review-list">
                  {photos.map((photo) => (
                    <AdminPhotoCard
                      key={photo.id}
                      image={photo}
                      edit={photoEdits[photo.id] || { title: photo.title, description: photo.description, category: photo.category }}
                      onChange={setEditValue(setPhotoEdits)}
                      onSave={handlePhotoSave}
                      onDelete={handlePhotoDelete}
                      busy={actionId === photo.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="gallery-state">
                  <ShieldCheck aria-hidden="true" size={25} />
                  <h3>No published photos yet.</h3>
                  <p>Use the form above to add a photo or approve a visitor submission.</p>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </div>
  );
}
