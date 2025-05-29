'use client';

import { signIn } from 'next-auth/react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface GoogleButtonProps extends ButtonProps {
  text?: string;
}

export function GoogleButton({ 
  text = 'Continuar con Google',
  className,
  ...props 
}: GoogleButtonProps) {
  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn('w-full', className)}
      onClick={handleSignIn}
      {...props}
    >
      <Icons.google className="mr-2 h-4 w-4" />
      {text}
    </Button>
  );
}
