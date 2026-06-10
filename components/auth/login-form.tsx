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
import { clearSessionCookies, fetchUser, signInWithPassword } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/supabase/config'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean().default(false),
})

type LoginValues = z.infer<typeof loginSchema>

const LOGIN_ERROR =
  'Authentication failed. Please verify your email and password and try again.'
const ACCESS_DENIED =
  'Access denied. Your account is not authorized to access this dashboard.'
const CONFIG_ERROR =
  'Sign-in is temporarily unavailable because the app setup is incomplete.'
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

    if (hashInvitationType === 'email_change' || hashInvitationType === 'signup' || hashInvitationType === 'magiclink') {
      router.replace(`/dashboard/settings?verification=confirmed`)
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
      const accessToken = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('archomak_access_token='))
        ?.split('=')[1]

      if (accessToken) {
        void fetchUser(decodeURIComponent(accessToken)).then((user) => {
          if (user) {
            router.replace('/dashboard')
            router.refresh()
          }
        })
      } else {
        clearSessionCookies()
      }
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
      setErrorMessage('Password updated successfully. You can now sign in.')
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
      setErrorMessage(LOGIN_ERROR)
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
    <Card className="border-white/10 bg-white/6 shadow-[0_32px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300">
          <ShieldCheck className="size-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl text-white">Admin Sign In</CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-300">
            Sign in with your Archomak staff account to access internal operations.
          </CardDescription>
          <p className="text-xs leading-5 text-slate-400">
            Demo previews on the site stay clearly labeled. Official report generation is only
            available after work-email verification.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            {(errorMessage || configError) && (
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                <p>{configError ?? errorMessage}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-200">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        {...field}
                        type="email"
                        autoComplete="email"
                        placeholder="name@archomak.com"
                        className="h-11 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-400"
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
                    <FormLabel className="text-slate-200">Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-emerald-300 transition hover:text-emerald-200"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordField
                      {...field}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      inputClassName="h-11 rounded-xl border-white/10 bg-white/5 pr-11 text-white placeholder:text-slate-400"
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
                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1">
                    <Label className="text-sm text-slate-200">Remember me</Label>
                    <p className="text-xs text-slate-400">Keep your email filled on this device.</p>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              disabled={form.formState.isSubmitting || Boolean(configError)}
            >
              {form.formState.isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Signing In...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Authorized personnel only. Access is restricted to approved Archomak staff.
        </p>
      </CardContent>
    </Card>
  )
}
