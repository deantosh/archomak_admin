'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowLeft, LoaderCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import { resetPasswordForEmail } from '@/lib/supabase/client'
import { hasSupabaseEnv } from '@/lib/supabase/config'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

const SUCCESS_MESSAGE =
  'If an account exists for this email, a password reset link has been sent.'

export function ForgotPasswordForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!hasSupabaseEnv()) {
      setErrorMessage(
        'Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable password recovery.',
      )
      return
    }

    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await resetPasswordForEmail(values.email, redirectTo)

      if (error) {
        setErrorMessage('We could not send the reset link right now. Please try again.')
        return
      }

      setSuccessMessage(SUCCESS_MESSAGE)
      form.reset()
    } catch {
      setErrorMessage('We could not send the reset link right now. Please try again.')
    }
  })

  return (
    <Card className="border-white/10 bg-white/6 shadow-[0_32px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300">
          <Mail className="size-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl text-white">Forgot Password</CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-300">
            Enter your Archomak staff email and we&apos;ll send a secure password reset link.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            {(errorMessage || successMessage) && (
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                <p>{successMessage ?? errorMessage}</p>
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

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-emerald-300 transition hover:text-emerald-200"
          >
            <ArrowLeft className="size-4" />
            Back to Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
