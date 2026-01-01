'use client';
import Image from 'next/image';
import React from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import imgLogo from '@/assets/images/logo.png';
import { Heading, Paragraph } from '@/app/_components/Typography';

import { InputField } from '@/app/_components/InputField';
import Button, { ButtonLink } from '@/app/_components/Button';
import SignUpLeftCol from '@/app/_components/signup/SignUpLeftCol';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/_components/Toast';
import { signIn } from 'next-auth/react';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login(): React.ReactElement {
  const { addToast } = useToast();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (_data) => {
    try {
      const result = await signIn('credentials', {
        email: _data.email,
        password: _data.password,
        redirect: false,
      });

      if (result?.error) {
        addToast('Invalid email or password', { type: 'error' });
        return;
      }

      if (result?.ok) {
        // Successful login - redirect to app
        router.push('/dashboard');
      }
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'An unknown error occurred';
      addToast(message, { type: 'error' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SignUpLeftCol />
      <div className="flex w-full items-center justify-center md:w-3/5">
        <div className="w-full max-w-md px-6 py-12 md:px-12">
          {/* Logo */}
          <div className="mb-10 flex">
            <Image
              src={imgLogo}
              alt="Hello Ivy Logo"
              className="h-7 w-auto"
              priority
            />
          </div>
          <Heading level={1} className="mb-2 font-extrabold">
            Log In to Get Started
          </Heading>
          <Paragraph className="mb-16" size="sm">
            Log in to access your essay tools, brainstorm ideas, and get
            started.
          </Paragraph>
          <form
            className="mb-8 flex flex-col gap-8"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            autoComplete="off"
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <InputField
                  label="Email Id"
                  type="email"
                  placeholder="Enter your email"
                  {...field}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <InputField
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                  error={errors.password?.message}
                />
              )}
            />
            <div className="flex flex-row items-center justify-between">
              <Button
                variant="primary"
                size="md"
                label={isSubmitting ? 'Logging in...' : 'Login'}
                type="submit"
                disabled={isSubmitting}
              />
              <div className="flex gap-1">
                <ButtonLink href="/signup?forgot=1" label="Forgot password?" />
              </div>
            </div>
          </form>
          <div className="flex gap-1">
            Haven&lsquo;t signed up yet?{' '}
            <ButtonLink href="/signup" label="Sign Up" />
          </div>
        </div>
      </div>
    </div>
  );
}
