# Ashish Bisht — Developer Portfolio

A responsive React + Vite portfolio for Home, About, Projects, Hobbies and Contact, with an owner-managed photography gallery and private visitor-submission queue.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Update `.env.local` as needed, then restart Vite. LinkedIn, Instagram and X are omitted until their profile URLs are supplied. The contact form opens the visitor's email application; it does not send or store messages on a server.

Without Supabase configuration, the portfolio and public pages still work, but photo submissions and gallery management are disabled. The gallery does not fall back to public local uploads: without a trusted backend, it cannot securely enforce owner-only publishing or private visitor submissions.

## Secure photo gallery setup (Supabase)

The public Hobbies page reads only approved rows. Visitor uploads go into a private bucket and a `pending` queue; they are not publicly readable. Only an authenticated user with the server-managed `app_metadata.gallery_admin = true` claim can view submissions, publish, edit or delete gallery content. RLS and Storage policies enforce this even if someone bypasses the interface.

1. Create a Supabase project. In **SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql). It creates constrained gallery/submission tables, review-to-photo and reviewer relationships, queue/gallery indexes, RLS policies and two **private** buckets:
   - `portfolio-gallery` — only images referenced by approved public rows can be read by visitors.
   - `photo-submissions` — visitor uploads are private; only the gallery administrator can read them.

   Both buckets limit files to 12 MiB and allow only JPEG, PNG and WebP.
2. In **Authentication → Providers**, enable email sign-in. Disable public sign-ups. Invite Ashish's existing account from **Authentication → Users**; do not make an open sign-up form.
3. Assign the owner-only role in the SQL Editor, substituting the invited administrator's email:

   ```sql
   update auth.users
   set raw_app_meta_data =
     coalesce(raw_app_meta_data, '{}'::jsonb) || '{"gallery_admin": true}'::jsonb
   where email = 'owner@example.com';
   ```

   `app_metadata` is server-controlled; do not use `user_metadata` for this permission. Sign out and sign in again after changing the claim so the new JWT includes it.
4. In **Authentication → URL Configuration**, set the site URL and allow these redirect URLs:
   - `http://localhost:5173/admin/gallery`
   - `https://YOUR-DOMAIN/admin/gallery`
5. Copy `.env.example` to `.env.local` and set:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
   VITE_SUPABASE_GALLERY_BUCKET=portfolio-gallery
   VITE_SUPABASE_SUBMISSIONS_BUCKET=photo-submissions
   ```

   The anon/publishable key is intended for browser use and is protected by RLS. **Never** add a `service_role`, secret, or database password to a `VITE_` variable or commit it to source control.
6. Visit `/admin/gallery`, request a sign-in link using the invited account, and manage photos from the private dashboard. Visitors can submit photos on `/hobbies`; each remains private until you explicitly approve it.

The schema policies permit anonymous photo-submission inserts only in the pending bucket and pending table state. Visitors cannot read, modify, approve, or delete submissions. The public gallery bucket is private; its read policy is limited to object paths in `gallery_photos`. Approval uses a database transaction to change the queue status and insert the public gallery row together, so a failed approval remains private. To disable or change gallery access, update the RLS policies and owner claim in Supabase, not just the React UI.

### Permission checks after setup

Use an incognito browser for visitor checks and the invited account for owner checks. Also test via Supabase's REST and Storage endpoints using only the public anon key:

1. Anonymous `GET /rest/v1/gallery_photos` returns approved rows; `GET /rest/v1/photo_submissions` is denied, and anonymous `POST`, `PATCH` or `DELETE` against `gallery_photos` is denied.
2. A visitor can upload only a supported image under `pending/` and create a pending submission. They cannot read that row or fetch its private object, even when they know its path.
3. The visitor submission appears in the owner's pending queue, not the public gallery. The owner can approve or reject it; only approval adds its image to the public gallery.
4. Anonymous uploads, updates and deletes in `portfolio-gallery` are denied. Reads of gallery objects succeed only for paths referenced by approved gallery rows. Non-admin authenticated users must receive the same denials.
5. Only the invited owner can sign into `/admin/gallery`, view pending records, edit/publish/delete gallery photos, and create signed URLs for pending objects. Approved photos remain available after reload; rejected and pending photos remain private.

No Supabase project credentials are included in this repository, so these live RLS checks must be run against your configured project. The portfolio UI being hidden is not a substitute for these direct API checks.

## Build and preview

```bash
npm run build
npm run preview
```

The production files are generated in `dist/`.

## Deploy to Vercel

1. Push the project to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. Choose **Vite**; use `npm run build` as the build command and `dist` as the output directory.
3. Add the same public `VITE_` profile/Supabase variables under **Project Settings → Environment Variables**. Do not configure a service-role key.
4. Add the deployed `/admin/gallery` URL to Supabase's allowed redirect URLs, then deploy. The included `vercel.json` rewrites direct page requests to the React app.
