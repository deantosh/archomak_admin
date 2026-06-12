'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole } from 'lucide-react'
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
import {
  clearSessionCookies,
  verifyRecoveryToken,
} from '@/lib/supabase/client'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { hasSupabaseEnv } from '@/lib/supabase/config'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

const passwordRequirements =
  'Use at least 8 characters, including uppercase, lowercase, and a number.'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, passwordRequirements)
      .regex(/[A-Z]/, passwordRequirements)
      .regex(/[a-z]/, passwordRequirements)
      .regex(/[0-9]/, passwordRequirements),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

function clearRecoveryUrlState() {
  const nextUrl = new URL(window.location.href)
  nextUrl.search = ''
  nextUrl.hash = ''
  window.history.replaceState({}, '', nextUrl.toString())
}

export function ResetPasswordForm() {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [recoveryReady, setRecoveryReady] = useState(false)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    async function initializeRecovery() {
      if (!hasSupabaseEnv()) {
        setErrorMessage(
          'Password recovery is temporarily unavailable because the app setup is incomplete.',
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

          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            setRecoveryReady(Boolean(session))
            setErrorMessage(session ? null : 'This password reset link is invalid or has expired.')
            setReady(true)

            if (session) {
              clearRecoveryUrlState()
            }
          }
        })
        unsubscribe = () => subscription.unsubscribe()
        const queryParams = new URLSearchParams(window.location.search)
        const tokenHash = queryParams.get('token_hash')
        const queryType = queryParams.get('type')
        const queryError = queryParams.get('error')
        const queryErrorCode = queryParams.get('error_code')

        if (queryError || queryErrorCode) {
          clearRecoveryUrlState()
          throw new Error('Invalid recovery session')
        }

        if (tokenHash && queryType) {
          const session = await verifyRecoveryToken(tokenHash, queryType)

          if (!session) {
            throw new Error('Invalid recovery session')
          }

          if (!cancelled) {
            setRecoveryReady(true)
            setReady(true)
          }

          clearRecoveryUrlState()
          return
        }

        const hashParams = new URLSearchParams(
          window.location.hash.startsWith('#')
            ? window.location.hash.slice(1)
            : window.location.hash,
        )
        const hashError = hashParams.get('error')
        const hashErrorCode = hashParams.get('error_code')

        if (hashError || hashErrorCode) {
          clearRecoveryUrlState()
          throw new Error('Invalid recovery session')
        }

        const { data } = await supabase.auth.getSession()
        const user = data.session?.user ?? null

        if (!cancelled) {
          setRecoveryReady(Boolean(user))
          setErrorMessage(user ? null : 'This password reset link is invalid or has expired.')
          setReady(true)
        }

        if (user) {
          clearRecoveryUrlState()
        }
      } catch {
        if (!cancelled) {
          setErrorMessage('This password reset link is invalid or has expired.')
          setReady(true)
        }
      }
    }

    void initializeRecovery()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        setErrorMessage('This password reset link is invalid or has expired.')
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (error) {
        setErrorMessage(
          toUserFriendlyErrorMessage(
            'We could not update your password. Please request a new reset link.',
          ),
        )
        return
      }

      await supabase.auth.signOut()
      clearSessionCookies()
      setSuccessMessage('Password updated successfully. You can now sign in.')
      form.reset()

      window.setTimeout(() => {
        router.replace('/?message=password-updated')
      }, 1200)
    } catch {
      setErrorMessage(
        toUserFriendlyErrorMessage(
          'We could not update your password. Please request a new reset link.',
        ),
      )
    }
  })

  return (
    <Card className="auth-card">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <LockKeyhole className="size-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl tracking-tight">New password</CardTitle>
          <CardDescription className="text-sm leading-6">
            Choose a password for your account.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {!ready ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-4 text-sm text-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Preparing session…
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="auth-label">Password</FormLabel>
                      <FormControl>
                        <PasswordField
                          {...field}
                          autoComplete="new-password"
                          placeholder="New password"
                          inputClassName="h-11 rounded-xl border-border bg-input pr-11 text-foreground placeholder:text-muted-foreground"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{passwordRequirements}</p>
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
                  disabled={!recoveryReady || form.formState.isSubmitting || Boolean(successMessage)}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      Updating…
                    </>
                  ) : (
                    'Update password'
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
