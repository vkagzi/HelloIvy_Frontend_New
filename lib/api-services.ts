import api from './api';

export interface PersonalStory {
  id?: number;
  user?: number;
  year_of_incident: string | null;
  what_was_incident: string;
  what_impact: string;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfessionalStory {
  id?: number;
  user?: number;
  year_of_incident: string | null;
  what_was_incident: string;
  what_impact: string;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ShortTermGoal {
  id?: number;
  user?: number;
  industry: string;
  description: string;
  position: string;
  target_location: string;
  target_companies: string;
  why_this_goal: string;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LongTermGoal {
  id?: number;
  user?: number;
  industry: string;
  description: string;
  position: string;
  target_location: string;
  target_companies: string;
  why_this_goal: string;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CollegeSelection {
  id?: number;
  user?: number;
  college_name: string;
  other_college_name: string;
  early_decision_deadline: string | null;
  early_decision_2_deadline: string | null;
  regular_decision_deadline: string | null;
  set_deadline: string | null;
  degree: string;
  major: string;
  essay_topic: string;
  created_at?: string;
  updated_at?: string;
}

// New simplified goal structure for essay brainstorming
export interface EssayGoal {
  id?: number;
  user?: number;
  type: 'short-term' | 'long-term';
  goal: string;
  motivation: string;
  year?: number;
  created_at?: string;
  updated_at?: string;
}

// College essay data structure
export interface CollegeEssayData {
  id?: number;
  user?: number;
  collegeName: string;
  essayTopic: string;
  major: string;
  wordLimit: number;
  additionalRequirements?: string;
  created_at?: string;
  updated_at?: string;
}

// Personal Stories API
export const personalStoriesApi = {
  // Get all personal stories for the user
  list: async (): Promise<PersonalStory[]> => {
    const results = await api('/api/essay-brainstorm/personal-stories/', {
      method: 'GET',
    });

    // Convert backend format to frontend format
    return results.map((story: any) => ({
      ...story,
      year_of_incident: story.year_of_incident
        ? new Date(story.year_of_incident).getFullYear().toString()
        : null,
    }));
  },

  // Create a new personal story
  create: async (
    data: Omit<PersonalStory, 'id' | 'user' | 'created_at' | 'updated_at'>
  ): Promise<PersonalStory> => {
    // Convert year string to ISO date format for backend
    const backendData = {
      ...data,
      year_of_incident: data.year_of_incident
        ? `${data.year_of_incident}-01-01`
        : null,
    };

    const result = await api('/api/essay-brainstorm/personal-stories/', {
      method: 'POST',
      body: backendData,
    });

    // Convert response back to frontend format
    return {
      ...result,
      year_of_incident: result.year_of_incident
        ? new Date(result.year_of_incident).getFullYear().toString()
        : null,
    };
  },

  // Update a personal story
  update: async (
    id: number,
    data: Partial<PersonalStory>
  ): Promise<PersonalStory> => {
    const backendData = {
      ...data,
      year_of_incident: data.year_of_incident
        ? `${data.year_of_incident}-01-01`
        : null,
    };

    const result = await api(`/api/essay-brainstorm/personal-stories/${id}/`, {
      method: 'PUT',
      body: backendData,
    });

    return {
      ...result,
      year_of_incident: result.year_of_incident
        ? new Date(result.year_of_incident).getFullYear().toString()
        : null,
    };
  },

  // Delete a personal story
  delete: async (id: number): Promise<void> => {
    return api(`/api/essay-brainstorm/personal-stories/${id}/`, {
      method: 'DELETE',
    });
  },

  // Get a specific personal story
  get: async (id: number): Promise<PersonalStory> => {
    const result = await api(`/api/essay-brainstorm/personal-stories/${id}/`, {
      method: 'GET',
    });

    return {
      ...result,
      year_of_incident: result.year_of_incident
        ? new Date(result.year_of_incident).getFullYear().toString()
        : null,
    };
  },
};

// Professional Stories API
export const professionalStoriesApi = {
  // Get all professional stories for the user
  list: async (): Promise<ProfessionalStory[]> => {
    const results = await api('/api/essay-brainstorm/professional-stories/', {
      method: 'GET',
    });

    // Convert backend format to frontend format
    return results.map((story: any) => ({
      ...story,
      year_of_incident: story.year_of_incident
        ? new Date(story.year_of_incident).getFullYear().toString()
        : null,
    }));
  },

  // Create a new professional story
  create: async (
    data: Omit<ProfessionalStory, 'id' | 'user' | 'created_at' | 'updated_at'>
  ): Promise<ProfessionalStory> => {
    // Convert year string to ISO date format for backend
    const backendData = {
      ...data,
      year_of_incident: data.year_of_incident
        ? `${data.year_of_incident}-01-01`
        : null,
    };

    const result = await api('/api/essay-brainstorm/professional-stories/', {
      method: 'POST',
      body: backendData,
    });

    // Convert response back to frontend format
    return {
      ...result,
      year_of_incident: result.year_of_incident
        ? new Date(result.year_of_incident).getFullYear().toString()
        : null,
    };
  },

  // Update a professional story
  update: async (
    id: number,
    data: Partial<ProfessionalStory>
  ): Promise<ProfessionalStory> => {
    const backendData = {
      ...data,
      year_of_incident: data.year_of_incident
        ? `${data.year_of_incident}-01-01`
        : null,
    };

    const result = await api(
      `/api/essay-brainstorm/professional-stories/${id}/`,
      { method: 'PUT', body: backendData }
    );

    return {
      ...result,
      year_of_incident: result.year_of_incident
        ? new Date(result.year_of_incident).getFullYear().toString()
        : null,
    };
  },

  // Delete a professional story
  delete: async (id: number): Promise<void> => {
    return api(`/api/essay-brainstorm/professional-stories/${id}/`, {
      method: 'DELETE',
    });
  },

  // Get a specific professional story
  get: async (id: number): Promise<ProfessionalStory> => {
    const result = await api(
      `/api/essay-brainstorm/professional-stories/${id}/`,
      { method: 'GET' }
    );

    return {
      ...result,
      year_of_incident: result.year_of_incident
        ? new Date(result.year_of_incident).getFullYear().toString()
        : null,
    };
  },
};

// Short Term Goals API
export const shortTermGoalsApi = {
  // Get all short term goals for the user
  list: async (): Promise<ShortTermGoal[]> => {
    return api('/api/essay-brainstorm/short-term-goals/', { method: 'GET' });
  },

  // Create a new short term goal
  create: async (
    data: Omit<ShortTermGoal, 'id' | 'user' | 'created_at' | 'updated_at'>
  ): Promise<ShortTermGoal> => {
    return api('/api/essay-brainstorm/short-term-goals/', {
      method: 'POST',
      body: data,
    });
  },

  // Update a short term goal
  update: async (
    id: number,
    data: Partial<ShortTermGoal>
  ): Promise<ShortTermGoal> => {
    return api(`/api/essay-brainstorm/short-term-goals/${id}/`, {
      method: 'PUT',
      body: data,
    });
  },

  // Delete a short term goal
  delete: async (id: number): Promise<void> => {
    return api(`/api/essay-brainstorm/short-term-goals/${id}/`, {
      method: 'DELETE',
    });
  },

  // Get a specific short term goal
  get: async (id: number): Promise<ShortTermGoal> => {
    return api(`/api/essay-brainstorm/short-term-goals/${id}/`, {
      method: 'GET',
    });
  },
};

// Long Term Goals API
export const longTermGoalsApi = {
  // Get all long term goals for the user
  list: async (): Promise<LongTermGoal[]> => {
    return api('/api/essay-brainstorm/long-term-goals/', { method: 'GET' });
  },

  // Create a new long term goal
  create: async (
    data: Omit<LongTermGoal, 'id' | 'user' | 'created_at' | 'updated_at'>
  ): Promise<LongTermGoal> => {
    return api('/api/essay-brainstorm/long-term-goals/', {
      method: 'POST',
      body: data,
    });
  },

  // Update a long term goal
  update: async (
    id: number,
    data: Partial<LongTermGoal>
  ): Promise<LongTermGoal> => {
    return api(`/api/essay-brainstorm/long-term-goals/${id}/`, {
      method: 'PUT',
      body: data,
    });
  },

  // Delete a long term goal
  delete: async (id: number): Promise<void> => {
    return api(`/api/essay-brainstorm/long-term-goals/${id}/`, {
      method: 'DELETE',
    });
  },

  // Get a specific long term goal
  get: async (id: number): Promise<LongTermGoal> => {
    return api(`/api/essay-brainstorm/long-term-goals/${id}/`, {
      method: 'GET',
    });
  },
};

// College Selection API
export const collegeSelectionApi = {
  // Get all college selections for the user
  list: async (): Promise<CollegeSelection[]> => {
    return api('/api/essay-brainstorm/college-selection/', { method: 'GET' });
  },

  // Create a new college selection
  create: async (
    data: Omit<CollegeSelection, 'id' | 'user' | 'created_at' | 'updated_at'>
  ): Promise<CollegeSelection> => {
    return api('/api/essay-brainstorm/college-selection/', {
      method: 'POST',
      body: data,
    });
  },

  // Update a college selection
  update: async (
    id: number,
    data: Partial<CollegeSelection>
  ): Promise<CollegeSelection> => {
    return api(`/api/essay-brainstorm/college-selection/${id}/`, {
      method: 'PUT',
      body: data,
    });
  },

  // Delete a college selection
  delete: async (id: number): Promise<void> => {
    return api(`/api/essay-brainstorm/college-selection/${id}/`, {
      method: 'DELETE',
    });
  },

  // Get a specific college selection
  get: async (id: number): Promise<CollegeSelection> => {
    return api(`/api/essay-brainstorm/college-selection/${id}/`, {
      method: 'GET',
    });
  },
};

// Essay Goals API (unified interface for short-term and long-term goals)
export const essayGoalsApi = {
  // Get all goals for the user (combines short-term and long-term)
  list: async (): Promise<EssayGoal[]> => {
    try {
      const [shortTermGoals, longTermGoals] = await Promise.all([
        api('/api/essay-brainstorm/short-term-goals/', { method: 'GET' }),
        api('/api/essay-brainstorm/long-term-goals/', { method: 'GET' }),
      ]);

      // Convert backend format to frontend format
      const convertedShortTerm: EssayGoal[] = shortTermGoals.map(
        (goal: any) => ({
          id: goal.id,
          type: 'short-term' as const,
          goal: goal.description || goal.position || '',
          motivation: goal.why_this_goal || '',
          created_at: goal.created_at,
          updated_at: goal.updated_at,
        })
      );

      const convertedLongTerm: EssayGoal[] = longTermGoals.map((goal: any) => ({
        id: goal.id,
        type: 'long-term' as const,
        goal: goal.description || goal.position || '',
        motivation: goal.why_this_goal || '',
        created_at: goal.created_at,
        updated_at: goal.updated_at,
      }));

      return [...convertedShortTerm, ...convertedLongTerm];
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  // Create a new goal
  create: async (
    data: Omit<EssayGoal, 'id' | 'user' | 'created_at' | 'updated_at'>
  ): Promise<EssayGoal> => {
    const endpoint =
      data.type === 'short-term'
        ? '/api/essay-brainstorm/short-term-goals/'
        : '/api/essay-brainstorm/long-term-goals/';

    // Convert frontend format to backend format
    const backendData = {
      description: data.goal,
      why_this_goal: data.motivation,
      is_completed: true,
      // Add default values for required backend fields
      industry: '',
      position: '',
      target_location: '',
      target_companies: '',
    };

    const result = await api(endpoint, { method: 'POST', body: backendData });

    // Convert back to frontend format
    return {
      id: result.id,
      type: data.type,
      goal: result.description || result.position || '',
      motivation: result.why_this_goal || '',
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  },

  // Update a goal
  update: async (id: number, data: Partial<EssayGoal>): Promise<EssayGoal> => {
    const endpoint =
      data.type === 'short-term'
        ? `/api/essay-brainstorm/short-term-goals/${id}/`
        : `/api/essay-brainstorm/long-term-goals/${id}/`;

    const backendData = {
      description: data.goal,
      why_this_goal: data.motivation,
      is_completed: true,
    };

    const result = await api(endpoint, { method: 'PUT', body: backendData });

    return {
      id: result.id,
      type: data.type || 'short-term',
      goal: result.description || result.position || '',
      motivation: result.why_this_goal || '',
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  },

  // Delete a goal
  delete: async (id: number): Promise<void> => {
    // We need to check both endpoints to find which one has this goal
    try {
      await api(`/api/essay-brainstorm/short-term-goals/${id}/`, {
        method: 'DELETE',
      });
    } catch (error) {
      // If not found in short-term, try long-term
      await api(`/api/essay-brainstorm/long-term-goals/${id}/`, {
        method: 'DELETE',
      });
    }
  },

  // Get a specific goal
  get: async (id: number): Promise<EssayGoal> => {
    // Try both endpoints
    try {
      const result = await api(
        `/api/essay-brainstorm/short-term-goals/${id}/`,
        { method: 'GET' }
      );
      return {
        id: result.id,
        type: 'short-term',
        goal: result.description || result.position || '',
        motivation: result.why_this_goal || '',
        created_at: result.created_at,
        updated_at: result.updated_at,
      };
    } catch (error) {
      const result = await api(`/api/essay-brainstorm/long-term-goals/${id}/`, {
        method: 'GET',
      });
      return {
        id: result.id,
        type: 'long-term',
        goal: result.description || result.position || '',
        motivation: result.why_this_goal || '',
        created_at: result.created_at,
        updated_at: result.updated_at,
      };
    }
  },
};

// College Essay Data API (maps to CollegeSelection backend)
export const collegeEssayApi = {
  // Get all college essay data for the user
  list: async (): Promise<CollegeEssayData[]> => {
    const results = await api('/api/essay-brainstorm/college-selection/', {
      method: 'GET',
    });

    // Convert backend format to frontend format
    return results.map((selection: any) => ({
      id: selection.id,
      collegeName: selection.college_name || selection.other_college_name || '',
      essayTopic: selection.essay_topic || '',
      major: selection.major || '',
      wordLimit: selection.word_limit || 650,
      additionalRequirements: selection.additional_requirements || '',
      created_at: selection.created_at,
      updated_at: selection.updated_at,
    }));
  },

  // Create new college essay data
  create: async (
    data: Omit<CollegeEssayData, 'id' | 'user' | 'created_at' | 'updated_at'>
  ): Promise<CollegeEssayData> => {
    // Convert frontend format to backend format
    const backendData = {
      college_name: data.collegeName,
      essay_topic: data.essayTopic,
      major: data.major,
      word_limit: data.wordLimit,
      additional_requirements: data.additionalRequirements || '',
      degree: '', // Default value
      // Add any other required backend fields with defaults
      other_college_name: '',
      early_decision_deadline: null,
      early_decision_2_deadline: null,
      regular_decision_deadline: null,
      set_deadline: null,
    };

    const result = await api('/api/essay-brainstorm/college-selection/', {
      method: 'POST',
      body: backendData,
    });

    // Convert back to frontend format
    return {
      id: result.id,
      collegeName: result.college_name || result.other_college_name || '',
      essayTopic: result.essay_topic || '',
      major: result.major || '',
      wordLimit: result.word_limit || data.wordLimit || 650,
      additionalRequirements:
        result.additional_requirements || data.additionalRequirements || '',
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  },

  // Update college essay data
  update: async (
    id: number,
    data: Partial<CollegeEssayData>
  ): Promise<CollegeEssayData> => {
    const backendData = {
      college_name: data.collegeName,
      essay_topic: data.essayTopic,
      major: data.major,
      word_limit: data.wordLimit,
      additional_requirements: data.additionalRequirements,
    };

    const result = await api(`/api/essay-brainstorm/college-selection/${id}/`, {
      method: 'PUT',
      body: backendData,
    });

    return {
      id: result.id,
      collegeName: result.college_name || result.other_college_name || '',
      essayTopic: result.essay_topic || '',
      major: result.major || '',
      wordLimit: result.word_limit || data.wordLimit || 650,
      additionalRequirements:
        result.additional_requirements || data.additionalRequirements || '',
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  },

  // Delete college essay data
  delete: async (id: number): Promise<void> => {
    return api(`/api/essay-brainstorm/college-selection/${id}/`, {
      method: 'DELETE',
    });
  },

  // Get a specific college essay data
  get: async (id: number): Promise<CollegeEssayData> => {
    const result = await api(`/api/essay-brainstorm/college-selection/${id}/`, {
      method: 'GET',
    });

    return {
      id: result.id,
      collegeName: result.college_name || result.other_college_name || '',
      essayTopic: result.essay_topic || '',
      major: result.major || '',
      wordLimit: 650,
      additionalRequirements: '',
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  },
};

// Session Management API - for handling session-based data cleanup
export const sessionManagementApi = {
  // Clear all user essay brainstorming data
  clearAllEssayData: async (): Promise<void> => {
    try {
      console.log('🧹 Starting essay brainstorming data cleanup...');

      // Get all data first to know what to delete
      const [personalStories, professionalStories, goals, collegeData] =
        await Promise.all([
          personalStoriesApi.list(),
          professionalStoriesApi.list(),
          essayGoalsApi.list(),
          collegeEssayApi.list(),
        ]);

      // Delete all personal stories
      if (personalStories.length > 0) {
        await Promise.all(
          personalStories.map((story) =>
            story.id ? personalStoriesApi.delete(story.id) : Promise.resolve()
          )
        );
        console.log(`✅ Deleted ${personalStories.length} personal stories`);
      }

      // Delete all professional stories
      if (professionalStories.length > 0) {
        await Promise.all(
          professionalStories.map((story) =>
            story.id
              ? professionalStoriesApi.delete(story.id)
              : Promise.resolve()
          )
        );
        console.log(
          `✅ Deleted ${professionalStories.length} professional stories`
        );
      }

      // Delete all goals
      if (goals.length > 0) {
        await Promise.all(
          goals.map((goal) =>
            goal.id ? essayGoalsApi.delete(goal.id) : Promise.resolve()
          )
        );
        console.log(`✅ Deleted ${goals.length} goals`);
      }

      // Delete all college data
      if (collegeData.length > 0) {
        await Promise.all(
          collegeData.map((college) =>
            college.id ? collegeEssayApi.delete(college.id) : Promise.resolve()
          )
        );
        console.log(`✅ Deleted ${collegeData.length} college selections`);
      }

      console.log(
        '🎉 Essay brainstorming data cleanup completed successfully!'
      );
    } catch (error) {
      console.error('❌ Error during essay data cleanup:', error);
      throw error;
    }
  },

  // Check if user has any essay brainstorming data
  hasEssayData: async (): Promise<boolean> => {
    try {
      const [personalStories, professionalStories, goals, collegeData] =
        await Promise.all([
          personalStoriesApi.list(),
          professionalStoriesApi.list(),
          essayGoalsApi.list(),
          collegeEssayApi.list(),
        ]);

      return (
        personalStories.length > 0 ||
        professionalStories.length > 0 ||
        goals.length > 0 ||
        collegeData.length > 0
      );
    } catch (error) {
      console.error('Error checking essay data:', error);
      return false;
    }
  },

  // Get data summary for confirmation
  getDataSummary: async () => {
    try {
      const [personalStories, professionalStories, goals, collegeData] =
        await Promise.all([
          personalStoriesApi.list(),
          professionalStoriesApi.list(),
          essayGoalsApi.list(),
          collegeEssayApi.list(),
        ]);

      return {
        personalStories: personalStories.length,
        professionalStories: professionalStories.length,
        goals: goals.length,
        collegeData: collegeData.length,
        total:
          personalStories.length +
          professionalStories.length +
          goals.length +
          collegeData.length,
      };
    } catch (error) {
      console.error('Error getting data summary:', error);
      return {
        personalStories: 0,
        professionalStories: 0,
        goals: 0,
        collegeData: 0,
        total: 0,
      };
    }
  },
};
