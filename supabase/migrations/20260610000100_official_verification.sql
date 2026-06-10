BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS official_verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS official_email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS official_verified_by uuid,
  ADD COLUMN IF NOT EXISTS report_access_enabled boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_official_verification_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_official_verification_status_check
      CHECK (official_verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_official_verified_by_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_official_verified_by_fkey
      FOREIGN KEY (official_verified_by)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profile_verifications_status_check'
  ) THEN
    ALTER TABLE public.profile_verifications
      ADD CONSTRAINT profile_verifications_status_check
      CHECK (status IN ('pending', 'verified', 'expired', 'rejected'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profile_verifications_token_key
  ON public.profile_verifications(token);

CREATE INDEX IF NOT EXISTS profile_verifications_profile_id_idx
  ON public.profile_verifications(profile_id);

ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_verifications'
      AND policyname = 'Service role can manage verification rows'
  ) THEN
    CREATE POLICY "Service role can manage verification rows"
      ON public.profile_verifications
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_verifications'
      AND policyname = 'Users can request their own verification'
  ) THEN
    CREATE POLICY "Users can request their own verification"
      ON public.profile_verifications
      FOR INSERT
      TO authenticated
      WITH CHECK (profile_id = auth.uid());
  END IF;
END $$;

COMMIT;
