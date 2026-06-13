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
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

const SUCCESS_MESSAGE =
  'If an account exists for this email, a password reset link has been sent.'
const RESET_PASSWORD_REDIRECT_URL =
  'https://admin.archomak.com/reset-password'
const FRIENDLY_RATE_LIMIT_MESSAGE =
  'Too many reset requests were made recently. Please wait a few minutes and try again.'

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
        'Password recovery is temporarily unavailable because the app setup is incomplete.',
      )
      return
    }

    try {
      const { error, message } = await resetPasswordForEmail(
        values.email,
        RESET_PASSWORD_REDIRECT_URL,
      )

      if (error) {
        const normalizedMessage = message?.toLowerCase() ?? ''
        setErrorMessage(
          normalizedMessage.includes('rate limit')
            ? FRIENDLY_RATE_LIMIT_MESSAGE
            : toUserFriendlyErrorMessage(message),
        )
        return
      }

      setSuccessMessage(SUCCESS_MESSAGE)
      form.reset()
    } catch {
      setErrorMessage(
        toUserFriendlyErrorMessage(
          'We could not send the reset link right now. Please try again.',
        ),
      )
    }
  })

  return (
    <Card className="auth-card">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Mail className="size-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl tracking-tight">Reset password</CardTitle>
          <CardDescription className="text-sm leading-6">
            We&apos;ll email you a secure link.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            {(errorMessage || successMessage) && (
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>{successMessage ?? errorMessage}</p>
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
                        className="auth-input"
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
              className="auth-submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Sending…
                </>
              ) : (
                'Send link'
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <Link href="/" className="auth-link inline-flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
