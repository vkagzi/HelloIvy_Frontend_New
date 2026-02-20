'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import imgLogo from '@/assets/images/logo.png';
import { Heading, Label, Paragraph } from '@/app/_components/Typography';
import { InputField } from '@/app/_components/InputField';
import Button, { ButtonLink } from '@/app/_components/Button';
import { FiArrowSmallRight } from '@/app/_components/Icons';
import SignUpLeftCol from '@/app/_components/signup/SignUpLeftCol';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { setToken } from '@/lib/api';
import { useToast } from '@/app/_components/Toast';
import { Input } from '@/app/_components/Input';
import { Checkbox } from '@/app/_components/Checkbox';
import { OTPInput } from '@/app/_components/OTPInput';

// Email form schema
const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

// OTP form schema
const otpSchema = z.object({
  otp: z.string().regex(/^\d{3}-\d{3}$/, 'Enter a valid 6-digit OTP'),
});

type OtpFormValues = z.infer<typeof otpSchema>;

// Password form schema
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/,
        'Password must contain a special symbol'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

// Terms form schema
const termsSchema = z.object({
  agree: z.literal(true, { message: 'You must agree to continue' }),
});
type TermsFormValues = z.infer<typeof termsSchema>;

export interface SignUpProps {
  isForgot?: boolean;
}

export default function SignUp({ isForgot }: SignUpProps): React.ReactElement {
  const { addToast } = useToast();
  // Step: 0 = email, 1 = otp, 2 = set password, 3 = terms
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = parseInt(searchParams?.get('step') || '0', 10);
  const [step, setStep] = useState<number>(initialStep);
  const [email, setEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [hasAgreed, setHasAgreed] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  // Email form
  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: isEmailSubmitting },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onTouched',
  });

  // OTP form
  const {
    control: otpControl,
    handleSubmit: handleOtpSubmit,
    setValue: setOtpValue,
    watch: watchOtp,
    formState: { errors: otpErrors, isSubmitting: isOtpSubmitting },
    reset: resetOtpForm,
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    mode: 'onTouched',
    defaultValues: { otp: '' },
  });

  // Password form
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPasswordForm,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Terms form
  const {
    control: termsControl,
    handleSubmit: handleTermsSubmit,
    formState: { errors: termsErrors, isSubmitting: isTermsSubmitting },
    reset: resetTermsForm,
  } = useForm<TermsFormValues>({
    resolver: zodResolver(termsSchema),
    mode: 'onTouched',
  });

  // OTP timer effect
  React.useEffect(() => {
    if (step !== 1 || otpTimer === 0) return;
    const interval = setInterval(() => {
      setOtpTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  // Email submit handler
  const onEmailSubmit: SubmitHandler<EmailFormValues> = async (
    data: EmailFormValues
  ) => {
    try {
      if (isForgot) {
        // For forgot password, use password reset request endpoint
        await api('/api/accounts/password-reset/request/', {
          method: 'POST',
          body: { email: data.email },
          tokenOverride: '', // Exclude any existing token for password reset
        });
      } else {
        // For signup, use signup endpoint
        await api('/api/accounts/signup/', {
          method: 'POST',
          body: { email: data.email },
          tokenOverride: '', // Exclude any existing token for signup
        });
      }
      setEmail(data.email);
      setStep(1);
      setOtpTimer(60);
      resetOtpForm({ otp: '' });
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'An unknown error occurred';
      addToast(message, { type: 'error' });
    }
  };

  // OTP submit handler
  const onOtpSubmit: SubmitHandler<OtpFormValues> = async (
    _data: OtpFormValues
  ) => {
    try {
      const code = _data.otp.replace(/-/g, '');
      const r = await api('/api/accounts/verify/', {
        method: 'POST',
        body: {
          email,
          code,
        },
        tokenOverride: '', // Exclude any existing token for OTP verification
      });
      const { token } = r;
      setToken(token);
      setOtpCode(code); // Store the verified OTP code

      if (isForgot) {
        // For forgot password, go to password reset
        setStep(2);
        resetPasswordForm();
      } else {
        // For signup, go to password setup
        setStep(2);
        resetPasswordForm();
      }
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'An unknown error occurred';
      addToast(message, { type: 'error' });
      return;
    }
  };

  // Password submit handler
  const onPasswordSubmit: SubmitHandler<PasswordFormValues> = async (
    _data: PasswordFormValues
  ) => {
    try {
      await api('/api/accounts/password-reset/confirm/', {
        method: 'POST',
        body: {
          email,
          code: otpCode,
          new_password: _data.password,
        },
      });

      if (isForgot) {
        // For forgot password, redirect to login after password reset
        addToast(
          'Password reset successfully! Please login with your new password.',
          { type: 'success' }
        );
        router.push('/login');
      } else {
        // For signup, redirect to login after setting password
        addToast(
          'Account created successfully! Please login with your credentials.',
          { type: 'success' }
        );
        router.push('/login');
      }
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'An unknown error occurred';
      addToast(message, { type: 'error' });
    }
  };

  // Terms submit handler
  const onTermsSubmit: SubmitHandler<TermsFormValues> = async () => {
    await api('/api/accounts/accept-terms/', {
      method: 'POST',
      body: {},
    });
    router.push('/app');
  };

  // Resend OTP handler
  const handleResendOtp = async (): Promise<void> => {
    setIsResending(true);
    try {
      if (isForgot) {
        await api('/api/accounts/password-reset/request/', {
          method: 'POST',
          body: { email: email },
          tokenOverride: '', // Exclude any existing token for password reset
        });
      } else {
        await api('/api/accounts/signup/', {
          method: 'POST',
          body: { email: email },
          tokenOverride: '', // Exclude any existing token for signup
        });
      }
      setOtpTimer(60);
      resetOtpForm({ otp: '' });
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Failed to resend OTP';
      addToast(message, { type: 'error' });
    }
    setIsResending(false);
  };

  // Render OTP input boxes
  const renderOtpInputs = (): React.ReactElement => {
    const otp = watchOtp('otp').replace(/-/g, '');
    return (
      <OTPInput
        value={otp}
        onChange={(value) => {
          const formatted = value.padEnd(6, '');
          setOtpValue(
            'otp',
            `${formatted.slice(0, 3)}-${formatted.slice(3, 6)}`
          );
        }}
        length={6}
        separator={true}
        separatorPosition={3}
        error={Boolean(otpErrors.otp)}
      />
    );
  };

  const renderStep2 = (): React.ReactElement => {
    return (
      <div className="signup-background--2 flex min-h-screen items-center justify-center">
        <div className="flex min-h-[70vh] w-sm flex-col items-start">
          <Image
            src={imgLogo}
            alt="Hello Ivy Logo"
            className="mb-8 h-8 w-auto"
            priority
          />
          <Heading level={1} className="mb-2 text-center font-extrabold">
            Set Password
          </Heading>
          <Paragraph className="mb-8 text-center" size="sm">
            Set a password to keep your account secure.
          </Paragraph>
          <form
            className="flex w-full max-w-md flex-col gap-6"
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            autoComplete="off"
            noValidate
          >
            <Controller
              name="password"
              control={passwordControl}
              render={({
                field,
              }: {
                field: {
                  value: string;
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
                  onBlur: () => void;
                  ref: React.Ref<HTMLInputElement>;
                };
              }) => (
                <div className="flex flex-col gap-2">
                  <Label>Set Password</Label>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      error={Boolean(passwordErrors.password)}
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <svg
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M3.5 3.5l13 13M10 16.25c-3.5 0-6.5-2.5-8-6.25a10.6 10.6 0 0 1 2.13-3.13M7.5 7.5a3.75 3.75 0 0 1 5 5m-1.25 1.25a3.75 3.75 0 0 1-5-5"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M10 16.25c3.5 0 6.5-2.5 8-6.25-1.5-3.75-4.5-6.25-8-6.25s-6.5 2.5-8 6.25c1.5 3.75 4.5 6.25 8 6.25Z"
                          />
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">
                    Password must be 8+ characters, with a number and a special
                    symbol (!, @, #, $).
                  </span>
                  {passwordErrors.password && (
                    <span className="mt-1 text-xs text-red-500">
                      {passwordErrors.password.message}
                    </span>
                  )}
                </div>
              )}
            />
            <Controller
              name="confirmPassword"
              control={passwordControl}
              render={({
                field,
              }: {
                field: {
                  value: string;
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
                  onBlur: () => void;
                  ref: React.Ref<HTMLInputElement>;
                };
              }) => (
                <div className="flex flex-col gap-2">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      error={Boolean(passwordErrors.confirmPassword)}
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showConfirmPassword ? (
                        <svg
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M3.5 3.5l13 13M10 16.25c-3.5 0-6.5-2.5-8-6.25a10.6 10.6 0 0 1 2.13-3.13M7.5 7.5a3.75 3.75 0 0 1 5 5m-1.25 1.25a3.75 3.75 0 0 1-5-5"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M10 16.25c3.5 0 6.5-2.5 8-6.25-1.5-3.75-4.5-6.25-8-6.25s-6.5 2.5-8 6.25c1.5 3.75 4.5 6.25 8 6.25Z"
                          />
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <span className="mt-1 text-xs text-red-500">
                      {passwordErrors.confirmPassword.message}
                    </span>
                  )}
                </div>
              )}
            />
            <div className="mt-4 flex">
              <Button
                variant="primary"
                size="md"
                label={isPasswordSubmitting ? 'Setting...' : 'Set password'}
                type="submit"
                disabled={isPasswordSubmitting}
              />
            </div>
          </form>
        </div>
      </div>
    );
  };
  const renderStep3 = (): React.ReactElement => {
    return (
      <div className="signup-background--2 flex min-h-screen items-center justify-center">
        <div className="flex min-h-[70vh] flex-col items-start">
          <Heading
            level={4}
            className="mb-3 w-full border-b border-neutral-200 pb-3 font-extrabold"
          >
            Agree to Terms & Conditions and Privacy Policy
          </Heading>
          <form
            className="flex w-full max-w-lg flex-col gap-6"
            onSubmit={handleTermsSubmit(onTermsSubmit)}
            autoComplete="off"
            noValidate
          >
            <div className="max-h-[70vh] overflow-auto px-2">
              <Label size="lg">Terms & Conditions</Label>
              <Paragraph
                size="sm"
                className="mt-2 mb-4 border-b border-neutral-300 pb-4"
              >
                By using HelloIvy's services, you agree to comply with all applicable laws and regulations. You affirm that all information provided during signup is accurate and truthful. We collect personal information to personalize your career guidance experience and provide tailored recommendations. Your data is used to track your progress, preferences, and interactions with our platform. You agree not to misuse our services, including but not limited to: harassment, automated access, or attempts to disrupt service availability. HelloIvy reserves the right to modify these terms at any time with notice. Continued use of the service after modifications constitutes acceptance of the new terms.
              </Paragraph>

              <Label size="lg">Privacy Policy</Label>
              <Paragraph size="sm" className="mt-2">
                We are committed to protecting your privacy. The personal information you provide, including name, email, educational background, and career interests, is stored securely and used solely to enhance your experience on HelloIvy. We do not share your information with third parties without your explicit consent, except as required by law. You have the right to access, modify, or delete your personal data at any time through your account settings. We implement industry-standard encryption and security measures to protect your data from unauthorized access. For any privacy concerns or inquiries, please contact our support team. Our privacy practices comply with applicable data protection regulations and are subject to periodic review.
              </Paragraph>
            </div>
            <Controller
              name="agree"
              control={termsControl}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="agree"
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      setHasAgreed(Boolean(checked));
                    }}
                    ref={field.ref}
                  />
                  <Label className="text-sm">
                    I have read all the instruction mentioned above.
                  </Label>
                </div>
              )}
            />
            <div className="mt-1 flex justify-end gap-4 border-t border-neutral-200 pt-4">
              <Button
                key={'n_' + termsControl._formValues.agree}
                variant="primary"
                type="submit"
                label={isTermsSubmitting ? 'Continuing...' : 'Continue'}
                iconRight={<FiArrowSmallRight />}
                disabled={!hasAgreed}
              />
            </div>
            {termsErrors.agree && (
              <span className="mt-1 text-xs text-red-500">
                {termsErrors.agree.message}
              </span>
            )}
          </form>
        </div>
      </div>
    );
  };

  if (step == 2) {
    return renderStep2();
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SignUpLeftCol />
      {/* Right column: 100% on mobile, 60% on md+ */}
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
          {step === 0 && (
            <>
              <Heading level={1} className="mb-2 font-extrabold">
                {isForgot ? 'Forgot Password' : 'Sign-Up'}
              </Heading>
              <Paragraph className="mb-16" size="sm">
                We’ll send an OTP to the email for verification.
              </Paragraph>
              <form
                className="mb-16 flex flex-col gap-12"
                onSubmit={handleEmailSubmit(onEmailSubmit)}
                noValidate
                autoComplete="off"
              >
                <Controller
                  name="email"
                  control={emailControl}
                  render={({ field }: { field: object }) => (
                    <InputField
                      label="Email Id"
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                      error={emailErrors.email?.message}
                    />
                  )}
                />
                <div className="flex">
                  <Button
                    variant="primary"
                    size="md"
                    label={isEmailSubmitting ? 'Sending...' : 'Send OTP'}
                    type="submit"
                    disabled={isEmailSubmitting}
                  />
                </div>
                <div className="flex gap-1">
                  Already have an account?{' '}
                  <ButtonLink href="/login" label="Login"></ButtonLink>
                </div>
              </form>
            </>
          )}
          {step === 1 && (
            <>
              <Heading level={1} className="mb-2 font-extrabold">
                Verify Email
              </Heading>
              <Paragraph className="mb-8" size="sm">
                Please enter the 6-digit code that we have sent to your email.{' '}
                <span className="font-semibold">{email}</span>
              </Paragraph>
              <form
                className="mb-8 flex flex-col gap-4"
                onSubmit={handleOtpSubmit(onOtpSubmit)}
                autoComplete="off"
                noValidate
              >
                <Controller
                  name="otp"
                  control={otpControl}
                  // field is required by react-hook-form, but not used directly here
                  render={() => (
                    <div className="flex w-full flex-col gap-2">
                      <Label>Enter OTP</Label>
                      {renderOtpInputs()}
                      {otpErrors.otp && (
                        <span className="mt-1 text-xs text-red-500">
                          {otpErrors.otp.message}
                        </span>
                      )}
                    </div>
                  )}
                />
                <div className="mb-4 flex items-center justify-between text-sm">
                  <div>
                    {otpTimer > 0 ? (
                      <span className="text-gray-500">
                        Resend in 0:{otpTimer.toString().padStart(2, '0')}
                      </span>
                    ) : isResending ? (
                      <>
                        Haven&#39;t received the code?{' '}
                        <span className="text-gray-500">Resending...</span>
                      </>
                    ) : (
                      <>
                        Haven&#39;t received the code?{' '}
                        <Button
                          variant="link"
                          type="button"
                          onClick={handleResendOtp}
                          disabled={otpTimer > 0}
                          label="Resend OTP"
                        ></Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex">
                  <Button
                    variant="primary"
                    size="md"
                    label={isOtpSubmitting ? 'Verifying...' : 'Verify OTP'}
                    type="submit"
                    disabled={isOtpSubmitting}
                  />
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
