'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, LoaderCircle, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PasswordField } from '@/components/auth/password-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { persistSession } from '@/lib/supabase/client'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { hasSupabaseEnv } from '@/lib/supabase/config'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

const inviteRequirements =
  'Use at least 8 characters, including uppercase, lowercase, and a number.'

const acceptInviteSchema = z
  .object({
    fullName: z.string().min(2, 'Enter the team member’s full name.'),
    password: z
      .string()
      .min(8, inviteRequirements)
      .regex(/[A-Z]/, inviteRequirements)
      .regex(/[a-z]/, inviteRequirements)
      .regex(/[0-9]/, inviteRequirements),
    confirmPassword: z.string().min(1, 'Please confirm the password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type AcceptInviteValues = z.infer<typeof acceptInviteSchema>

function clearInviteUrlState() {
  const nextUrl = new URL(window.location.href)
  nextUrl.search = ''
  nextUrl.hash = ''
  window.history.replaceState({}, '', nextUrl.toString())
}

export function AcceptInviteForm() {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [inviteReady, setInviteReady] = useState(false)

  const form = useForm<AcceptInviteValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    async function initializeInvite() {
      if (!hasSupabaseEnv()) {
        setErrorMessage(
          'Invitations are temporarily unavailable because the app setup is incomplete.',
        )
        setReady(true)
        return
      }

      try {
        const supabase = getSupabaseBrowserClient()
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (cancelled) {
            return
          }

          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session) {
              persistSession(session as any)
            }

            setInviteReady(Boolean(session?.user))
            setErrorMessage(session?.user ? null : 'This invitation link is invalid or has expired.')
            setReady(true)

            if (session?.user) {
              form.setValue(
                'fullName',
                (session.user.user_metadata?.full_name as string | undefined) || '',
              )
              clearInviteUrlState()
            }
          }
        })
        unsubscribe = () => subscription.unsubscribe()

        const { data } = await supabase.auth.getSession()
        const user = data.session?.user ?? null

        if (!cancelled) {
          if (data.session) {
            persistSession(data.session as any)
          }

          setInviteReady(Boolean(user))
          setErrorMessage(user ? null : 'This invitation link is invalid or has expired.')
          setReady(true)
        }

        if (user) {
          form.setValue(
            'fullName',
            (user.user_metadata?.full_name as string | undefined) || '',
          )
          clearInviteUrlState()
        }
      } catch {
        if (!cancelled) {
          setErrorMessage('This invitation link is invalid or has expired.')
          setReady(true)
        }
      }
    }

    void initializeInvite()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [form])

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        setErrorMessage('This invitation link is invalid or has expired.')
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: values.password,
        data: {
          full_name: values.fullName,
          name: values.fullName,
        },
      })

      if (error) {
        setErrorMessage(
          toUserFriendlyErrorMessage(
            'We could not finish setting up your account. Please request a new invitation.',
          ),
        )
        return
      }

      const activationResponse = await fetch('/api/admin-team/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: values.fullName,
        }),
      })

      if (!activationResponse.ok) {
        const payload = (await activationResponse.json().catch(() => null)) as
          | { detail?: string }
          | null
        setErrorMessage(
          toUserFriendlyErrorMessage(
            payload?.detail || 'We could not activate your team membership. Please contact an administrator.',
          ),
        )
        return
      }

      setSuccessMessage('Invitation accepted successfully. Redirecting to your dashboard...')
      form.reset()

      window.setTimeout(() => {
        router.replace('/dashboard')
        router.refresh()
      }, 1200)
    } catch {
      setErrorMessage(
        toUserFriendlyErrorMessage(
          'We could not finish setting up your account. Please request a new invitation.',
        ),
      )
    }
  })

  return (
    <Card className="auth-card">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <UserPlus className="size-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl tracking-tight">Accept invite</CardTitle>
          <CardDescription className="text-sm leading-6">
            Set up your staff account.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {!ready ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-4 text-sm text-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Preparing invite…
          </div>
        ) : (
          <>
            {(errorMessage || successMessage) && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
                {successMessage ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                ) : (
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                )}
                <p>{successMessage ?? errorMessage}</p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-5">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="auth-label">Full name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="name"
                          placeholder="Your name"
                          className="h-11 rounded-xl border-border bg-input text-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="auth-label">Password</FormLabel>
                      <FormControl>
                        <PasswordField
                          {...field}
                          autoComplete="new-password"
                          placeholder="Create password"
                          inputClassName="h-11 rounded-xl border-border bg-input pr-11 text-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{inviteRequirements}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="auth-label">Confirm</FormLabel>
                      <FormControl>
                        <PasswordField
                          {...field}
                          autoComplete="new-password"
                          placeholder="Confirm password"
                          inputClassName="h-11 rounded-xl border-border bg-input pr-11 text-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="auth-submit"
                  disabled={!inviteReady || form.formState.isSubmitting || Boolean(successMessage)}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      Activating…
                    </>
                  ) : (
                    'Activate account'
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
