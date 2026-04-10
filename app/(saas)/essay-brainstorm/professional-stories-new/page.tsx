'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Paragraph, Label } from '@/app/_components/Typography';
import Button from '@/app/_components/Button';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/Select';
import {
  professionalStoriesApi,
  ProfessionalStory as DBProfessionalStory,
} from '@/lib/api-services';
import { useSession } from 'next-auth/react';

const ProfessionalStoriesPage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { speakText, isSpeaking } = useOpenAITTS();
  const { data: session } = useSession();

  // State
  const [stories, setStories] = useState<DBProfessionalStory[]>([]);
  const [currentStory, setCurrentStory] = useState({
    year_of_incident: new Date().getFullYear().toString(),
    what_was_incident: '',
    what_impact: '',
  });
  const [instructionsExpanded, setInstructionsExpanded] =
    useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingField, setRecordingField] = useState<
    'what_was_incident' | 'what_impact' | null
  >(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Ivy's intro message
  const ivyIntroMessage =
    "Now let's capture your professional experiences. Share your work stories, internships, and career insights that demonstrate your growth and skills.";

  // User authentication and data clearing
  const clearAllUserData = () => {
    setStories([]);
    setCurrentStory({
      year_of_incident: new Date().getFullYear().toString(),
      what_was_incident: '',
      what_impact: '',
    });
  };

  // Monitor user authentication changes
  useEffect(() => {
    const userId = session?.user?.id || null;
    if (!userId) {
      clearAllUserData();
      return;
    }

    if (currentUserId && currentUserId !== userId) {
      console.log('User changed in professional stories, clearing data');
      clearAllUserData();
      setCurrentUserId(userId);
      loadStories();
    } else if (!currentUserId) {
      setCurrentUserId(userId);
    }
    return () => {
    };
  }, [session?.user?.id]);

  // Component cleanup
  useEffect(() => {
    return () => {
      clearAllUserData();
    };
  }, []);

  // Load existing stories from database
  const loadStories = async () => {
    try {
      const stories = await professionalStoriesApi.list();
      setStories(stories);
      console.log(
        '✅ Loaded',
        stories.length,
        'professional stories from database'
      );
    } catch (error) {
      console.error(
        '❌ Error loading professional stories from database:',
        error
      );
      addToast('Failed to load stories. Please try again.', { type: 'error' });
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  // Play intro message
  useEffect(() => {
    if (!isSpeaking) {
      speakText(ivyIntroMessage);
    }
  }, []);

  // Voice transcription using OpenAI Whisper
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

      const response = await fetch(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        }
      );

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error('Transcription error:', error);
      addToast('Voice transcription failed', { type: 'error' });
      return '';
    } finally {
      setIsTranscribing(false);
    }
  };

  // Start recording
  const startRecording = async (field: 'what_was_incident' | 'what_impact') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const transcription = await transcribeAudio(audioBlob);

        if (transcription.trim()) {
          setCurrentStory((prev) => ({
            ...prev,
            [field]: transcription,
          }));
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingField(field);
    } catch (err) {
      console.error('Recording error:', err);
      addToast('Microphone access denied', { type: 'error' });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingField(null);
      setMediaRecorder(null);
    }
  };

  // Add story to database
  const addStory = async () => {
    console.log('🔄 Adding professional story...');
    console.log('Experience:', currentStory.what_was_incident);
    console.log('Experience length:', currentStory.what_was_incident.length);
    console.log('Impact:', currentStory.what_impact);
    console.log('Impact length:', currentStory.what_impact.length);

    if (
      !currentStory.what_was_incident.trim() ||
      !currentStory.what_impact.trim()
    ) {
      addToast('Please fill in both the experience and impact', {
        type: 'error',
      });
      console.log('❌ Failed: Empty fields');
      return;
    }

    console.log('✅ Validation passed, proceeding to save...');

    try {
      const storyData = {
        year_of_incident: currentStory.year_of_incident,
        what_was_incident: currentStory.what_was_incident,
        what_impact: currentStory.what_impact,
        is_completed: true,
      };

      const newStory = await professionalStoriesApi.create(storyData);
      setStories((prevStories) => [...prevStories, newStory]);
      console.log('✅ Professional story saved to database!', newStory);

      // Reset form
      setCurrentStory({
        year_of_incident: new Date().getFullYear().toString(),
        what_was_incident: '',
        what_impact: '',
      });

      // Encouraging feedback
      const encouragements = [
        'Excellent! Your professional experiences show real growth and learning.',
        'Great story! This demonstrates valuable skills and insights.',
        'Perfect! This experience will help showcase your professional development.',
        "Wonderful! This shows how you've grown through your work experiences.",
      ];
      const randomEncouragement =
        encouragements[Math.floor(Math.random() * encouragements.length)];
      speakText(randomEncouragement);
      addToast(randomEncouragement, { type: 'success' });
    } catch (error) {
      console.error('❌ Error saving professional story to database:', error);
      addToast('Failed to save story. Please try again.', { type: 'error' });
    }
  };

  const removeStory = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this story? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await professionalStoriesApi.delete(id);
      setStories((prevStories) =>
        prevStories.filter((story) => story.id !== id)
      );
      addToast('Story deleted successfully', { type: 'success' });
      console.log('✅ Professional story deleted from database:', id);
    } catch (error) {
      console.error(
        '❌ Error deleting professional story from database:',
        error
      );
      addToast('Failed to delete story. Please try again.', { type: 'error' });
    }
  };

  const handleContinue = () => {
    if (stories.length === 0) {
      addToast('Please add at least one professional story before continuing', {
        type: 'error',
      });
      return;
    }
    router.push('/essay-brainstorm/goals-new');
  };

  const playInstructions = () => {
    const instructionsText = `Share your work experiences, internships, projects, or any professional activities that showcase your skills and growth.

    Think about leadership roles, challenging projects, team collaborations, or achievements that demonstrate your professional capabilities.

    You can use voice input for natural storytelling - just click the microphone button and speak from experience.

    We recommend adding at least 2-3 professional stories that show different aspects of your capabilities and growth.`;
    speakText(instructionsText);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

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
            <span className="text-sm text-gray-600">Professional Stories</span>
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
                Personal Stories
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                2
              </div>
              <span className="font-medium text-blue-600">Professional</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-600">
                3
              </div>
              <span className="text-gray-500">Goals</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Ivy's Welcome Message */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-lg text-blue-600">💼</span>
            </div>
            <div className="flex-1">
              <Heading
                level={3}
                className="mb-2 text-lg font-semibold text-gray-900"
              >
                Professional Stories
              </Heading>
              <Paragraph className="mb-3 text-sm leading-relaxed text-gray-700">
                Now let's capture your professional experiences. Share your work
                stories, internships, and career insights that demonstrate your
                growth and skills.
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

        {/* Instructions Section */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-sm text-blue-600">📋</span>
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
                  • Share work experiences, internships, projects, or
                  professional activities
                </p>
                <p>
                  • Use voice input for natural storytelling by clicking the
                  microphone button
                </p>
                {!instructionsExpanded && (
                  <p>
                    • Focus on leadership, teamwork, and professional growth...
                  </p>
                )}
              </div>

              {/* Expandable Full Instructions */}
              {instructionsExpanded && (
                <div className="mb-4 space-y-2 border-l-2 border-blue-200 pl-4 text-sm text-gray-700">
                  <p>
                    • <strong>Leadership roles:</strong> Times you led a team,
                    project, or initiative
                  </p>
                  <p>
                    • <strong>Challenging projects:</strong> Difficult
                    assignments that pushed your limits
                  </p>
                  <p>
                    • <strong>Team collaborations:</strong> Working with others
                    toward common goals
                  </p>
                  <p>
                    • <strong>Professional growth:</strong> Skills you developed
                    or lessons you learned
                  </p>
                  <p>
                    • <strong>Quality over quantity:</strong> 2-3 detailed
                    stories showing different capabilities
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

        {/* Stories Added Counter */}
        {stories.length > 0 && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
              <span className="text-green-600">✓</span>
              {stories.length} Professional{' '}
              {stories.length === 1 ? 'Story' : 'Stories'} Added
            </div>
          </div>
        )}

        {/* Current Story Form */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <Heading
            level={3}
            className="mb-6 text-lg font-semibold text-gray-900"
          >
            Professional Story {stories.length + 1}
          </Heading>

          <div className="space-y-6">
            {/* Year of Experience */}
            <div>
              <Label className="mb-3 block text-sm font-medium text-gray-900">
                Year of Experience <span className="text-red-500">*</span>
              </Label>
              <Select
                value={currentStory.year_of_incident}
                onValueChange={(value) =>
                  setCurrentStory((prev) => ({
                    ...prev,
                    year_of_incident: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* What was the professional experience? */}
            <div>
              <Label className="mb-3 block text-sm font-medium text-gray-900">
                What was the professional experience?{' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  placeholder="Describe your work experience, internship, project, or professional activity. Include your role, responsibilities, and the context..."
                  value={currentStory.what_was_incident}
                  onChange={(e) =>
                    setCurrentStory((prev) => ({
                      ...prev,
                      what_was_incident: e.target.value,
                    }))
                  }
                  rows={6}
                  className="min-h-[150px] pr-12"
                />
                <button
                  onClick={() =>
                    isRecording && recordingField === 'what_was_incident'
                      ? stopRecording()
                      : startRecording('what_was_incident')
                  }
                  disabled={
                    isTranscribing ||
                    (isRecording && recordingField !== 'what_was_incident')
                  }
                  className={`absolute right-4 bottom-4 rounded-full p-3 transition-colors ${
                    isRecording && recordingField === 'what_was_incident'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  } ${isTranscribing ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {isRecording && recordingField === 'what_was_incident' ? (
                    <div className="h-5 w-5 rounded-sm bg-white"></div>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                {isTranscribing && recordingField === 'what_was_incident' && (
                  <div className="absolute top-4 right-4 text-sm text-blue-600">
                    Transcribing...
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Minimum 5 lines or 30 seconds of narration. Current:{' '}
                {currentStory.what_was_incident.length} characters
              </div>
            </div>

            {/* What impact did it have on your professional growth? */}
            <div>
              <Label className="mb-3 block text-sm font-medium text-gray-900">
                What impact did it have on your professional growth?{' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  placeholder="Reflect on the skills you gained, lessons learned, or how this experience shaped your professional perspective..."
                  value={currentStory.what_impact}
                  onChange={(e) =>
                    setCurrentStory((prev) => ({
                      ...prev,
                      what_impact: e.target.value,
                    }))
                  }
                  rows={6}
                  className="min-h-[150px] pr-12"
                />
                <button
                  onClick={() =>
                    isRecording && recordingField === 'what_impact'
                      ? stopRecording()
                      : startRecording('what_impact')
                  }
                  disabled={
                    isTranscribing ||
                    (isRecording && recordingField !== 'what_impact')
                  }
                  className={`absolute right-4 bottom-4 rounded-full p-3 transition-colors ${
                    isRecording && recordingField === 'what_impact'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  } ${isTranscribing ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {isRecording && recordingField === 'what_impact' ? (
                    <div className="h-5 w-5 rounded-sm bg-white"></div>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7 4a3 3 0 0 1 6 0v4a3 3 0 1 1-6 0V4zm4 10.93A7.001 7.001 0 0 0 17 8a1 1 0 1 0-2 0A5 5 0 0 1 5 8a1 1 0 0 0-2 0 7.001 7.001 0 0 0 6 6.93V17H6a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                {isTranscribing && recordingField === 'what_impact' && (
                  <div className="absolute top-4 right-4 text-sm text-blue-600">
                    Transcribing...
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Minimum 3 lines of reflection. Current:{' '}
                {currentStory.what_impact.length} characters
              </div>
            </div>
          </div>

          {/* Add Story Button */}
          <div className="mt-8">
            <Button
              variant="primary"
              size="md"
              label="Add Professional Story"
              onClick={() => {
                console.log('🚀 Professional Story button clicked!');
                addStory();
              }}
              disabled={false}
              className="w-full bg-blue-600 py-3 text-white hover:bg-blue-700"
            />
          </div>
        </div>

        {/* Added Stories List */}
        {stories.length > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
            <Heading
              level={3}
              className="mb-4 text-lg font-semibold text-gray-900"
            >
              Your Professional Stories
            </Heading>
            <div className="space-y-4">
              {stories.map((story, index) => (
                <div
                  key={story.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">
                          Professional Story {index + 1}
                        </span>
                        <span className="text-sm text-gray-500">
                          {story.year_of_incident}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-gray-700">
                        {story.what_was_incident}
                      </p>
                    </div>
                    <button
                      onClick={() => removeStory(story.id!)}
                      className="rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                      title="Remove story"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="md"
            label="Add Another Professional Story"
            onClick={() => {
              // Reset form for new story
              setCurrentStory({
                year_of_incident: new Date().getFullYear().toString(),
                what_was_incident: '',
                what_impact: '',
              });
            }}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          />

          <Button
            variant="primary"
            size="lg"
            label="Add Goals →"
            onClick={handleContinue}
            disabled={stories.length === 0}
            className={`rounded-lg px-8 py-3 text-base font-medium transition-all ${
              stories.length === 0
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md'
            }`}
          />
        </div>

        {/* Minimum Stories Helper */}
        {stories.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Add at least one professional story to continue to the next step
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalStoriesPage;
