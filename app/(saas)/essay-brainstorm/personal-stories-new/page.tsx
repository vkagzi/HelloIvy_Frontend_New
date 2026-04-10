'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Paragraph, Label } from '@/app/_components/Typography';
import Button from '@/app/_components/Button';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';
import { Input } from '@/app/_components/Input';
import { Textarea } from '@/components/ui/textarea';
import {
  personalStoriesApi,
  PersonalStory as DBPersonalStory,
} from '@/lib/api-services';
import { useSession } from 'next-auth/react';

const PersonalStoriesPage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { speakText, isSpeaking } = useOpenAITTS();
  const { data: session } = useSession();

  // State
  const [stories, setStories] = useState<DBPersonalStory[]>([]);
  const [currentStory, setCurrentStory] = useState({
    year_of_incident: new Date().getFullYear().toString(),
    what_was_incident: '',
    what_impact: '',
  });
  const [isLoading, setIsLoading] = useState(false);
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
    "Let's begin with your personal stories. Speak from the heart - it's your journey we want to highlight. Share experiences that shaped who you are today.";

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
      console.log('User changed in personal stories, clearing data');
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

  // Load stories from database on component mount
  useEffect(() => {
    loadStories();
  }, []);

  // Load existing stories from database
  const loadStories = async () => {
    setIsLoading(true);
    try {
      const stories = await personalStoriesApi.list();
      setStories(stories);
      console.log(
        '✅ Loaded',
        stories.length,
        'personal stories from database'
      );
    } catch (error) {
      console.error('❌ Error loading personal stories from database:', error);
      addToast('Failed to load stories. Please try again.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load stories on component mount
  useEffect(() => {
    loadStories();
  }, []);

  // Save story to database
  const saveStory = async () => {
    if (
      !currentStory.what_was_incident.trim() ||
      !currentStory.what_impact.trim()
    ) {
      addToast('Please fill in both the incident and impact fields', {
        type: 'error',
      });
      return;
    }

    try {
      const storyData = {
        year_of_incident: currentStory.year_of_incident,
        what_was_incident: currentStory.what_was_incident,
        what_impact: currentStory.what_impact,
        is_completed: true,
      };

      const newStory = await personalStoriesApi.create(storyData);
      setStories((prevStories) => [...prevStories, newStory]);

      setCurrentStory({
        year_of_incident: new Date().getFullYear().toString(),
        what_was_incident: '',
        what_impact: '',
      });

      addToast('Personal story saved successfully!', { type: 'success' });
      console.log('✅ Personal story saved to database:', newStory);
    } catch (error) {
      console.error('❌ Error saving personal story to database:', error);
      addToast('Failed to save story. Please try again.', { type: 'error' });
    }
  };

  // Delete story from database
  const deleteStory = async (storyId: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this story? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await personalStoriesApi.delete(storyId);
      setStories((prevStories) =>
        prevStories.filter((story) => story.id !== storyId)
      );
      addToast('Story deleted successfully', { type: 'success' });
      console.log('✅ Personal story deleted from database:', storyId);
    } catch (error) {
      console.error('❌ Error deleting personal story from database:', error);
      addToast('Failed to delete story. Please try again.', { type: 'error' });
    }
  };

  // Voice recording functionality
  const startRecording = async (field: 'what_was_incident' | 'what_impact') => {
    try {
      setRecordingField(field);
      setIsRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await transcribeAudio(audioBlob, field);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
    } catch (error) {
      console.error('Error starting recording:', error);
      addToast('Failed to start recording', { type: 'error' });
      setIsRecording(false);
      setRecordingField(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setRecordingField(null);
  };

  const transcribeAudio = async (
    audioBlob: Blob,
    field: 'what_was_incident' | 'what_impact'
  ) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const transcription = data.text || '';

        setCurrentStory((prev) => ({
          ...prev,
          [field]: prev[field] + (prev[field] ? ' ' : '') + transcription,
        }));

        addToast('Voice transcribed successfully!', { type: 'success' });
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      addToast('Failed to transcribe audio', { type: 'error' });
    } finally {
      setIsTranscribing(false);
    }
  };

  // TTS for intro message
  useEffect(() => {
    if (!isSpeaking) {
      speakText(ivyIntroMessage);
    }
  }, []);

  const handleContinue = () => {
    router.push('/essay-brainstorm/professional-stories-new');
  };

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
              </svg>
            </div>
            <Label className="font-medium text-blue-600">hellolvy</Label>
            <div className="ml-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <Label className="font-semibold text-gray-900">
                New Essay Brainstorming
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-medium text-white">
                A
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl p-8">
        {/* Instructions */}
        <div className="mb-8">
          <Heading
            level={4}
            className="mb-4 text-base font-semibold text-gray-900"
          >
            Instructions
          </Heading>
          <div className="mb-4 space-y-2 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="text-gray-500">1.</span>
              <span>
                Treat this as a space to get your thoughts flowing honestly and
                naturally.
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500">2.</span>
              <span>
                If using voice input just make sure you're in a quiet place with
                good internet connection...
              </span>
            </div>
            {instructionsExpanded && (
              <>
                <div className="flex gap-2">
                  <span className="text-gray-500">3.</span>
                  <span>
                    Share personal experiences that shaped who you are -
                    challenges you overcame, moments of growth, or times when
                    you learned something important about yourself.
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500">4.</span>
                  <span>
                    Focus on the impact these experiences had on you - how they
                    changed your perspective, values, or goals.
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              label={instructionsExpanded ? 'Read less' : 'Read more'}
              className="h-auto p-0 text-left text-blue-600"
              onClick={() => setInstructionsExpanded(!instructionsExpanded)}
            />
            <Button
              variant="ghost"
              size="sm"
              label="Listen"
              className="border-orange-200 px-4 py-1 text-orange-600 hover:bg-orange-50"
              onClick={() => speakText(ivyIntroMessage)}
            />
          </div>
        </div>

        {/* Ivy Message */}
        <div className="relative mb-8 rounded-2xl border border-purple-200 bg-gradient-to-r from-blue-100 to-purple-100 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-lg font-bold text-white">
                🌟
              </div>
            </div>

            <div className="flex-1">
              <Paragraph className="text-base text-gray-800">
                {ivyIntroMessage}
              </Paragraph>
            </div>

            <Button
              variant="ghost"
              size="sm"
              label="🔊"
              className="p-2 text-purple-600 hover:bg-purple-50"
              onClick={() => speakText(ivyIntroMessage)}
            />
          </div>
        </div>

        {/* Story Form */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
          <Heading
            level={3}
            className="mb-6 text-xl font-semibold text-gray-900"
          >
            Share Your Personal Story
          </Heading>

          <div className="space-y-6">
            {/* Year Input */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-900">
                Year of Experience
              </Label>
              <Input
                type="number"
                value={currentStory.year_of_incident}
                onChange={(e) =>
                  setCurrentStory((prev) => ({
                    ...prev,
                    year_of_incident: e.target.value,
                  }))
                }
                placeholder="2023"
                min={1950}
                max={new Date().getFullYear()}
              />
            </div>

            {/* Incident Input */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-900">
                What was the experience/incident? *
              </Label>
              <div className="relative">
                <Textarea
                  value={currentStory.what_was_incident}
                  onChange={(e) =>
                    setCurrentStory((prev) => ({
                      ...prev,
                      what_was_incident: e.target.value,
                    }))
                  }
                  placeholder="Describe the specific experience or incident that was significant to you..."
                  rows={4}
                  className="min-h-[100px] pr-12"
                />
                <button
                  onClick={() =>
                    isRecording && recordingField === 'what_was_incident'
                      ? stopRecording()
                      : startRecording('what_was_incident')
                  }
                  disabled={isTranscribing}
                  className={`absolute right-4 bottom-4 rounded-full p-2 transition-colors ${
                    isRecording && recordingField === 'what_was_incident'
                      ? 'bg-red-500 text-white'
                      : 'bg-orange-50 text-orange-500 hover:text-orange-600'
                  }`}
                >
                  {isRecording && recordingField === 'what_was_incident' ? (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <rect x="6" y="6" width="8" height="8" />
                    </svg>
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
              </div>
              {isTranscribing && recordingField === 'what_was_incident' && (
                <div className="mt-2 text-sm text-gray-500">
                  Transcribing audio...
                </div>
              )}
            </div>

            {/* Impact Input */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-900">
                What impact did it have on you? *
              </Label>
              <div className="relative">
                <Textarea
                  value={currentStory.what_impact}
                  onChange={(e) =>
                    setCurrentStory((prev) => ({
                      ...prev,
                      what_impact: e.target.value,
                    }))
                  }
                  placeholder="Reflect on how this experience changed you - what did you learn? How did it shape your perspective? What growth did you experience?"
                  rows={4}
                  className="min-h-[100px] pr-12"
                />
                <button
                  onClick={() =>
                    isRecording && recordingField === 'what_impact'
                      ? stopRecording()
                      : startRecording('what_impact')
                  }
                  disabled={isTranscribing}
                  className={`absolute right-4 bottom-4 rounded-full p-2 transition-colors ${
                    isRecording && recordingField === 'what_impact'
                      ? 'bg-red-500 text-white'
                      : 'bg-orange-50 text-orange-500 hover:text-orange-600'
                  }`}
                >
                  {isRecording && recordingField === 'what_impact' ? (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <rect x="6" y="6" width="8" height="8" />
                    </svg>
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
              </div>
              {isTranscribing && recordingField === 'what_impact' && (
                <div className="mt-2 text-sm text-gray-500">
                  Transcribing audio...
                </div>
              )}
            </div>

            {/* Add Personal Story Button */}
            <div className="pt-4">
              <Button
                variant="primary"
                size="md"
                label="Add Personal Story"
                onClick={saveStory}
                className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 text-white hover:from-blue-600 hover:to-purple-700"
              />
            </div>
          </div>
        </div>

        {/* Saved Stories */}
        {stories.length > 0 && (
          <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
            <Heading
              level={3}
              className="mb-6 text-lg font-semibold text-gray-900"
            >
              Your Personal Stories
            </Heading>

            <div className="space-y-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Story {story.year_of_incident}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {story.created_at
                          ? new Date(story.created_at).toLocaleDateString()
                          : ''}
                      </span>
                      <button
                        onClick={() => deleteStory(story.id!)}
                        className="rounded-full p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                        title="Delete story"
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
                  <div className="mb-2 text-sm text-gray-700">
                    <strong>Experience:</strong>{' '}
                    {story.what_was_incident.substring(0, 100)}...
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Impact:</strong>{' '}
                    {story.what_impact.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            label="Continue to Professional Stories →"
            onClick={handleContinue}
            className="bg-blue-500 px-6 text-white hover:bg-blue-600"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalStoriesPage;
