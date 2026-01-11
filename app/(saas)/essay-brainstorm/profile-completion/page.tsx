'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Paragraph } from '@/app/_components/Typography';
import Button from '@/app/_components/Button';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';

const ProfileCompletionPage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { speakText, isSpeaking } = useOpenAITTS();

  // State for profile completion
  const [instructionsExpanded, setInstructionsExpanded] =
    useState<boolean>(false);
  const [profileData, setProfileData] = useState({
    personal: 0,
    educational: 0,
    professional: 0,
    extracurricular: 0,
    additional: 0,
  });

  // Ivy's intro message
  const ivyIntroMessage =
    "Great! Now let's make sure your profile is complete before we start brainstorming. A complete profile helps me ask better questions and create more personalized essays for you.";

  // Load existing profile data
  useEffect(() => {
    const loadProfileData = () => {
      try {
        const personal = JSON.parse(
          localStorage.getItem('personal-stories') || '[]'
        );
        const professional = JSON.parse(
          localStorage.getItem('professional-stories') || '[]'
        );
        const shortTermGoals = JSON.parse(
          localStorage.getItem('short-term-goals') || '[]'
        );
        const longTermGoals = JSON.parse(
          localStorage.getItem('long-term-goals') || '[]'
        );

        // Calculate completion percentages (mock calculation for demo)
        setProfileData({
          personal:
            personal.length > 0 ? Math.min(personal.length * 20, 100) : 0,
          educational: 75, // Mock data
          professional:
            professional.length > 0
              ? Math.min(professional.length * 25, 100)
              : 0,
          extracurricular: 60, // Mock data
          additional: shortTermGoals.length + longTermGoals.length > 0 ? 85 : 0,
        });
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, []);

  // Play intro message
  useEffect(() => {
    if (!isSpeaking) {
      speakText(ivyIntroMessage);
    }
  }, []);

  const handleContinue = () => {
    router.push('/essay-brainstorm/personal-stories-new');
  };

  const handlePreviewProfile = () => {
    // Navigate to preview profile (would implement later)
    addToast('Profile preview feature coming soon!', { type: 'info' });
  };

  const handleEditProfile = () => {
    // Navigate to edit profile (would implement later)
    addToast('Profile editing feature coming soon!', { type: 'info' });
  };

  const playInstructions = () => {
    const instructionsText = `Profile completion helps me understand you better. We'll collect your personal stories, professional experiences, and goals. You can edit or preview each section before continuing. Don't worry if some sections aren't complete - we can fill them in as we go!`;
    speakText(instructionsText);
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
                <span className="text-xs font-bold text-white">H</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                HelloIvy
              </span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-600">Profile Completion</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Ivy's Intro Message */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-lg text-blue-600">📋</span>
            </div>
            <div className="flex-1">
              <Heading
                level={3}
                className="mb-2 text-lg font-semibold text-gray-900"
              >
                Profile Completion Check
              </Heading>
              <Paragraph className="mb-3 text-sm leading-relaxed text-gray-700">
                Great! Now let's make sure your profile is complete before we
                start brainstorming. A complete profile helps me ask better
                questions and create more personalized essays for you.
              </Paragraph>
              <button
                onClick={() => speakText(ivyIntroMessage)}
                disabled={isSpeaking}
                className="inline-flex items-center gap-2 rounded bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                {isSpeaking ? '🔊 Playing...' : '🔊 Listen to Ivy'}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions Block */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-sm text-blue-600">💡</span>
            </div>
            <div className="flex-1">
              <Heading
                level={3}
                className="mb-3 text-lg font-semibold text-gray-900"
              >
                Instructions
              </Heading>

              {/* Preview Instructions */}
              <div className="mb-4 space-y-2 text-sm text-gray-700">
                <p>
                  Review your profile completion status below. You can edit or
                  preview each section before continuing...
                </p>
              </div>

              {/* Expandable Full Instructions */}
              {instructionsExpanded && (
                <div className="mb-4 space-y-2 border-l-2 border-blue-200 pl-4 text-sm text-gray-700">
                  <p>
                    • <strong>Personal:</strong> Your personal stories and
                    experiences that shaped you
                  </p>
                  <p>
                    • <strong>Educational:</strong> Academic achievements,
                    interests, and goals
                  </p>
                  <p>
                    • <strong>Professional:</strong> Work experience,
                    internships, and career insights
                  </p>
                  <p>
                    • <strong>Extracurricular:</strong> Activities, hobbies, and
                    community involvement
                  </p>
                  <p>
                    • <strong>Additional:</strong> Any other relevant
                    information about you
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setInstructionsExpanded(!instructionsExpanded)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {instructionsExpanded ? 'Read Less ↑' : 'Read More ↓'}
                </button>
                <button
                  onClick={playInstructions}
                  disabled={isSpeaking}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  🔊 Listen
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Completion Dashboard */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <Heading
            level={3}
            className="mb-6 text-lg font-semibold text-gray-900"
          >
            Profile Completion Status
          </Heading>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Personal */}
            <div className="rounded-lg bg-gray-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <span className="text-sm text-purple-600">👤</span>
                  </div>
                  <span className="font-medium text-gray-900">Personal</span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${getCompletionColor(profileData.personal)}`}
                >
                  {profileData.personal}%
                </span>
              </div>
              <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(profileData.personal)}`}
                  style={{ width: `${profileData.personal}%` }}
                ></div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviewProfile}
                  className="rounded-lg bg-blue-100 px-3 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-200"
                >
                  Preview
                </button>
                <button
                  onClick={handleEditProfile}
                  className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-300"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Educational */}
            <div className="rounded-lg bg-gray-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <span className="text-sm text-green-600">🎓</span>
                  </div>
                  <span className="font-medium text-gray-900">Educational</span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${getCompletionColor(profileData.educational)}`}
                >
                  {profileData.educational}%
                </span>
              </div>
              <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(profileData.educational)}`}
                  style={{ width: `${profileData.educational}%` }}
                ></div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviewProfile}
                  className="rounded-lg bg-blue-100 px-3 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-200"
                >
                  Preview
                </button>
                <button
                  onClick={handleEditProfile}
                  className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-300"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Professional */}
            <div className="rounded-lg bg-gray-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm text-blue-600">💼</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    Professional
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${getCompletionColor(profileData.professional)}`}
                >
                  {profileData.professional}%
                </span>
              </div>
              <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(profileData.professional)}`}
                  style={{ width: `${profileData.professional}%` }}
                ></div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviewProfile}
                  className="rounded-lg bg-blue-100 px-3 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-200"
                >
                  Preview
                </button>
                <button
                  onClick={handleEditProfile}
                  className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-300"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Extracurricular */}
            <div className="rounded-lg bg-gray-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                    <span className="text-sm text-orange-600">🎯</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    Extracurricular
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${getCompletionColor(profileData.extracurricular)}`}
                >
                  {profileData.extracurricular}%
                </span>
              </div>
              <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(profileData.extracurricular)}`}
                  style={{ width: `${profileData.extracurricular}%` }}
                ></div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviewProfile}
                  className="rounded-lg bg-blue-100 px-3 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-200"
                >
                  Preview
                </button>
                <button
                  onClick={handleEditProfile}
                  className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-300"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Additional */}
            <div className="rounded-lg bg-gray-50 p-6 md:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <span className="text-sm text-indigo-600">✨</span>
                  </div>
                  <span className="font-medium text-gray-900">Additional</span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${getCompletionColor(profileData.additional)}`}
                >
                  {profileData.additional}%
                </span>
              </div>
              <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(profileData.additional)}`}
                  style={{ width: `${profileData.additional}%` }}
                ></div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviewProfile}
                  className="rounded-lg bg-blue-100 px-3 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-200"
                >
                  Preview
                </button>
                <button
                  onClick={handleEditProfile}
                  className="rounded-lg bg-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-300"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            label="Continue →"
            onClick={handleContinue}
            className="rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          />
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't worry if some sections aren't complete. We can fill them in as
            we go through the brainstorming process!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPage;
