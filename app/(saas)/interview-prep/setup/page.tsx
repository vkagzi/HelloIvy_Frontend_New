'use client';

import React, { useState } from 'react';
import { Heading, Paragraph } from '@/app/_components/Typography';
import Button from '@/app/_components/Button';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/app/_components/Input';

const InterviewSetupPage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    interviewType: '',
    targetCollege: '',
    targetProgram: '',
    resume: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const interviewTypes = [
    { value: 'undergraduate', label: 'Undergraduate Admissions Interview' },
    { value: 'masters', label: "Master's Program Interview" },
    { value: 'mba', label: 'MBA Program Interview' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFormData((prev) => ({
      ...prev,
      resume: file || null,
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.interviewType) {
        addToast('Please select an interview type', { type: 'error' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // For file uploads, we still need to use FormData and fetch directly
      // because the api utility doesn't handle FormData properly
      const formDataToSend = new FormData();
      formDataToSend.append('interview_type', formData.interviewType);
      formDataToSend.append('target_college', formData.targetCollege);
      formDataToSend.append('target_program', formData.targetProgram);

      if (formData.resume) {
        formDataToSend.append('resume', formData.resume);
      }

      const response = await fetch('/api/interview-prep/start-session/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();

        // Save session ID to localStorage
        localStorage.setItem('current-interview-session', data.session_id);

        addToast('Interview session created successfully!', {
          type: 'success',
        });

        // Navigate to interview session
        router.push(`/interview-prep/session/${data.session_id}`);
      } else {
        const errorData = await response.json();
        addToast(errorData.error || 'Failed to create interview session', {
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating interview session:', error);
      addToast('Failed to create interview session', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <Heading
              level={1}
              className="mb-4 text-3xl font-bold text-gray-900"
            >
              Setup Interview Session
            </Heading>
            <Paragraph className="text-gray-600">
              Step {step} of 2:{' '}
              {step === 1 ? 'Choose Interview Type' : 'Additional Details'}
            </Paragraph>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Interview Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Heading level={2} className="mb-4 text-xl font-semibold">
                  What type of interview are you preparing for?
                </Heading>

                <div className="space-y-3">
                  {interviewTypes.map((type) => (
                    <label key={type.value} className="block">
                      <input
                        type="radio"
                        name="interviewType"
                        value={type.value}
                        checked={formData.interviewType === type.value}
                        onChange={(e) =>
                          handleInputChange('interviewType', e.target.value)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          formData.interviewType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-4 w-4 rounded-full border-2 ${
                              formData.interviewType === type.value
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {formData.interviewType === type.value && (
                              <div className="mx-auto mt-0.5 h-2 w-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <Paragraph className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Choose the interview type that
                  matches your application. This will help us provide more
                  relevant questions and feedback.
                </Paragraph>
              </div>
            </div>
          )}

          {/* Step 2: Additional Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Heading level={2} className="mb-4 text-xl font-semibold">
                  Additional Details
                </Heading>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Target College/University
                    </label>
                    <Input
                      type="text"
                      value={formData.targetCollege}
                      onChange={(e) =>
                        handleInputChange('targetCollege', e.target.value)
                      }
                      placeholder="e.g., Harvard University, Stanford University"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Target Program
                    </label>
                    <Input
                      type="text"
                      value={formData.targetProgram}
                      onChange={(e) =>
                        handleInputChange('targetProgram', e.target.value)
                      }
                      placeholder="e.g., Computer Science, Business Administration, Psychology"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Resume/CV (PDF)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {formData.resume && (
                      <p className="mt-2 text-sm text-green-600">
                        ✓ {formData.resume.name} selected
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <Paragraph className="text-sm text-green-800">
                  💡 <strong>Resume Tip:</strong> Uploading your resume will
                  help generate personalized questions based on your background
                  and experiences. This leads to more realistic interview
                  practice.
                </Paragraph>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between border-t border-gray-200 pt-6">
            <Button
              onClick={step === 1 ? () => router.back() : handleBack}
              variant="outline"
              className="px-6 py-2"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              {loading
                ? 'Creating...'
                : step === 1
                  ? 'Next'
                  : 'Start Interview'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetupPage;
