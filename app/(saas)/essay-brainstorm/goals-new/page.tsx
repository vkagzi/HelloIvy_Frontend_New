'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Paragraph, Label } from '@/app/_components/Typography';
import Button from '@/app/_components/Button';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';
import { Textarea } from '@/components/ui/textarea';
import { essayGoalsApi, EssayGoal } from '@/lib/api-services';
import { me } from '@/lib/api-client';

const GoalsPage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { speakText, isSpeaking } = useOpenAITTS();

  // State
  const [goals, setGoals] = useState<EssayGoal[]>([]);
  const [currentGoal, setCurrentGoal] = useState({
    type: 'short-term' as 'short-term' | 'long-term',
    goal: '',
    motivation: '',
  });
  const [instructionsExpanded, setInstructionsExpanded] =
    useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingField, setRecordingField] = useState<
    'goal' | 'motivation' | null
  >(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Ivy's intro message
  const ivyIntroMessage =
    "Perfect! Now let's explore your goals and aspirations. Share both your short-term objectives and long-term dreams - this helps me understand what drives you.";

  // User authentication and data clearing
  const clearAllUserData = () => {
    setGoals([]);
    setCurrentGoal({
      type: 'short-term' as 'short-term' | 'long-term',
      goal: '',
      motivation: '',
    });
  };

  const getCurrentUserId = async (): Promise<string | null> => {
    try {
      const userData = await me();
      return userData.id?.toString() || null;
    } catch {
      return null;
    }
  };

  // Monitor user authentication changes
  useEffect(() => {
    let userCheckInterval: NodeJS.Timeout;

    const checkUserAuth = async () => {
      const userId = await getCurrentUserId();
      if (!userId) {
        clearAllUserData();
        return;
      }

      if (currentUserId && currentUserId !== userId) {
        console.log('User changed in goals page, clearing data');
        clearAllUserData();
        setCurrentUserId(userId);
        loadGoals();
      } else if (!currentUserId) {
        setCurrentUserId(userId);
      }
    };

    userCheckInterval = setInterval(checkUserAuth, 30000);
    return () => {
      if (userCheckInterval) {
        clearInterval(userCheckInterval);
      }
    };
  }, [currentUserId]);

  // Component cleanup
  useEffect(() => {
    return () => {
      clearAllUserData();
    };
  }, []);

  // Load existing goals from database
  const loadGoals = async () => {
    try {
      const goals = await essayGoalsApi.list();
      setGoals(goals);
      console.log('✅ Loaded', goals.length, 'goals from database');
    } catch (error) {
      console.error('❌ Error loading goals from database:', error);
      addToast('Failed to load goals. Please try again.', { type: 'error' });
    }
  };

  useEffect(() => {
    loadGoals();
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
  const startRecording = async (field: 'goal' | 'motivation') => {
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
          setCurrentGoal((prev) => ({
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

  // Add goal to database
  const addGoal = async () => {
    console.log('🎯 Adding goal...');
    console.log('Goal:', currentGoal.goal);
    console.log('Goal length:', currentGoal.goal.length);
    console.log('Motivation:', currentGoal.motivation);
    console.log('Motivation length:', currentGoal.motivation.length);
    console.log('Goal type:', currentGoal.type);

    if (!currentGoal.goal.trim() || !currentGoal.motivation.trim()) {
      addToast('Please fill in both the goal and motivation', {
        type: 'error',
      });
      console.log('❌ Failed: Empty fields');
      return;
    }

    console.log('✅ Validation passed, proceeding to save...');

    try {
      const goalData = {
        type: currentGoal.type,
        goal: currentGoal.goal,
        motivation: currentGoal.motivation,
      };

      const newGoal = await essayGoalsApi.create(goalData);
      setGoals((prevGoals) => [...prevGoals, newGoal]);
      console.log('✅ Goal saved to database!', newGoal);

      // Reset form
      setCurrentGoal({
        type: 'short-term' as 'short-term' | 'long-term',
        goal: '',
        motivation: '',
      });

      // Encouraging feedback
      const encouragements = [
        'Fantastic! Your goals show clear direction and purpose.',
        'Great aspirations! This really shows what motivates you.',
        'Excellent! Your goals demonstrate ambition and thoughtful planning.',
        'Perfect! These goals will help admissions officers understand your drive.',
      ];
      const randomEncouragement =
        encouragements[Math.floor(Math.random() * encouragements.length)];
      speakText(randomEncouragement);
      addToast(randomEncouragement, { type: 'success' });
    } catch (error) {
      console.error('❌ Error saving goal to database:', error);
      addToast('Failed to save goal. Please try again.', { type: 'error' });
    }
  };

  const removeGoal = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this goal? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await essayGoalsApi.delete(id);
      setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== id));
      addToast('Goal deleted successfully', { type: 'success' });
      console.log('✅ Goal deleted from database:', id);
    } catch (error) {
      console.error('❌ Error deleting goal from database:', error);
      addToast('Failed to delete goal. Please try again.', { type: 'error' });
    }
  };

  const handleContinue = () => {
    if (goals.length === 0) {
      addToast('Please add at least one goal before continuing', {
        type: 'error',
      });
      return;
    }
    router.push('/essay-brainstorm/college-selection');
  };

  const playInstructions = () => {
    const instructionsText = `Share your goals and aspirations, both short-term and long-term. This helps me understand what drives you and your future vision.

    Short-term goals: What you want to achieve in the next 1-3 years - internships, skills, projects, or experiences.

    Long-term goals: Your bigger aspirations - career objectives, impact you want to make, or legacy you want to build.

    For each goal, explain why it matters to you and what motivates you to pursue it.

    You can use voice input to speak naturally about your dreams and ambitions.`;
    speakText(instructionsText);
  };

  const shortTermGoals = goals.filter((g) => g.type === 'short-term');
  const longTermGoals = goals.filter((g) => g.type === 'long-term');

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
            <span className="text-sm text-gray-600">Goals & Aspirations</span>
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
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-medium text-white">
                ✓
              </div>
              <span className="font-medium text-green-600">Professional</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                3
              </div>
              <span className="font-medium text-blue-600">Goals</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Ivy's Welcome Message */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-lg text-blue-600">🎯</span>
            </div>
            <div className="flex-1">
              <Heading
                level={3}
                className="mb-2 text-lg font-semibold text-gray-900"
              >
                Goals & Aspirations
              </Heading>
              <Paragraph className="mb-3 text-sm leading-relaxed text-gray-700">
                Perfect! Now let's explore your goals and aspirations. Share
                both your short-term objectives and long-term dreams - this
                helps me understand what drives you.
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
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
                  • Share both short-term goals (1-3 years) and long-term
                  aspirations
                </p>
                <p>
                  • Explain the motivation behind each goal - why it matters to
                  you
                </p>
                {!instructionsExpanded && (
                  <p>
                    • Use voice input for natural expression of your dreams...
                  </p>
                )}
              </div>

              {/* Expandable Full Instructions */}
              {instructionsExpanded && (
                <div className="mb-4 space-y-2 border-l-2 border-blue-200 pl-4 text-sm text-gray-700">
                  <p>
                    • <strong>Short-term goals:</strong> Internships, skills
                    development, specific projects or experiences
                  </p>
                  <p>
                    • <strong>Long-term goals:</strong> Career objectives,
                    impact you want to make, legacy aspirations
                  </p>
                  <p>
                    • <strong>Motivation matters:</strong> Explain why each goal
                    is important to you personally
                  </p>
                  <p>
                    • <strong>Be specific:</strong> Clear, concrete goals are
                    more compelling than vague aspirations
                  </p>
                  <p>
                    • <strong>Show connection:</strong> How do your goals relate
                    to your experiences and values?
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

        {/* Goals Added Counter */}
        {goals.length > 0 && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
              <span className="text-green-600">✓</span>
              {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'} Added
              {shortTermGoals.length > 0 && longTermGoals.length > 0 && (
                <span className="ml-1">
                  ({shortTermGoals.length} short-term, {longTermGoals.length}{' '}
                  long-term)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Current Goal Form */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <Heading
            level={3}
            className="mb-6 text-lg font-semibold text-gray-900"
          >
            Add Your Goal
          </Heading>

          <div className="space-y-6">
            {/* Goal Type */}
            <div>
              <Label className="mb-3 block text-sm font-medium text-gray-900">
                Goal Type <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="goalType"
                    value="short-term"
                    checked={currentGoal.type === 'short-term'}
                    onChange={(e) =>
                      setCurrentGoal((prev) => ({
                        ...prev,
                        type: e.target.value as 'short-term' | 'long-term',
                      }))
                    }
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Short-term (1-3 years)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="goalType"
                    value="long-term"
                    checked={currentGoal.type === 'long-term'}
                    onChange={(e) =>
                      setCurrentGoal((prev) => ({
                        ...prev,
                        type: e.target.value as 'short-term' | 'long-term',
                      }))
                    }
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Long-term (3+ years)
                  </span>
                </label>
              </div>
            </div>

            {/* What is your goal? */}
            <div>
              <Label className="mb-3 block text-sm font-medium text-gray-900">
                What is your goal? <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  placeholder="Describe your goal clearly and specifically. What exactly do you want to achieve?"
                  value={currentGoal.goal}
                  onChange={(e) =>
                    setCurrentGoal((prev) => ({
                      ...prev,
                      goal: e.target.value,
                    }))
                  }
                  rows={4}
                  className="min-h-[100px] pr-12"
                />
                <button
                  onClick={() =>
                    isRecording && recordingField === 'goal'
                      ? stopRecording()
                      : startRecording('goal')
                  }
                  disabled={
                    isTranscribing || (isRecording && recordingField !== 'goal')
                  }
                  className={`absolute right-4 bottom-4 rounded-full p-3 transition-colors ${
                    isRecording && recordingField === 'goal'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  } ${isTranscribing ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {isRecording && recordingField === 'goal' ? (
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
                {isTranscribing && recordingField === 'goal' && (
                  <div className="absolute top-4 right-4 text-sm text-blue-600">
                    Transcribing...
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Minimum 3-4 lines. Current: {currentGoal.goal.length} characters
              </div>
            </div>

            {/* Why is this goal important to you? */}
            <div>
              <Label className="mb-3 block text-sm font-medium text-gray-900">
                Why is this goal important to you?{' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  placeholder="Share what motivates you to pursue this goal. What personal meaning does it have? How does it connect to your values or experiences?"
                  value={currentGoal.motivation}
                  onChange={(e) =>
                    setCurrentGoal((prev) => ({
                      ...prev,
                      motivation: e.target.value,
                    }))
                  }
                  rows={5}
                  className="min-h-[120px] pr-12"
                />
                <button
                  onClick={() =>
                    isRecording && recordingField === 'motivation'
                      ? stopRecording()
                      : startRecording('motivation')
                  }
                  disabled={
                    isTranscribing ||
                    (isRecording && recordingField !== 'motivation')
                  }
                  className={`absolute right-4 bottom-4 rounded-full p-3 transition-colors ${
                    isRecording && recordingField === 'motivation'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  } ${isTranscribing ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {isRecording && recordingField === 'motivation' ? (
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
                {isTranscribing && recordingField === 'motivation' && (
                  <div className="absolute top-4 right-4 text-sm text-blue-600">
                    Transcribing...
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Minimum 4-5 lines of motivation. Current:{' '}
                {currentGoal.motivation.length} characters
              </div>
            </div>
          </div>

          {/* Add Goal Button */}
          <div className="mt-8">
            <Button
              variant="primary"
              size="md"
              label="Add Goal"
              onClick={() => {
                console.log('🚀 Goals button clicked!');
                addGoal();
              }}
              disabled={false}
              className="w-full bg-blue-600 py-3 text-white hover:bg-blue-700"
            />
          </div>
        </div>

        {/* Added Goals List */}
        {goals.length > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
            <Heading
              level={3}
              className="mb-4 text-lg font-semibold text-gray-900"
            >
              Your Goals
            </Heading>

            {/* Short-term Goals */}
            {shortTermGoals.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md mb-3 font-medium text-gray-800">
                  Short-term Goals (1-3 years)
                </h4>
                <div className="space-y-3">
                  {shortTermGoals.map((goal, index) => (
                    <div
                      key={goal.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">
                              Short-term Goal {index + 1}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm text-gray-700">
                            {goal.goal}
                          </p>
                        </div>
                        <button
                          onClick={() => removeGoal(goal.id!)}
                          className="rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                          title="Remove goal"
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

            {/* Long-term Goals */}
            {longTermGoals.length > 0 && (
              <div>
                <h4 className="text-md mb-3 font-medium text-gray-800">
                  Long-term Goals (3+ years)
                </h4>
                <div className="space-y-3">
                  {longTermGoals.map((goal, index) => (
                    <div
                      key={goal.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">
                              Long-term Goal {index + 1}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm text-gray-700">
                            {goal.goal}
                          </p>
                        </div>
                        <button
                          onClick={() => removeGoal(goal.id!)}
                          className="rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                          title="Remove goal"
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
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="md"
            label="Add Another Goal"
            onClick={() => {
              // Reset form for new goal
              setCurrentGoal({
                type: 'short-term',
                goal: '',
                motivation: '',
              });
            }}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          />

          <Button
            variant="primary"
            size="lg"
            label="Continue to College Selection →"
            onClick={handleContinue}
            disabled={goals.length === 0}
            className={`rounded-lg px-8 py-3 text-base font-medium transition-all ${
              goals.length === 0
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md'
            }`}
          />
        </div>

        {/* Minimum Goals Helper */}
        {goals.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Add at least one goal to continue to the brainstorming
              conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsPage;
