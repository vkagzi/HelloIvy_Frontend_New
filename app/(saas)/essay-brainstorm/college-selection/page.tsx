'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Paragraph } from '@/app/_components/Typography';
import Button from '@/app/_components/Button';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';
import { Input } from '@/app/_components/Input';
import { Textarea } from '@/components/ui/textarea';
import {
  collegeEssayApi,
  CollegeEssayData,
} from '@/lib/api-services';

const CollegeSelectionPage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { speakText, isSpeaking } = useOpenAITTS();

  // State
  const [formData, setFormData] = useState<CollegeEssayData>({
    collegeName: '',
    essayTopic: '',
    major: '',
    wordLimit: 650,
    additionalRequirements: '',
  });
  const [existingDataId, setExistingDataId] = useState<number | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [instructionsExpanded, setInstructionsExpanded] =
    useState<boolean>(false);

  // Ivy's intro message
  const ivyIntroMessage =
    "Perfect! Now let's get specific about your college essay. I need to know which college you're applying to and what essay prompt you're working on so I can ask you the most relevant questions.";

  // Validation
  useEffect(() => {
    const isFormValid =
      formData.collegeName.trim() !== '' &&
      formData.essayTopic.trim() !== '' &&
      formData.major.trim() !== '' &&
      formData.wordLimit > 0;
    setIsValid(isFormValid);
  }, [formData]);

  // Load existing college data if any
  useEffect(() => {
    loadExistingData();
  }, []);

  // Play intro message on load
  useEffect(() => {
    if (!isSpeaking) {
      speakText(ivyIntroMessage);
    }
  }, []);

  const loadExistingData = async () => {
    try {
      const collegeDataList = await collegeEssayApi.list();
      if (collegeDataList.length > 0) {
        // Load the most recent college data for editing
        const latestData = collegeDataList[collegeDataList.length - 1];
        setFormData({
          collegeName: latestData.collegeName,
          essayTopic: latestData.essayTopic,
          major: latestData.major,
          wordLimit: latestData.wordLimit,
          additionalRequirements: latestData.additionalRequirements || '',
        });
        setExistingDataId(latestData.id!);
        console.log('✅ Loaded existing college data for editing:', latestData);
      }
    } catch (error) {
      console.error('❌ Error loading existing college data:', error);
    }
  };

  const handleInputChange = (
    field: keyof CollegeEssayData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContinue = async () => {
    if (!isValid) {
      addToast('Please fill in all required fields', { type: 'error' });
      return;
    }

    try {
      if (existingDataId) {
        // Update existing college essay data
        await collegeEssayApi.update(existingDataId, formData);
        console.log('✅ College essay data updated in database:', formData);
        addToast('College essay information updated successfully!', {
          type: 'success',
        });
      } else {
        // Create new college essay data
        await collegeEssayApi.create(formData);
        console.log('✅ College essay data saved to database:', formData);
        addToast('College essay information saved successfully!', {
          type: 'success',
        });
      }

      // Navigate to confirmation page
      router.push('/essay-brainstorm/confirmation');
    } catch (error) {
      console.error('❌ Error saving college essay data to database:', error);
      addToast('Failed to save college essay information. Please try again.', {
        type: 'error',
      });
    }
  };

  const playInstructions = () => {
    const instructionsText = `I need some specific details about your college application. First, tell me which college you're applying to. Then paste or type the exact essay prompt you need to respond to. Include your intended major and the word limit. This helps me ask questions that are perfectly tailored to what admissions officers at that specific school want to see.`;
    speakText(instructionsText);
  };

  const commonColleges = [
    'Harvard University',
    'Stanford University',
    'MIT',
    'Yale University',
    'Princeton University',
    'Columbia University',
    'University of Pennsylvania',
    'Brown University',
    'Dartmouth College',
    'Cornell University',
    'Northwestern University',
    'University of Chicago',
    'Duke University',
    'Vanderbilt University',
    'Rice University',
    'Johns Hopkins University',
    'Georgetown University',
  ];

  const commonMajors = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Biology/Pre-Med',
    'Psychology',
    'Economics',
    'Political Science',
    'English/Literature',
    'Mathematics',
    'Physics',
    'Chemistry',
    'History',
    'International Relations',
    'Philosophy',
    'Art/Fine Arts',
    'Communications',
    'Environmental Science',
    'Neuroscience',
  ];

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
            <span className="text-sm text-gray-600">
              College & Essay Details
            </span>
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-medium text-white">
                ✓
              </div>
              <span className="font-medium text-green-600">
                Stories & Goals
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                📚
              </div>
              <span className="font-medium text-blue-600">College & Essay</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-white">
                💬
              </div>
              <span className="font-medium text-gray-500">Brainstorming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-white">
                📝
              </div>
              <span className="font-medium text-gray-500">Essay Structure</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Ivy's Intro Message */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-lg text-blue-600">🎓</span>
            </div>
            <div className="flex-1">
              <Heading
                level={3}
                className="mb-2 text-lg font-semibold text-gray-900"
              >
                College & Essay Details
              </Heading>
              <Paragraph className="mb-3 text-sm leading-relaxed text-gray-700">
                Perfect! Now let's get specific about your college essay. I need
                to know which college you're applying to and what essay prompt
                you're working on so I can ask you the most relevant questions.
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

              <div className="mb-4 space-y-2 text-sm text-gray-700">
                <p>
                  Fill in the details about your specific college application
                  and essay requirements...
                </p>
              </div>

              {instructionsExpanded && (
                <div className="mb-4 space-y-2 border-l-2 border-blue-200 pl-4 text-sm text-gray-700">
                  <p>
                    • <strong>College Name:</strong> The specific institution
                    you're applying to
                  </p>
                  <p>
                    • <strong>Essay Topic:</strong> Copy and paste the exact
                    prompt or question
                  </p>
                  <p>
                    • <strong>Major:</strong> Your intended field of study
                  </p>
                  <p>
                    • <strong>Word Limit:</strong> Maximum number of words
                    allowed
                  </p>
                  <p>
                    • <strong>Additional Requirements:</strong> Any special
                    instructions or context
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

        {/* Form */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="space-y-6">
            {/* College Name */}
            <div>
              <label
                htmlFor="collegeName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                College/University Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                id="collegeName"
                value={formData.collegeName}
                onChange={(e) =>
                  handleInputChange('collegeName', e.target.value)
                }
                placeholder="e.g., Harvard University, Stanford University"
              />
              <div className="mt-2">
                <p className="mb-2 text-xs text-gray-500">Popular choices:</p>
                <div className="flex flex-wrap gap-1">
                  {commonColleges.slice(0, 6).map((college) => (
                    <button
                      key={college}
                      onClick={() => handleInputChange('collegeName', college)}
                      className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200"
                    >
                      {college}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Essay Topic */}
            <div>
              <label
                htmlFor="essayTopic"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Essay Prompt/Topic <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="essayTopic"
                value={formData.essayTopic}
                onChange={(e) =>
                  handleInputChange('essayTopic', e.target.value)
                }
                placeholder="Copy and paste the exact essay prompt or question from your application..."
                rows={4}
                className="min-h-[100px]"
              />
            </div>

            {/* Major */}
            <div>
              <label
                htmlFor="major"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Intended Major <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                id="major"
                value={formData.major}
                onChange={(e) => handleInputChange('major', e.target.value)}
                placeholder="e.g., Computer Science, Biology, Business Administration"
              />
              <div className="mt-2">
                <p className="mb-2 text-xs text-gray-500">Common majors:</p>
                <div className="flex flex-wrap gap-1">
                  {commonMajors.slice(0, 8).map((major) => (
                    <button
                      key={major}
                      onClick={() => handleInputChange('major', major)}
                      className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200"
                    >
                      {major}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Word Limit */}
            <div>
              <label
                htmlFor="wordLimit"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Word Limit <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                id="wordLimit"
                value={formData.wordLimit}
                onChange={(e) =>
                  handleInputChange('wordLimit', parseInt(e.target.value) || 0)
                }
                placeholder="650"
                min={50}
                max={2000}
              />
              <p className="mt-1 text-xs text-gray-500">
                Common limits: 250, 500, 650 words
              </p>
            </div>

            {/* Additional Requirements */}
            <div>
              <label
                htmlFor="additionalRequirements"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Additional Requirements (Optional)
              </label>
              <Textarea
                id="additionalRequirements"
                value={formData.additionalRequirements}
                onChange={(e) =>
                  handleInputChange('additionalRequirements', e.target.value)
                }
                placeholder="Any special instructions, formatting requirements, or additional context..."
                rows={3}
                className="min-h-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            label="Start Brainstorming →"
            onClick={handleContinue}
            disabled={!isValid}
            className={`rounded-lg px-8 py-3 text-base font-medium shadow-sm transition-all hover:shadow-md ${
              isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'cursor-not-allowed bg-gray-300 text-gray-500'
            }`}
          />
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            The more specific you are, the better I can tailor my questions to
            help you create a compelling essay.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollegeSelectionPage;
