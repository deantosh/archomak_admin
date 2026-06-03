'use client'

import type { ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PasswordFieldProps = Omit<ComponentProps<typeof Input>, 'type'> & {
  inputClassName?: string
}

export function PasswordField({
  inputClassName,
  className,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={className}>
      <div className="relative">
        <Input
          {...props}
          type={visible ? 'text' : 'password'}
          className={inputClassName ? inputClassName : 'pr-11'}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    </div>
  )
}
