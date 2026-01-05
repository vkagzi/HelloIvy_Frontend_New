'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Heading, Paragraph } from '../../../../_components/Typography';
import Button from '../../../../_components/Button';
import { useToast } from '../../../../_components/Toast';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../../lib/api';
import { Textarea } from '@/components/ui/textarea';

interface Question {
  question: string;
  category: string;
  interview_type: string;
}

interface Response {
  id: number;
  question: string;
  response: string;
  feedback: string;
  score: number;
  created_at: string;
}

const InterviewSessionPage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id as string;

  // State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [sessionResponses, setSessionResponses] = useState<Response[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');

  // Refs
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (sessionId) {
      fetchNewQuestion();
      fetchSessionResponses();
    }
  }, [sessionId]);

  const fetchNewQuestion = async () => {
    try {
      const data = await api<Question>(
        `/api/interview-prep/question/${sessionId}/`
      );
      setCurrentQuestion(data);
      setUserResponse('');
      setFeedback(null);
      setScore(null);
      setShowFeedback(false);
    } catch (error) {
      console.error('Error fetching question:', error);
      addToast('Failed to fetch question', { type: 'error' });
    }
  };

  const fetchSessionResponses = async () => {
    try {
      const data = await api<{ responses: Response[] }>(
        `/api/interview-prep/responses/${sessionId}/`
      );
      setSessionResponses(data.responses);
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.addEventListener('dataavailable', (event) => {
        audioChunks.current.push(event.data);
      });

      mediaRecorder.current.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
      });

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      addToast('Failed to start recording', { type: 'error' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/interview-prep/transcribe/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUserResponse(data.transcription);
      } else {
        addToast('Failed to transcribe audio', { type: 'error' });
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      addToast('Failed to transcribe audio', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!userResponse.trim() || !currentQuestion) {
      addToast('Please provide a response', { type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await api<{ feedback: string; score: number }>(
        '/api/interview-prep/save-response/',
        {
          method: 'POST',
          body: {
            session_id: sessionId,
            question: currentQuestion.question,
            response: userResponse,
          },
        }
      );

      setFeedback(data.feedback);
      setScore(data.score);
      setShowFeedback(true);

      // Refresh session responses
      fetchSessionResponses();

      addToast('Response submitted successfully!', { type: 'success' });
    } catch (error) {
      console.error('Error submitting response:', error);
      addToast('Failed to submit response', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const averageScore =
    sessionResponses.length > 0
      ? sessionResponses.reduce((sum, r) => sum + (r.score || 0), 0) /
        sessionResponses.length
      : 0;

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-2xl font-bold text-gray-900">
                Interview Practice Session
              </Heading>
              <Paragraph className="text-gray-600">
                {currentQuestion?.interview_type} • {sessionResponses.length}{' '}
                responses completed
              </Paragraph>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Average Score</div>
              <div
                className={`text-2xl font-bold ${getScoreColor(averageScore).split(' ')[0]}`}
              >
                {averageScore.toFixed(1)}/10
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Interview Panel */}
          <div className="space-y-6 lg:col-span-2">
            {/* Current Question */}
            {currentQuestion && (
              <div className="rounded-2xl bg-white p-8 shadow-xl">
                <div className="mb-6">
                  <div className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    {currentQuestion.category}
                  </div>
                  <Heading level={2} className="mb-4 text-xl font-semibold">
                    {currentQuestion.question}
                  </Heading>
                </div>

                {/* Input Mode Toggle */}
                <div className="mb-6 flex justify-center">
                  <div className="flex rounded-lg bg-gray-100 p-1">
                    <button
                      onClick={() => setInputMode('text')}
                      className={`rounded-md px-4 py-2 font-medium transition-all ${
                        inputMode === 'text'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      💬 Text
                    </button>
                    <button
                      onClick={() => setInputMode('voice')}
                      className={`rounded-md px-4 py-2 font-medium transition-all ${
                        inputMode === 'voice'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      🎤 Voice
                    </button>
                  </div>
                </div>

                {/* Response Input */}
                {inputMode === 'text' ? (
                  <div className="mb-6">
                    <Textarea
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      placeholder="Type your response here..."
                      rows={6}
                      className="min-h-[150px]"
                    />
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="py-8 text-center">
                      {isRecording ? (
                        <div className="space-y-4">
                          <div className="animate-pulse">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
                              <span className="text-2xl text-white">🎤</span>
                            </div>
                          </div>
                          <Paragraph>Recording... Click to stop</Paragraph>
                          <Button
                            onClick={stopRecording}
                            className="bg-red-500 text-white hover:bg-red-600"
                          >
                            Stop Recording
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div
                            className="mx-auto flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-blue-500 transition-colors hover:bg-blue-600"
                            onClick={startRecording}
                          >
                            <span className="text-2xl text-white">🎤</span>
                          </div>
                          <Paragraph>
                            Click the microphone to start recording
                          </Paragraph>
                        </div>
                      )}
                    </div>

                    {userResponse && (
                      <div className="mt-4 rounded-xl bg-gray-50 p-4">
                        <Paragraph className="mb-2 text-sm text-gray-600">
                          Transcription:
                        </Paragraph>
                        <Paragraph>{userResponse}</Paragraph>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Button
                    onClick={fetchNewQuestion}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Skip Question
                  </Button>

                  <div className="space-x-3">
                    {showFeedback && (
                      <Button
                        onClick={fetchNewQuestion}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        Next Question
                      </Button>
                    )}
                    <Button
                      onClick={submitResponse}
                      disabled={isLoading || !userResponse.trim()}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {isLoading ? 'Processing...' : 'Submit Answer'}
                    </Button>
                  </div>
                </div>

                {/* Feedback Display */}
                {showFeedback && feedback && score !== null && (
                  <div className="mt-6 rounded-xl bg-gray-50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <Heading level={3} className="text-lg font-semibold">
                        AI Feedback
                      </Heading>
                      <div
                        className={`rounded-full px-3 py-1 text-sm font-medium ${getScoreColor(score)}`}
                      >
                        Score: {score}/10
                      </div>
                    </div>
                    <Paragraph className="whitespace-pre-wrap text-gray-700">
                      {feedback}
                    </Paragraph>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Stats */}
            <div className="rounded-2xl bg-white p-6 shadow-xl">
              <Heading level={3} className="mb-4 text-lg font-semibold">
                Session Progress
              </Heading>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions Answered:</span>
                  <span className="font-medium">{sessionResponses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Score:</span>
                  <span
                    className={`font-medium ${getScoreColor(averageScore).split(' ')[0]}`}
                  >
                    {averageScore.toFixed(1)}/10
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <Button
                  onClick={() =>
                    router.push(`/interview-prep/results/${sessionId}`)
                  }
                  variant="outline"
                  className="w-full"
                >
                  View Results
                </Button>
              </div>
            </div>

            {/* Recent Responses */}
            <div className="rounded-2xl bg-white p-6 shadow-xl">
              <Heading level={3} className="mb-4 text-lg font-semibold">
                Recent Responses
              </Heading>

              <div className="max-h-80 space-y-3 overflow-y-auto">
                {sessionResponses
                  .slice(-5)
                  .reverse()
                  .map((response) => (
                    <div
                      key={response.id}
                      className="rounded-lg bg-gray-50 p-3"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <Paragraph className="line-clamp-2 text-sm font-medium text-gray-800">
                          {response.question}
                        </Paragraph>
                        <div
                          className={`rounded px-2 py-1 text-xs font-medium ${getScoreColor(response.score || 0)}`}
                        >
                          {response.score}/10
                        </div>
                      </div>
                      <Paragraph className="line-clamp-2 text-xs text-gray-600">
                        {response.response}
                      </Paragraph>
                    </div>
                  ))}

                {sessionResponses.length === 0 && (
                  <Paragraph className="py-4 text-center text-gray-500">
                    No responses yet. Start answering questions!
                  </Paragraph>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSessionPage;
