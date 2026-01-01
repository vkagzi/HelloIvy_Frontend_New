'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Paragraph, Label } from '../../../_components/Typography';
import Button from '../../../_components/Button';
import { useToast } from '../../../_components/Toast';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '../../../_hooks/useOpenAITTS';
import {
  personalStoriesApi,
  professionalStoriesApi,
  essayGoalsApi,
  collegeEssayApi,
  PersonalStory as DBPersonalStory,
  ProfessionalStory as DBProfessionalStory,
  EssayGoal,
  CollegeEssayData,
  sessionManagementApi,
} from '../../../../lib/api-services';

const ConfirmationPage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { speakText, isSpeaking } = useOpenAITTS();

  // Formatting functions
  const formatCollegeName = (name: string): string => {
    if (!name) return name;

    // Common college name mappings
    const collegeNameMap: { [key: string]: string } = {
      stanford: 'Stanford University',
      harvard: 'Harvard University',
      mit: 'Massachusetts Institute of Technology (MIT)',
      yale: 'Yale University',
      princeton: 'Princeton University',
      columbia: 'Columbia University',
      upenn: 'University of Pennsylvania',
      penn: 'University of Pennsylvania',
      brown: 'Brown University',
      dartmouth: 'Dartmouth College',
      cornell: 'Cornell University',
      northwestern: 'Northwestern University',
      uchicago: 'University of Chicago',
      duke: 'Duke University',
      vanderbilt: 'Vanderbilt University',
      rice: 'Rice University',
      'johns hopkins': 'Johns Hopkins University',
      georgetown: 'Georgetown University',
      berkeley: 'University of California, Berkeley',
      ucla: 'University of California, Los Angeles',
      usc: 'University of Southern California',
      nyu: 'New York University',
      'carnegie mellon': 'Carnegie Mellon University',
      cmu: 'Carnegie Mellon University',
    };

    const lowerName = name.toLowerCase().trim();
    if (collegeNameMap[lowerName]) {
      return collegeNameMap[lowerName];
    }

    // If not in map, apply title case formatting
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatMajorName = (major: string): string => {
    if (!major) return major;

    // Common major name mappings
    const majorNameMap: { [key: string]: string } = {
      'computer science': 'Computer Science',
      cs: 'Computer Science',
      engineering: 'Engineering',
      business: 'Business Administration',
      'business administration': 'Business Administration',
      biology: 'Biology',
      bio: 'Biology',
      premed: 'Pre-Medical Studies',
      'pre-med': 'Pre-Medical Studies',
      psychology: 'Psychology',
      economics: 'Economics',
      econ: 'Economics',
      'political science': 'Political Science',
      english: 'English Literature',
      mathematics: 'Mathematics',
      math: 'Mathematics',
      physics: 'Physics',
      chemistry: 'Chemistry',
      history: 'History',
      'international relations': 'International Relations',
      philosophy: 'Philosophy',
      art: 'Fine Arts',
      communications: 'Communications',
      'environmental science': 'Environmental Science',
      neuroscience: 'Neuroscience',
      'mechanical engineering': 'Mechanical Engineering',
      'electrical engineering': 'Electrical Engineering',
      'chemical engineering': 'Chemical Engineering',
      'civil engineering': 'Civil Engineering',
      'biomedical engineering': 'Biomedical Engineering',
    };

    const lowerMajor = major.toLowerCase().trim();
    if (majorNameMap[lowerMajor]) {
      return majorNameMap[lowerMajor];
    }

    // If not in map, apply title case formatting
    return major
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // State
  const [personalStories, setPersonalStories] = useState<DBPersonalStory[]>([]);
  const [professionalStories, setProfessionalStories] = useState<
    DBProfessionalStory[]
  >([]);
  const [goals, setGoals] = useState<EssayGoal[]>([]);
  const [collegeData, setCollegeData] = useState<CollegeEssayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clearAfterSession, setClearAfterSession] = useState(true); // Default to clearing after session

  // Ivy's intro message
  const ivyIntroMessage =
    "Excellent! Let's review all the information you've shared. Please check each section carefully - you can edit any part by clicking the edit button. Once everything looks good, we'll start our personalized brainstorming conversation.";

  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);

  // Play intro message
  useEffect(() => {
    if (!isLoading && !isSpeaking) {
      speakText(ivyIntroMessage);
    }
  }, [isLoading]);

  const loadAllData = async () => {
    setIsLoading(true);

    try {
      console.log('=== LOADING DATA FROM DATABASE ===');

      // Load personal stories from database
      try {
        const personalStoriesData = await personalStoriesApi.list();
        setPersonalStories(personalStoriesData);
        console.log(
          '✅ Loaded',
          personalStoriesData.length,
          'personal stories from database'
        );
      } catch (error) {
        console.error(
          '❌ Error loading personal stories from database:',
          error
        );
        setPersonalStories([]);
      }

      // Load professional stories from database
      try {
        const professionalStoriesData = await professionalStoriesApi.list();
        setProfessionalStories(professionalStoriesData);
        console.log(
          '✅ Loaded',
          professionalStoriesData.length,
          'professional stories from database'
        );
        console.log('Professional stories data:', professionalStoriesData);
      } catch (error) {
        console.error(
          '❌ Error loading professional stories from database:',
          error
        );
        setProfessionalStories([]);
      }

      // Load goals from database
      try {
        const goalsData = await essayGoalsApi.list();
        setGoals(goalsData);
        console.log('✅ Loaded', goalsData.length, 'goals from database');
        console.log('Goals data:', goalsData);
      } catch (error) {
        console.error('❌ Error loading goals from database:', error);
        setGoals([]);
      }

      // Load college data from database
      try {
        const collegeDataList = await collegeEssayApi.list();
        if (collegeDataList.length > 0) {
          // Take the most recent college data
          setCollegeData(collegeDataList[collegeDataList.length - 1]);
          console.log(
            '✅ Loaded college data for',
            collegeDataList[collegeDataList.length - 1].collegeName
          );
        } else {
          console.log('❌ No college data in database');
          setCollegeData(null);
        }
      } catch (error) {
        console.error('❌ Error loading college data from database:', error);
        setCollegeData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (section: string) => {
    switch (section) {
      case 'personal':
        router.push('/essay-brainstorm/personal-stories-new');
        break;
      case 'professional':
        router.push('/essay-brainstorm/professional-stories-new');
        break;
      case 'goals':
        router.push('/essay-brainstorm/goals-new');
        break;
      case 'college':
        router.push('/essay-brainstorm/college-selection');
        break;
      default:
        break;
    }
  };

  const handleStartBrainstorming = () => {
    // Mark data as confirmed and proceed to conversation
    localStorage.setItem('brainstorm-data-confirmed', 'true');

    // Set session cleanup preference
    if (clearAfterSession) {
      localStorage.setItem('clear-session-after-conversation', 'true');
    } else {
      localStorage.removeItem('clear-session-after-conversation');
    }

    router.push('/essay-brainstorm/conversation');
  };

  const shortTermGoals = goals.filter((g) => g.type === 'short-term');
  const longTermGoals = goals.filter((g) => g.type === 'long-term');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <Paragraph>Loading your information...</Paragraph>
        </div>
      </div>
    );
  }

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
                Review & Confirm
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
        {/* Ivy Message */}
        <div className="relative mb-8 rounded-2xl border border-blue-200 bg-gradient-to-r from-green-100 to-blue-100 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-600 text-lg font-bold text-white">
                ✓
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
              className="p-2 text-blue-600 hover:bg-blue-50"
              onClick={() => speakText(ivyIntroMessage)}
            />
          </div>
        </div>

        {/* Personal Stories Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Heading level={3} className="text-lg font-semibold text-gray-900">
              Personal Stories ({personalStories.length})
            </Heading>
            <Button
              variant="secondary"
              size="sm"
              label="Edit"
              onClick={() => handleEdit('personal')}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            />
          </div>

          {personalStories.length > 0 ? (
            <div className="space-y-3">
              {personalStories.map((story, index) => (
                <div
                  key={story.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Story {index + 1} ({story.year_of_incident})
                    </span>
                  </div>
                  <div className="mb-2 text-sm text-gray-700">
                    <strong>Experience:</strong>{' '}
                    {story.what_was_incident.substring(0, 150)}...
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Impact:</strong>{' '}
                    {story.what_impact.substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No personal stories added yet
            </div>
          )}
        </div>

        {/* Professional Stories Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Heading level={3} className="text-lg font-semibold text-gray-900">
              Professional Stories ({professionalStories.length})
            </Heading>
            <Button
              variant="secondary"
              size="sm"
              label="Edit"
              onClick={() => handleEdit('professional')}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            />
          </div>

          {professionalStories.length > 0 ? (
            <div className="space-y-3">
              {professionalStories.map((story, index) => (
                <div
                  key={story.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Experience {index + 1} ({story.year_of_incident})
                    </span>
                  </div>
                  <div className="mb-2 text-sm text-gray-700">
                    <strong>Experience:</strong>{' '}
                    {story.what_was_incident.substring(0, 150)}...
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Impact:</strong>{' '}
                    {story.what_impact.substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No professional stories added yet
            </div>
          )}
        </div>

        {/* Goals Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Heading level={3} className="text-lg font-semibold text-gray-900">
              Goals & Aspirations ({goals.length})
            </Heading>
            <Button
              variant="secondary"
              size="sm"
              label="Edit"
              onClick={() => handleEdit('goals')}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            />
          </div>

          {goals.length > 0 ? (
            <div className="space-y-4">
              {shortTermGoals.length > 0 && (
                <div>
                  <h4 className="text-md mb-2 font-medium text-gray-800">
                    Short-term Goals
                  </h4>
                  <div className="space-y-2">
                    {shortTermGoals.map((goal, index) => (
                      <div
                        key={goal.id}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="mb-1 text-sm text-gray-700">
                          <strong>Goal:</strong> {goal.goal.substring(0, 100)}
                          ...
                        </div>
                        <div className="text-sm text-gray-700">
                          <strong>Motivation:</strong>{' '}
                          {goal.motivation.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {longTermGoals.length > 0 && (
                <div>
                  <h4 className="text-md mb-2 font-medium text-gray-800">
                    Long-term Goals
                  </h4>
                  <div className="space-y-2">
                    {longTermGoals.map((goal, index) => (
                      <div
                        key={goal.id}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="mb-1 text-sm text-gray-700">
                          <strong>Goal:</strong> {goal.goal.substring(0, 100)}
                          ...
                        </div>
                        <div className="text-sm text-gray-700">
                          <strong>Motivation:</strong>{' '}
                          {goal.motivation.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No goals added yet
            </div>
          )}
        </div>

        {/* College Selection Section */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Heading level={3} className="text-lg font-semibold text-gray-900">
              College & Essay Details
            </Heading>
            <Button
              variant="secondary"
              size="sm"
              label="Edit"
              onClick={() => handleEdit('college')}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            />
          </div>

          {collegeData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-900">
                    College
                  </Label>
                  <div className="text-sm text-gray-700">
                    {formatCollegeName(collegeData.collegeName)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-900">
                    Major
                  </Label>
                  <div className="text-sm text-gray-700">
                    {formatMajorName(collegeData.major)}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-900">
                  Essay Topic
                </Label>
                <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                  {collegeData.essayTopic}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-900">
                    Word Limit
                  </Label>
                  <div className="text-sm text-gray-700">
                    {collegeData.wordLimit} words
                  </div>
                </div>
                {collegeData.additionalRequirements && (
                  <div>
                    <Label className="text-sm font-medium text-gray-900">
                      Additional Requirements
                    </Label>
                    <div className="text-sm text-gray-700">
                      {collegeData.additionalRequirements}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No college information added yet
            </div>
          )}
        </div>

        {/* Session Management Options */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <span className="text-lg text-blue-600">🔒</span>
              </div>
            </div>
            <div className="flex-1">
              <Heading
                level={3}
                className="mb-2 text-lg font-semibold text-gray-900"
              >
                Session Privacy Settings
              </Heading>
              <Paragraph className="mb-4 text-sm text-gray-700">
                For your privacy, we recommend clearing all your personal
                information after completing your essay brainstorming session.
              </Paragraph>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="clearAfterSession"
                  checked={clearAfterSession}
                  onChange={(e) => setClearAfterSession(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="clearAfterSession"
                  className="cursor-pointer text-sm text-gray-700"
                >
                  <strong>Clear my data after session completion</strong>{' '}
                  (Recommended)
                </label>
              </div>

              <p className="mt-2 ml-7 text-xs text-gray-600">
                When checked, your personal stories, goals, and college
                information will be automatically deleted after you complete
                your essay structure.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="md"
            label="← Back to College Selection"
            onClick={() =>
              router.push('/essay-brainstorm/college-selection')
            }
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          />

          <Button
            variant="primary"
            size="lg"
            label="Start Brainstorming Session →"
            onClick={handleStartBrainstorming}
            disabled={!collegeData || personalStories.length === 0}
            className={`rounded-lg px-8 py-3 text-base font-medium transition-all ${
              !collegeData || personalStories.length === 0
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm hover:from-blue-600 hover:to-purple-700 hover:shadow-md'
            }`}
          />
        </div>

        {/* Requirements Check */}
        {(!collegeData || personalStories.length === 0) && (
          <div className="mt-4 text-center">
            <p className="text-sm text-red-600">
              Please ensure you have at least one personal story and college
              information before starting the brainstorming session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmationPage;
