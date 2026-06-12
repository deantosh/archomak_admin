'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, LoaderCircle, Mail, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PasswordField } from '@/components/auth/password-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  clearSessionCookies,
  ensureValidSession,
  signInWithPassword,
} from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/supabase/config'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean().default(false),
})

type LoginValues = z.infer<typeof loginSchema>

const LOGIN_ERROR = 'Invalid email or password.'
const ACCESS_DENIED = 'Your account is not authorized for this dashboard.'
const CONFIG_ERROR = 'Sign-in is unavailable. Configuration is incomplete.'
function parseHashParams(hash: string) {
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash
  return new URLSearchParams(cleanHash)
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setConfigError(CONFIG_ERROR)
      return
    }

    const recoveryHashParams = parseHashParams(window.location.hash)
    const recoveryType = recoveryHashParams.get('type')
    const accessToken = recoveryHashParams.get('access_token')
    const refreshToken = recoveryHashParams.get('refresh_token')
    const hashError = recoveryHashParams.get('error')
    const hashErrorCode = recoveryHashParams.get('error_code')
    const hashInvitationType = recoveryHashParams.get('type')

    if (hashInvitationType === 'invite') {
      router.replace(`/accept-invite${window.location.search}${window.location.hash}`)
      return
    }

    if (
      recoveryType === 'recovery' ||
      (accessToken && refreshToken) ||
      hashError ||
      hashErrorCode
    ) {
      router.replace(`/reset-password${window.location.search}${window.location.hash}`)
      return
    }

    const rememberedEmail = window.localStorage.getItem('archomak-remembered-email')
    const error = searchParams.get('error')

    if (error === 'access-denied') {
      clearSessionCookies()
    } else {
      void ensureValidSession().then((session) => {
        if (session) {
          router.replace('/dashboard')
          router.refresh()
        }
      })
    }

    if (rememberedEmail) {
      form.setValue('email', rememberedEmail)
      form.setValue('rememberMe', true)
    }
  }, [form, router, searchParams])

  useEffect(() => {
    const message = searchParams.get('message')
    const error = searchParams.get('error')

    if (message === 'password-updated') {
      setErrorMessage('Password updated. Sign in to continue.')
      return
    }

    if (error === 'access-denied') {
      setErrorMessage(ACCESS_DENIED)
      return
    }

    if (error === 'config') {
      setConfigError(CONFIG_ERROR)
      return
    }

    if (error === 'auth') {
      setErrorMessage('Your session expired. Sign in again.')
    }
  }, [searchParams])

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null)

    try {
      const { error } = await signInWithPassword(values.email, values.password)

      if (error) {
        setErrorMessage(LOGIN_ERROR)
        return
      }

      if (values.rememberMe) {
        window.localStorage.setItem('archomak-remembered-email', values.email)
      } else {
        window.localStorage.removeItem('archomak-remembered-email')
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setErrorMessage(LOGIN_ERROR)
    }
  })

  return (
    <Card className="auth-card">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl tracking-tight">Sign in</CardTitle>
          <CardDescription className="text-sm leading-6">
            Staff accounts only.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            {(errorMessage || configError) && (
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>{configError ?? errorMessage}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="auth-label">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        autoComplete="email"
                        placeholder="name@archomak.com"
                        className="auth-input pl-10"
                      />
                    </div>
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
                  <div className="flex items-center justify-between gap-4">
                    <FormLabel className="auth-label">Password</FormLabel>
                    <Link href="/forgot-password" className="auth-link">
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordField
                      {...field}
                      autoComplete="current-password"
                      placeholder="Your password"
                      inputClassName="h-11 rounded-xl border-border bg-input pr-11 text-foreground placeholder:text-muted-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-2xl border border-border bg-muted/40 px-4 py-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <Label className="text-sm text-foreground">Remember email</Label>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="auth-submit"
              disabled={form.formState.isSubmitting || Boolean(configError)}
            >
              {form.formState.isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Authorized staff only.
        </p>
      </CardContent>
    </Card>
  )
}
