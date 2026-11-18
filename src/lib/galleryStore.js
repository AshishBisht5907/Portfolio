const env = import.meta.env;
const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
const galleryBucket = env.VITE_SUPABASE_GALLERY_BUCKET?.trim() || 'portfolio-gallery';
const submissionsBucket = env.VITE_SUPABASE_SUBMISSIONS_BUCKET?.trim() || 'photo-submissions';
const maximumImageSize = 12 * 1024 * 1024;
const allowedImageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export const isCloudGalleryEnabled = Boolean(supabaseUrl && supabaseAnonKey);

let supabasePromise;

async function getSupabase() {
  if (!isCloudGalleryEnabled) return null;
  if (!supabasePromise) {
    supabasePromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      }),
    );
  }
  return supabasePromise;
}

function assertImage(file) {
  if (!(file instanceof File)) throw new Error('Choose an image file to continue.');
  if (!allowedImageTypes.has(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP image.');
  }
  if (file.size === 0 || file.size > maximumImageSize) {
    throw new Error('Choose an image no larger than 12 MiB.');
  }
}

function assertDetails(details) {
  const title = details.title?.trim();
  const description = details.description?.trim() || '';
  const category = details.category?.trim();
  if (!title || title.length > 100) throw new Error('Add a title of 1–100 characters.');
  if (description.length > 500) throw new Error('Keep the description under 500 characters.');
  if (!category || category.length > 40) throw new Error('Choose a valid photo category.');
  return { title, description, category };
}

function assertAdminSession(session) {
  if (!session?.user?.app_metadata || session.user.app_metadata.gallery_admin !== true) {
    throw new Error('This account is not authorized to manage the gallery.');
  }
  return session;
}

async function requireGalleryAdmin(supabase) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Could not check gallery access: ${error.message}`);
  return assertAdminSession(data.session);
}

async function signedImage(supabase, bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) throw new Error(`Could not create a private photo link: ${error.message}`);
  return data.signedUrl;
}

async function signRows(supabase, bucket, rows) {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      imageUrl: await signedImage(supabase, bucket, row.storage_path),
    })),
  );
}

async function uploadPhoto(supabase, bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Could not upload the photo: ${error.message}`);
}

async function removePhoto(supabase, bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Could not remove the stored photo: ${error.message}`);
}

async function cleanUpAfterFailure(supabase, bucket, path, error) {
  try {
    await removePhoto(supabase, bucket, path);
  } catch (cleanupError) {
    throw new Error(`${error.message} The uploaded file also needs cleanup: ${cleanupError.message}`);
  }
  throw error;
}

export async function listGalleryImages() {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('gallery_photos')
    .select('id, title, description, category, storage_path, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Could not load approved gallery photos: ${error.message}`);
  return signRows(supabase, galleryBucket, data);
}

export async function submitVisitorPhoto(file, details) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Photo submissions are unavailable until the gallery is configured.');
  assertImage(file);

  const name = details.name?.trim();
  const email = details.email?.trim() || null;
  const title = details.title?.trim();
  const message = details.message?.trim() || '';
  if (!name || name.length > 100) throw new Error('Add your name (up to 100 characters).');
  if (email && email.length > 254) throw new Error('Email must be 254 characters or fewer.');
  if (!title || title.length > 100) throw new Error('Add a title of 1–100 characters.');
  if (message.length > 1000) throw new Error('Keep your message under 1,000 characters.');

  const id = crypto.randomUUID();
  const path = `pending/${id}.${allowedImageTypes.get(file.type)}`;
  await uploadPhoto(supabase, submissionsBucket, path, file);

  const { error } = await supabase.from('photo_submissions').insert({
    name,
    email,
    title,
    message,
    storage_path: path,
    status: 'pending',
  });
  if (error) {
    await cleanUpAfterFailure(supabase, submissionsBucket, path,
      new Error(`Could not submit the photo for review: ${error.message}`));
  }
}

export async function getGalleryAdminSession() {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Could not check gallery access: ${error.message}`);
  const session = data.session;
  return session?.user?.app_metadata?.gallery_admin === true ? session : null;
}

export async function requestGallerySignIn(email) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Gallery administration is not configured.');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/admin/gallery`,
      shouldCreateUser: false,
    },
  });
  if (error) throw new Error(`Could not send the sign-in link: ${error.message}`);
}

export async function subscribeToGalleryAuth(callback) {
  const supabase = await getSupabase();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user?.app_metadata?.gallery_admin === true ? session : null, event);
  });
  return () => data.subscription.unsubscribe();
}

export async function signOutGallery() {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Gallery administration is not configured.');
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Could not sign out: ${error.message}`);
}

export async function listAdminGalleryImages() {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Gallery administration is not configured.');
  await requireGalleryAdmin(supabase);
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('id, title, description, category, storage_path, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Could not load managed photos: ${error.message}`);
  return signRows(supabase, galleryBucket, data);
}

export async function listPendingSubmissions() {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Gallery administration is not configured.');
  await requireGalleryAdmin(supabase);
  const { data, error } = await supabase
    .from('photo_submissions')
    .select('id, name, email, title, message, storage_path, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Could not load pending submissions: ${error.message}`);
  return signRows(supabase, submissionsBucket, data);
}

export async function uploadApprovedGalleryImage(file, details) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Gallery administration is not configured.');
  await requireGalleryAdmin(supabase);
  assertImage(file);
  const metadata = assertDetails(details);
  const path = `owner/${crypto.randomUUID()}.${allowedImageTypes.get(file.type)}`;
  await uploadPhoto(supabase, galleryBucket, path, file);

  const { data, error } = await supabase
    .from('gallery_photos')
    .insert({ ...metadata, storage_path: path })
    .select('id, title, description, category, storage_path, created_at')
    .single();
  if (error) {
    await cleanUpAfterFailure(supabase, galleryBucket, path,
      new Error(`Could not publish the photo: ${error.message}`));
  }
  return data;
}

export async function updateGalleryImage(id, details) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Gallery administration is not configured.');
  await requireGalleryAdmin(supabase);
  const metadata = assertDetails(details);
  const { error } = await supabase.from('gallery_photos').update(metadata).eq('id', id);
  if (error) throw new Error(`Could not update the photo details: ${error.message}`);
}

export async function removeGalleryImage(image) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Gallery administration is not configured.');
  await requireGalleryAdmin(supabase);
  const { error } = await supabase.from('gallery_photos').delete().eq('id', image.id);
  if (error) throw new Error(`Could not remove the gallery entry: ${error.message}`);
  await removePhoto(supabase, galleryBucket, image.storage_path);
}

export async function approveSubmission(submission, details) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Gallery administration is not configured.');
  await requireGalleryAdmin(supabase);
  const metadata = assertDetails(details);
  const { data: source, error: downloadError } = await supabase.storage
    .from(submissionsBucket)
    .download(submission.storage_path);
  if (downloadError) throw new Error(`Could not load the submitted photo: ${downloadError.message}`);

  const extension = allowedImageTypes.get(source.type);
  if (!extension) throw new Error('The submitted photo has an unsupported image format.');
  const path = `owner/${crypto.randomUUID()}.${extension}`;
  await uploadPhoto(supabase, galleryBucket, path, source);
  const { error: approvalError } = await supabase.rpc('approve_photo_submission', {
    p_submission_id: submission.id,
    p_title: metadata.title,
    p_description: metadata.description,
    p_category: metadata.category,
    p_storage_path: path,
  });
  if (approvalError) {
    await cleanUpAfterFailure(supabase, galleryBucket, path,
      new Error(`Could not approve and publish the photo: ${approvalError.message}`));
  }
}

export async function rejectSubmission(id) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Gallery administration is not configured.');
  await requireGalleryAdmin(supabase);
  const { error } = await supabase
    .from('photo_submissions')
    .update({ status: 'rejected' })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) throw new Error(`Could not reject the submission: ${error.message}`);
}

export function releaseGalleryImageUrls(images) {
  images.forEach((image) => {
    if (image.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(image.imageUrl);
  });
}
