'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Paragraph } from '@/app/_components/Typography';
import Button from '@/app/_components/Button';
import { useToast } from '@/app/_components/Toast';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  PlusIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { generateEssayReport } from '@/app/utils/pdfGenerator';

// Types for the new 5-criteria essay evaluator
interface Essay {
  id: string;
  title: string;
  question_type: string;
  college_degree: string;
  content: string;
  overall_score?: number;
  version_number?: number;
  created_at: string;
  word_count?: number;
  processing_time?: number;
}

interface Criteria {
  score?: number;
  feedback: string;
  sub_scores?: {
    clarity?: number;
    emotional_depth?: number;
    impact_on_goals?: number;
  };
}

interface InlineSuggestion {
  id: string;
  original: string;
  suggested: string;
  reason: string;
  type: 'grammar' | 'style' | 'content' | 'structure' | 'clarity';
  applied?: boolean;
}

interface AnalysisData {
  overall_score?: number;
  criteria?: {
    alignment_with_topic?: Criteria;
    alignment_with_brainstorming?: Criteria;
    narrative_and_impact?: Criteria;
    language_and_structure?: Criteria;
    alignment_with_college_values?: Criteria;
  };
  inline_suggestions?: InlineSuggestion[];
  annotations?: Array<{ line: string; recommendation: string }>;
  summary?: string;
  improvement_checks?: any;
  suggestions?: {
    primary?: string[];
    alternative?: string[];
  };
  admissions_perspective?: {
    positive?: string;
    critical?: string;
  };
  detailed_feedback?: {
    inline_suggestions?: InlineSuggestion[];
    annotations?: Array<{
      line?: string;
      recommendation?: string;
      essay_line?: string;
      recommended_change?: string;
    }>;
    summary_recommendations: string[];
    next_edit_focus: string;
  };
  essay_type?: string;
  dynamic_weighting?: boolean;
}

interface AnalysisResponse {
  status: string;
  analysis: AnalysisData;
  ai_provider: string;
  processing_time: number;
  user_credits?: number;
  essay_id?: string;
  version_number?: number;
  word_count?: number;
}

const EssayEvaluatorPage: React.FC = () => {
  const { addToast } = useToast();

  // Set auth token on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ0b2tlbiI6ImU4MWNlNTE0LWE4OTctNGZjNS1hYzZlLTRiNTU2ODJiNmY4YyIsImV4cCI6MTc4OTkxNTM5OH0.XyeAivNJHwGyctbANRMyy-_SXuKnnRbiDEhb80jD7WU';
      localStorage.setItem('auth_token', token);
      console.log('🔑 Auth token set for testing');
    }
  }, []);

  // Main state management
  const [currentView, setCurrentView] = useState<
    'landing' | 'essays' | 'setup' | 'workspace'
  >('landing');
  const [essays, setEssays] = useState<Essay[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReEvaluating, setIsReEvaluating] = useState(false);

  // Workspace state
  const [currentEssayId, setCurrentEssayId] = useState<string>('');
  const [essayContent, setEssayContent] = useState<string>('');
  const [essayTitle, setEssayTitle] = useState<string>('');
  const [questionType, setQuestionType] = useState<string>('');
  const [collegeDegree, setCollegeDegree] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [currentAnalysis, setCurrentAnalysis] =
    useState<AnalysisResponse | null>(null);

  // RAG system state (separate from inline evaluation)
  const [ragAnalysis, setRagAnalysis] = useState<AnalysisResponse | null>(null);
  const [isRagAnalyzing, setIsRagAnalyzing] = useState(false);
  const [showRagPanel, setShowRagPanel] = useState(true);

  // UI state for collapsible sections
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(
    new Set()
  );
  const [activeTab, setActiveTab] = useState<
    'summary' | 'suggestions' | 'comments' | 'structure'
  >('summary');
  const [suggestionType, setSuggestionType] = useState<
    'primary' | 'alternative'
  >('primary');

  // Setup form state
  const [newEssayPrompt, setNewEssayPrompt] = useState<string>('');
  const [essayLimitType, setEssayLimitType] = useState<
    | 'words'
    | 'characters_with_space'
    | 'characters_without_space'
    | 'pages_single'
    | 'pages_double'
  >('words');
  const [essayLimit, setEssayLimit] = useState<number>(250);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedDegree, setSelectedDegree] = useState<string>('');
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [activeSetupTab, setActiveSetupTab] = useState<'topic' | 'essay'>(
    'topic'
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pastedEssayText, setPastedEssayText] = useState<string>('');
  const [essayWordCount, setEssayWordCount] = useState<number>(0);

  // Rich text editor state
  const [editorRef, setEditorRef] = useState<HTMLDivElement | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Grammarly-style popup state
  const [popup, setPopup] = useState<{
    x: number;
    y: number;
    suggestion: string;
    message: string;
    type: string;
    node: HTMLElement;
  } | null>(null);

  // Inline suggestions state (Grammarly-style)
  const [inlineSuggestions, setInlineSuggestions] = useState<
    InlineSuggestion[]
  >([]);
  const [suggestionPopup, setSuggestionPopup] = useState<{
    x: number;
    y: number;
    suggestion: InlineSuggestion;
  } | null>(null);

  // Persistent grammar errors state for highlighting
  const [grammarErrors, setGrammarErrors] = useState<
    Array<{
      start: number;
      end: number;
      message: string;
      suggestion: string;
      type: string;
    }>
  >([]);

  useEffect(() => {
    loadEssays();
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        popup &&
        !target.closest('.grammar-popup') &&
        !target.classList.contains('spelling-error') &&
        !target.classList.contains('grammar-error')
      ) {
        setPopup(null);
      }
    };

    if (popup) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [popup]);

  // Update word count when content changes
  useEffect(() => {
    setWordCount(
      essayContent
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    );
  }, [essayContent]);

  // Update essay word count when pasted text changes
  useEffect(() => {
    setEssayWordCount(
      pastedEssayText
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    );
  }, [pastedEssayText]);

  const loadEssays = async () => {
    try {
      const data = await api<Essay[]>('/api/essay-evaluator/essays/');
      setEssays(data);
    } catch (error) {
      console.error('Error loading essays:', error);
    }
  };

  // Helper functions for UI interactions
  const toggleCriteria = (criteriaKey: string) => {
    const newExpanded = new Set(expandedCriteria);
    if (newExpanded.has(criteriaKey)) {
      newExpanded.delete(criteriaKey);
    } else {
      newExpanded.add(criteriaKey);
    }
    setExpandedCriteria(newExpanded);
  };

  const criteriaLabels = {
    alignment_with_topic: 'Alignment with Topic',
    alignment_with_brainstorming: 'Alignment with Brainstorming',
    narrative_and_impact: 'Essay Narrative & Impact',
    language_and_structure: 'Language & Structure',
    alignment_with_college_values: 'Alignment with College Values',
  };

  const getScoreColor = (_score: number) => {
    return 'text-gray-600'; // Remove color coding since no scores
  };

  const getScoreBarColor = (_score: number) => {
    return 'bg-gray-300'; // Remove color coding since no scores
  };

  // Inline suggestion functions
  const applySuggestion = (suggestionId: string) => {
    const suggestion = inlineSuggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    // Replace text in essay content
    const newContent = essayContent.replace(
      suggestion.original,
      suggestion.suggested
    );
    setEssayContent(newContent);

    // Mark suggestion as applied
    setInlineSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, applied: true } : s))
    );

    // Close popup
    setSuggestionPopup(null);

    // Update word count
    setWordCount(
      newContent.split(/\s+/).filter((word) => word.length > 0).length
    );
  };

  const rejectSuggestion = (suggestionId: string) => {
    // Remove suggestion from list
    setInlineSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));

    // Close popup
    setSuggestionPopup(null);
  };

  const showSuggestionPopup = (
    suggestion: InlineSuggestion,
    event: React.MouseEvent
  ) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();

    // For fixed positioning, use viewport coordinates (no scroll offset needed)
    let x = rect.left;
    let y = rect.bottom + 5;

    // Ensure popup stays within viewport bounds
    const popupWidth = 300; // Approximate popup width
    const popupHeight = 200; // Approximate popup height

    // Adjust x position if popup would go off-screen
    if (x + popupWidth > window.innerWidth) {
      x = window.innerWidth - popupWidth - 10;
    }

    // Adjust y position if popup would go off-screen
    if (y + popupHeight > window.innerHeight) {
      y = rect.top - popupHeight - 5; // Show above the text instead
    }

    setSuggestionPopup({
      x,
      y,
      suggestion,
    });
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'grammar':
        return 'bg-red-100 border-red-300';
      case 'style':
        return 'bg-blue-100 border-blue-300';
      case 'content':
        return 'bg-green-100 border-green-300';
      case 'structure':
        return 'bg-purple-100 border-purple-300';
      case 'clarity':
        return 'bg-yellow-100 border-yellow-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const analyzeEssay = async (isReEvaluation = false) => {
    if (!essayTitle.trim() || !essayContent.trim() || wordCount < 20) {
      addToast('Please provide a title and essay content (minimum 20 words)', {
        type: 'error',
      });
      return;
    }

    // Check word limit and warn user
    const status = getWordLimitStatus();
    if (status && status.type === 'warning' && essayLimitType === 'words') {
      const percentage = (wordCount / essayLimit) * 100;
      if (percentage < 80) {
        addToast(
          `Warning: Your essay is significantly shorter than the target (${wordCount}/${essayLimit} words). Consider expanding your content before evaluation.`,
          { type: 'error' }
        );
        return;
      } else if (percentage > 110) {
        addToast(
          `Warning: Your essay exceeds the target word limit (${wordCount}/${essayLimit} words). Consider shortening it.`,
          { type: 'error' }
        );
        return;
      }
    }

    if (isReEvaluation) {
      setIsReEvaluating(true);
    } else {
      setIsAnalyzing(true);
    }

    try {
      let analysis: AnalysisResponse;

      if (isReEvaluation && currentEssayId) {
        // Re-evaluation of existing essay
        // Convert HTML content to plain text for API
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = essayContent;
        const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';

        analysis = await api<AnalysisResponse>(
          `/api/essay-evaluator/essays/${currentEssayId}/re_evaluate/`,
          {
            method: 'POST',
            body: { content: plainTextContent },
          }
        );
      } else {
        // New essay evaluation
        // Convert HTML content to plain text for API
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = essayContent;
        const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';

        analysis = await api<AnalysisResponse>('/api/essay-evaluator/essays/', {
          method: 'POST',
          body: {
            title: essayTitle,
            question_type: questionType,
            college_degree: collegeDegree,
            content: plainTextContent,
          },
        });
      }

      setCurrentAnalysis(analysis);
      if (analysis.essay_id) {
        setCurrentEssayId(analysis.essay_id);
      }

      // Extract inline suggestions from analysis
      if (analysis.analysis?.inline_suggestions) {
        setInlineSuggestions(analysis.analysis.inline_suggestions);
      } else {
        setInlineSuggestions([]);
      }

      await loadEssays();
      addToast(
        `Essay ${isReEvaluation ? 're-evaluated' : 'analyzed'} successfully!`,
        { type: 'success' }
      );
    } catch (error: any) {
      console.error('Essay analysis failed:', error);
      addToast(error.message || 'Failed to analyze essay. Please try again.', {
        type: 'error',
      });
    } finally {
      setIsAnalyzing(false);
      setIsReEvaluating(false);
    }
  };

  const analyzeEssayWithRAG = async () => {
    if (!essayTitle.trim() || !essayContent.trim() || wordCount < 20) {
      addToast('Please provide a title and essay content (minimum 20 words)', {
        type: 'error',
      });
      return;
    }

    setIsRagAnalyzing(true);

    try {
      // Convert HTML content to plain text for API
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = essayContent;
      const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';

      const ragResponse = await api<AnalysisResponse>(
        '/api/essay-evaluator/essays/rag_evaluate/',
        {
          method: 'POST',
          body: {
            content: plainTextContent,
            question_type: questionType,
            college_degree: collegeDegree,
          },
        }
      );

      setRagAnalysis(ragResponse);
      addToast('Evaluation completed successfully!', { type: 'success' });
    } catch (error: any) {
      console.error('Analysis failed:', error);
      addToast(
        error.message || 'Failed to analyze essay with RAG. Please try again.',
        { type: 'error' }
      );
    } finally {
      setIsRagAnalyzing(false);
    }
  };

  const handleDownloadReport = () => {
    if (!essayTitle || !essayContent) {
      addToast(
        'Please provide essay title and content before downloading report',
        { type: 'error' }
      );
      return;
    }

    if (!ragAnalysis && !currentAnalysis) {
      addToast('Please analyze your essay before downloading the report', {
        type: 'error',
      });
      return;
    }

    try {
      generateEssayReport({
        essayTitle,
        essayContent,
        questionType,
        collegeDegree,
        wordCount,
        ragAnalysis: ragAnalysis?.analysis,
        currentAnalysis: currentAnalysis?.analysis,
      });
      addToast('Report downloaded successfully!', { type: 'success' });
    } catch (error) {
      console.error('Error generating report:', error);
      addToast('Failed to generate report. Please try again.', {
        type: 'error',
      });
    }
  };

  const startNewEssay = () => {
    setCurrentEssayId('');
    setEssayContent('');
    setEssayTitle('');
    setQuestionType('');
    setCollegeDegree('');
    setCurrentAnalysis(null);
    setRagAnalysis(null);
    setCurrentView('setup');
  };

  const proceedToWorkspace = () => {
    setCurrentView('workspace');
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(fileExtension)) {
      addToast('Please upload only PDF, DOCX, or TXT files.', {
        type: 'error',
      });
      return;
    }

    setUploadedFile(file);

    // Show loading state
    addToast('Extracting text from file...', { type: 'success' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use fetch directly for file upload to avoid JSON stringify on FormData
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(
        `${baseUrl}/api/essay-evaluator/essays/upload-essay/`,
        {
          method: 'POST',
          headers,
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: 'Upload failed' }));
        throw new Error(
          errorData.error || `Upload failed with status ${res.status}`
        );
      }

      const response = await res.json();

      if (response.content) {
        setPastedEssayText(response.content);

        // Show success message with word count
        let message = `Successfully extracted ${response.word_count} words from ${response.filename}`;
        if (response.truncated) {
          message += ` (truncated to ${response.max_words} words)`;
        }
        addToast(message, { type: 'success' });
      } else {
        throw new Error('No content extracted from file');
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      addToast(
        error.message || 'Failed to extract text from file. Please try again.',
        { type: 'error' }
      );

      // Clear the uploaded file on error
      setUploadedFile(null);
      event.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(fileExtension)) {
      addToast('Please drop only PDF, DOCX, or TXT files.', { type: 'error' });
      return;
    }

    setUploadedFile(file);

    // Show loading state
    addToast('Extracting text from dropped file...', { type: 'success' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use fetch directly for file upload to avoid JSON stringify on FormData
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(
        `${baseUrl}/api/essay-evaluator/essays/upload-essay/`,
        {
          method: 'POST',
          headers,
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: 'Upload failed' }));
        throw new Error(
          errorData.error || `Upload failed with status ${res.status}`
        );
      }

      const response = await res.json();

      if (response.content) {
        setPastedEssayText(response.content);

        // Show success message with word count
        let message = `Successfully extracted ${response.word_count} words from ${response.filename}`;
        if (response.truncated) {
          message += ` (truncated to ${response.max_words} words)`;
        }
        addToast(message, { type: 'success' });
      } else {
        throw new Error('No content extracted from file');
      }
    } catch (error: any) {
      console.error('File drop error:', error);
      addToast(
        error.message ||
          'Failed to extract text from dropped file. Please try again.',
        { type: 'error' }
      );

      // Clear the uploaded file on error
      setUploadedFile(null);
    }
  };

  const openEssay = (essay: Essay) => {
    setCurrentEssayId(essay.id);
    setEssayContent(essay.content);
    setEssayTitle(essay.title);
    setQuestionType(essay.question_type);
    setCollegeDegree(essay.college_degree);
    setCurrentAnalysis(null); // Clear analysis, will need to load it
    setCurrentView('workspace');
  };

  // Rich text editor formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef) {
      setEssayContent(editorRef.innerHTML);
      // Update word count from plain text
      const plainText = editorRef.innerText || editorRef.textContent || '';
      setWordCount(
        plainText
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length
      );
    }
  };

  const handleEditorInput = () => {
    if (editorRef) {
      const content = editorRef.innerHTML;
      setEssayContent(content);
      // Update word count from plain text
      const plainText = editorRef.innerText || editorRef.textContent || '';
      setWordCount(
        plainText
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length
      );
    }
  };

  // Grammarly-style popup click handler
  const handleErrorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    // Handle inline suggestions
    if (target.classList.contains('inline-suggestion')) {
      const suggestionId = target.getAttribute('data-suggestion-id');
      if (suggestionId) {
        const suggestion = inlineSuggestions.find((s) => s.id === suggestionId);
        if (suggestion) {
          showSuggestionPopup(suggestion, event);
        }
      }
      return;
    }

    // Handle grammar/spelling errors (legacy)
    if (
      target.classList.contains('spelling-error') ||
      target.classList.contains('grammar-error')
    ) {
      const suggestion = target.getAttribute('data-suggestion');
      const message = target.getAttribute('data-message');
      const errorType = target.classList.contains('spelling-error')
        ? 'Spelling'
        : 'Grammar';

      if (suggestion && suggestion !== 'No suggestion' && message) {
        // Get the position relative to the viewport for popup placement
        const rect = target.getBoundingClientRect();

        setPopup({
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY + 5,
          suggestion: suggestion,
          message: message,
          type: errorType,
          node: target,
        });
      }
    } else {
      // Close popup if clicking elsewhere
      setPopup(null);
      setSuggestionPopup(null);
    }
  };

  // Apply grammar suggestion from popup - React state-based approach with persistent highlighting
  const applyGrammarSuggestion = () => {
    if (popup?.node && popup.suggestion && editorRef) {
      const original = popup.node.textContent || '';
      const startAttr = popup.node.getAttribute('data-start');
      const endAttr = popup.node.getAttribute('data-end');

      if (startAttr && endAttr) {
        const start = parseInt(startAttr);
        const end = parseInt(endAttr);

        // Get current plain text from editor
        const currentText = editorRef.innerText || editorRef.textContent || '';

        // Replace text using string slicing
        const updatedText =
          currentText.slice(0, start) +
          popup.suggestion +
          currentText.slice(end);

        // Calculate text length difference for offset adjustment
        const lengthDiff = popup.suggestion.length - (end - start);

        // Update essay content state
        setEssayContent(updatedText);

        // Remove only the corrected error and adjust remaining error positions
        const updatedErrors = grammarErrors
          .filter((err) => !(err.start === start && err.end === end)) // Remove corrected error
          .map((err) => {
            // Adjust positions of errors that come after the correction
            if (err.start > end) {
              return {
                ...err,
                start: err.start + lengthDiff,
                end: err.end + lengthDiff,
              };
            }
            return err;
          });

        setGrammarErrors(updatedErrors);

        // Re-apply highlighting with remaining errors
        if (updatedErrors.length > 0) {
          const highlightedHTML = highlightText(updatedText, updatedErrors);
          editorRef.innerHTML = highlightedHTML;
          setEssayContent(highlightedHTML);
        } else {
          // No more errors, show clean text
          const cleanHTML = updatedText
            .split('\n\n')
            .map((paragraph) => paragraph.trim())
            .filter((paragraph) => paragraph.length > 0)
            .map((paragraph) => `<p>${paragraph}</p>`)
            .join('');
          editorRef.innerHTML =
            cleanHTML || '<p>Start writing your essay...</p>';
          setEssayContent(cleanHTML || '<p>Start writing your essay...</p>');
          setShowSuggestions(false);
        }

        // Update word count
        setWordCount(
          updatedText
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length
        );

        addToast(`Replaced "${original}" with "${popup.suggestion}"`, {
          type: 'success',
        });
      }

      setPopup(null);
    }
  };

  // Dismiss popup
  const dismissPopup = () => {
    setPopup(null);
  };

  // Highlight inline suggestions in essay text
  const highlightInlineSuggestions = (text: string) => {
    if (!inlineSuggestions || inlineSuggestions.length === 0) {
      return text;
    }

    let highlightedText = text;

    // Sort suggestions by original text length (longest first) to avoid overlap issues
    const sortedSuggestions = [...inlineSuggestions]
      .filter((s) => !s.applied)
      .sort((a, b) => b.original.length - a.original.length);

    sortedSuggestions.forEach((suggestion) => {
      const regex = new RegExp(escapeRegExp(suggestion.original), 'g');
      const colorClass = getSuggestionTypeColor(suggestion.type);

      highlightedText = highlightedText.replace(
        regex,
        `<span class="inline-suggestion cursor-pointer ${colorClass} px-1 rounded border-b-2 border-dashed"
              data-suggestion-id="${suggestion.id}"
              data-suggestion-type="${suggestion.type}"
              title="${suggestion.reason}">
          ${suggestion.original}
        </span>`
      );
    });

    return highlightedText;
  };

  // Escape regex special characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Function to check word limit and get status
  const getWordLimitStatus = () => {
    if (essayLimitType !== 'words') return null; // Only check for word limits

    const count = wordCount;
    const limit = essayLimit;
    const delta = count - limit; // positive = over, negative = under

    if (delta > 0) {
      const pctOver = Math.round((delta / limit) * 100);
      return {
        type: 'warning' as const,
        message: `Essay exceeds target word limit (${count}/${limit} words – Over by ${delta} words, +${pctOver}%)`,
      };
    }

    if (delta < 0) {
      const pctUnder = Math.abs(Math.round((delta / limit) * 100));
      return {
        type: 'warning' as const,
        message: `Essay is under target word limit (${count}/${limit} words – Under by ${Math.abs(delta)} words, −${pctUnder}%)`,
      };
    }

    return {
      type: 'success' as const,
      message: `Essay meets target word limit (${count}/${limit} words)`,
    };
  };

  // Function to check grammar using LanguageTool API (free) - following exact instructions
  const checkGrammar = async (text: string) => {
    try {
      const res = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          text,
          language: 'en-US',
        }),
      });

      const data = await res.json();

      return data.matches.map((m: any) => ({
        message: m.message,
        suggestion: m.replacements[0]?.value || null,
        start: m.offset,
        end: m.offset + m.length,
        type: m.rule.issueType, // e.g. spelling, grammar
      }));
    } catch (error) {
      console.error('LanguageTool API error:', error);
      addToast(
        'Grammar check temporarily unavailable. Please try again later.',
        { type: 'error' }
      );
      return [];
    }
  };

  // Function to highlight text with errors - Grammarly-like implementation
  const highlightText = (text: string, errors: any[]) => {
    if (!errors || errors.length === 0) {
      console.log('No errors to highlight');
      return text;
    }

    console.log('Input text length:', text.length);
    console.log('Number of errors:', errors.length);

    let highlighted = '';
    let lastIndex = 0;

    // Sort errors by start position to avoid overlap issues
    const sortedErrors = [...errors].sort((a, b) => a.start - b.start);
    console.log('Sorted errors:', sortedErrors);

    sortedErrors.forEach((err) => {
      if (err.start < 0 || err.end > text.length || err.start >= err.end) {
        console.warn('Invalid error range:', err);
        return;
      }

      highlighted += text.slice(lastIndex, err.start);
      const cssClass =
        err.type === 'misspelling' ? 'spelling-error' : 'grammar-error';
      const errorText = text.slice(err.start, err.end);
      const suggestionText = err.suggestion || 'No suggestion';
      const messageText = err.message || 'Grammar/spelling issue';

      // Wrap errors in <span> with metadata for Grammarly-like functionality
      highlighted += `<span
        class="${cssClass}"
        data-suggestion="${suggestionText}"
        data-message="${messageText}"
        data-original="${errorText}"
        data-start="${err.start}"
        data-end="${err.end}">
        ${errorText}
      </span>`;
      lastIndex = err.end;
    });

    highlighted += text.slice(lastIndex);
    console.log('Final highlighted HTML:', highlighted);
    return highlighted;
  };

  // Landing Page
  const [hasReadInstructionsLanding, setHasReadInstructionsLanding] =
    useState(false);
  const [errorLanding, setErrorLanding] = useState<string | null>(null);

  const instructionsText = `This module helps you evaluate, refine, and elevate your essay drafts. Revisit your brainstormed structure before uploading to ensure your essay evaluation is consistent with your narrative, goals and school prompts. Upload your written draft to receive targeted AI suggestions, integrate counselor feedback, and iterate through multiple versions. Review all AI and counselor suggestions carefully. Decide what resonates with your voice, and make changes that align with your intended story and tone. Credits are limited per user, so use each upload mindfully. Make sure your essay version is complete and ready for feedback before submitting to maximize the value you receive.`;

  const handleListenInstructions = () => {
    // Add TTS functionality here if needed
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(instructionsText);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartEssayEvaluator = () => {
    if (!hasReadInstructionsLanding) {
      setErrorLanding('Please read all instructions before proceeding');
      return;
    }
    startNewEssay();
  };

  if (currentView === 'landing') {
    return (
      <div className="h-full overflow-auto bg-white">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                <span className="font-semibold text-white">H</span>
              </div>
              <span className="text-xl font-semibold">HelloIvy</span>
              <span className="text-blue-500">✓</span>
            </div>
          </div>

          {/* Title Section */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl font-bold">📝 Essay Evaluator</h1>
            <p className="text-lg text-gray-700">
              Ready to Evaluate Your Essays?
            </p>
          </div>

          {/* Instructions Box */}
          <div className="mb-6 rounded-lg border-2 border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Go Through Instructions Before We Start The Module
              </h2>
              <button
                onClick={handleListenInstructions}
                className="flex items-center gap-1 font-medium text-orange-500"
              >
                🔊 Listen
              </button>
            </div>

            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="min-w-5 font-semibold">1</span>
                <span>
                  This module helps you evaluate, refine, and elevate your essay
                  drafts.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="min-w-5 font-semibold">2</span>
                <span>
                  Revisit your brainstormed structure before uploading. It will
                  ensure your essay evaluation is consistent with your
                  narrative, goals and school prompts.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="min-w-5 font-semibold">3</span>
                <span>
                  Upload your written draft to receive targeted AI suggestions,
                  integrate counselor feedback, and iterate through multiple
                  versions.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="min-w-5 font-semibold">4</span>
                <span>Review all AI and counselor suggestions carefully.</span>
              </li>
              <li className="flex gap-3">
                <span className="min-w-5 font-semibold">5</span>
                <span>
                  Decide what resonates with your voice, and make changes that
                  align with your intended story and tone.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="min-w-5 font-semibold">6</span>
                <span>
                  Credits are limited per user, so use each upload mindfully.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="min-w-5 font-semibold">7</span>
                <span>
                  Make sure your essay version is complete and ready for
                  feedback before submitting to maximize the value you receive.
                </span>
              </li>
            </ol>

            {errorLanding && (
              <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorLanding}
              </div>
            )}

            <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={hasReadInstructionsLanding}
                  onChange={(e) =>
                    setHasReadInstructionsLanding(e.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I have read all the instructions mentioned above.
                </span>
              </label>
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStartEssayEvaluator}
              disabled={!hasReadInstructionsLanding}
              className="rounded-lg bg-blue-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup Page
  if (currentView === 'setup') {
    return (
      <div className="h-full overflow-auto bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-2 text-sm font-medium text-orange-500">
              New Essay Evolution
            </div>
            <div className="mb-6 flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <div className="h-2 w-2 rounded-full bg-gray-300"></div>
              <div className="h-2 w-2 rounded-full bg-gray-300"></div>
            </div>
          </div>

          {/* Instructions Card */}
          {showInstructions && (
            <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Instructions
                </h2>
                <Button
                  variant="outline"
                  label="🔊 Listen"
                  className="border-orange-200 text-orange-500 hover:bg-orange-50"
                />
              </div>
              <div className="mb-4 text-sm text-gray-600">
                Lorem ipsum dolor sit amet consectetur. Aliquet volutpat eget
                sed tellus arcu suscipit gravida amet sagittis. Quam rhoncus
                faucibus sed turpis sit sociis faucibus leo enim. Egestas nec
                facilisis scelerisque tortor interdum massa sem nibh pellent...
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="flex items-center gap-1 text-sm font-medium text-blue-500 hover:text-blue-600"
              >
                Read more{' '}
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-blue-500 text-xs">
                  ?
                </span>
              </button>
            </div>
          )}

          {/* Chat Bubble */}
          <div className="relative mb-8">
            <div className="absolute top-4 -left-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-purple-400 via-blue-400 to-cyan-400">
                <div className="flex gap-1">
                  <div className="h-1 w-1 animate-pulse rounded-full bg-white"></div>
                  <div
                    className="h-1 w-1 animate-pulse rounded-full bg-white"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="h-1 w-1 animate-pulse rounded-full bg-white"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="ml-8 rounded-2xl border border-purple-200 bg-linear-to-r from-purple-50 to-cyan-50 p-4">
              <p className="text-gray-700">
                Let's choose the college and the essay topic to start with the
                brainstorming session.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveSetupTab('topic')}
                className={`flex items-center gap-2 px-6 py-3 font-medium ${
                  activeSetupTab === 'topic'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span
                  className={
                    activeSetupTab === 'topic'
                      ? 'text-blue-500'
                      : 'text-gray-400'
                  }
                >
                  📝
                </span>{' '}
                Essay Topic
              </button>
              <button
                onClick={() => setActiveSetupTab('essay')}
                className={`flex items-center gap-2 px-6 py-3 font-medium ${
                  activeSetupTab === 'essay'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span
                  className={
                    activeSetupTab === 'essay'
                      ? 'text-blue-500'
                      : 'text-gray-400'
                  }
                >
                  📄
                </span>{' '}
                Essay
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="rounded-xl border bg-white p-8 shadow-sm">
            {activeSetupTab === 'topic' ? (
              <>
                {/* New Essay Section */}
                <div className="mb-8">
                  <label className="mb-4 block text-sm font-medium text-gray-900">
                    New Essay <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={newEssayPrompt}
                      onChange={(e) => setNewEssayPrompt(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Enter your essay prompt..."
                    />
                    {/* Icons in the textarea corner */}
                    <div className="absolute right-3 bottom-3 flex gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                        <span className="text-xs text-green-600">✓</span>
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-xs text-gray-600">@</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Since this Essay has not been Brainstormed, it will be
                    evaluated without an Essay structure.
                  </p>
                </div>

                {/* Essay Limit */}
                <div className="mb-8">
                  <label className="mb-4 block text-sm font-medium text-gray-900">
                    Essay Limit
                  </label>
                  <div className="mb-4 flex flex-wrap gap-4">
                    {[
                      { value: 'words', label: 'Words' },
                      {
                        value: 'characters_with_space',
                        label: 'Characters With Space',
                      },
                      {
                        value: 'characters_without_space',
                        label: 'Characters Without Space',
                      },
                      { value: 'pages_single', label: 'Pages Single Space' },
                      { value: 'pages_double', label: 'Pages Double Space' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="essayLimit"
                          value={option.value}
                          checked={essayLimitType === option.value}
                          onChange={(e) =>
                            setEssayLimitType(e.target.value as any)
                          }
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={essayLimit}
                    onChange={(e) => setEssayLimit(parseInt(e.target.value))}
                    className="w-32 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="250"
                  />
                </div>

                {/* College Information */}
                <div className="mb-8 grid gap-6 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      College <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedCollege}
                      onChange={(e) => setSelectedCollege(e.target.value)}
                      placeholder="Brynmawr"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Degree <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedDegree}
                      onChange={(e) => setSelectedDegree(e.target.value)}
                      placeholder="Bachelor of Fine Arts (BA)"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Major <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedMajor}
                      onChange={(e) => setSelectedMajor(e.target.value)}
                      placeholder="Graphic Design"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-right">
                  <Button
                    onClick={() => setActiveSetupTab('essay')}
                    variant="primary"
                    label="Next: Upload Essay →"
                    className="px-8 py-3"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Essay Upload Tab */}
                <div className="mb-8">
                  <label className="mb-4 block text-sm font-medium text-gray-900">
                    Upload Essay <span className="text-red-500">*</span>
                  </label>

                  {/* File Upload Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center transition-colors hover:border-blue-400"
                  >
                    <input
                      type="file"
                      accept=".docx,.pdf,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                          <svg
                            className="h-6 w-6 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <p className="mb-2 font-medium text-blue-600">
                          Click to Upload
                        </p>
                        <p className="mb-2 text-sm text-gray-500">
                          or Drag & Drop
                        </p>
                        <p className="text-sm text-gray-400">
                          .docx (max. 10mb)
                        </p>
                      </div>
                    </label>
                  </div>

                  {uploadedFile && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-sm font-medium text-green-800">
                        File uploaded: {uploadedFile.name}
                      </p>
                    </div>
                  )}
                </div>

                <div className="my-6 text-center">
                  <span className="font-medium text-gray-400">OR</span>
                </div>

                {/* Paste from Clipboard */}
                <div className="mb-8">
                  <label className="mb-4 block text-sm font-medium text-gray-900">
                    Paste from clipboard
                  </label>
                  <div className="relative">
                    <textarea
                      value={pastedEssayText}
                      onChange={(e) => setPastedEssayText(e.target.value)}
                      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-4 font-mono text-sm leading-relaxed focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      rows={12}
                      placeholder="Paste your essay content here..."
                    />
                    <div className="absolute top-3 right-3 rounded bg-white px-2 py-1 text-xs text-gray-500">
                      {essayWordCount}/250
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-right">
                  <Button
                    onClick={() => {
                      // Set the form data to the essay fields
                      // Convert plain text to HTML paragraphs for rich text editor
                      const htmlContent = pastedEssayText
                        .split('\n\n')
                        .map((paragraph) => paragraph.trim())
                        .filter((paragraph) => paragraph.length > 0)
                        .map((paragraph) => `<p>${paragraph}</p>`)
                        .join('');
                      setEssayContent(
                        htmlContent || '<p>Start writing your essay...</p>'
                      );
                      setEssayTitle('New Essay'); // Set a default title since we removed the title field
                      setQuestionType(newEssayPrompt);
                      setCollegeDegree(
                        `${selectedCollege} - ${selectedDegree} - ${selectedMajor}`
                      );
                      proceedToWorkspace();
                    }}
                    variant="primary"
                    label="Continue →"
                    className="px-8 py-3"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Essays List Page
  if (currentView === 'essays') {
    return (
      <div className="h-full overflow-auto bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <Heading level={2}>My Essays</Heading>
            <div className="flex gap-3">
              <Button
                onClick={startNewEssay}
                variant="primary"
                label="New Essay"
                iconLeft={<PlusIcon className="h-4 w-4" />}
              />
              <Button
                onClick={() => setCurrentView('landing')}
                variant="outline"
                label="Back"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {essays.length === 0 ? (
              <div className="py-12 text-center">
                <Paragraph className="text-gray-500">
                  No essays yet. Start by creating your first essay!
                </Paragraph>
              </div>
            ) : (
              essays.map((essay) => (
                <div
                  key={essay.id}
                  className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-semibold">
                        {essay.title}
                      </h3>
                      <p className="mb-2 text-gray-600">
                        {essay.question_type}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Words: {essay.word_count || 0}</span>
                        {essay.overall_score && (
                          <span
                            className={`font-medium ${getScoreColor(essay.overall_score)}`}
                          >
                            Score: {essay.overall_score}
                          </span>
                        )}
                        <span>v{essay.version_number || 1}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => openEssay(essay)}
                      variant="outline"
                      label="Open"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Essay Workspace
  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Heading level={2}>Essay Workspace</Heading>
            {currentEssayId && (
              <p className="text-gray-600">
                Version {currentAnalysis?.version_number || 1}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setCurrentView('essays')}
              variant="outline"
              label="My Essays"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Essay Editor */}
          <div className="space-y-6">
            {/* Essay Content Editor */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Essay Content</h3>
                <div className="text-sm text-gray-500">{wordCount} words</div>
              </div>

              {/* Word Limit Status */}
              {(() => {
                const status = getWordLimitStatus();
                if (!status) return null;

                return (
                  <div
                    className={`mb-4 rounded-lg border p-3 ${
                      status.type === 'warning'
                        ? 'border-red-200 bg-red-50 text-red-800'
                        : 'border-green-200 bg-green-50 text-green-800'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">
                        {status.type === 'warning' ? '⚠️' : '✅'}
                      </span>
                      <span className="text-sm font-medium">
                        {status.message}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 rounded-t-lg border border-gray-300 bg-gray-50 p-2">
                <button
                  onClick={() => formatText('bold')}
                  className="rounded p-1.5 font-bold text-gray-700 hover:bg-gray-200"
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => formatText('italic')}
                  className="rounded p-1.5 text-gray-700 italic hover:bg-gray-200"
                  title="Italic"
                >
                  I
                </button>
                <button
                  onClick={() => formatText('underline')}
                  className="rounded p-1.5 text-gray-700 underline hover:bg-gray-200"
                  title="Underline"
                >
                  U
                </button>

                <div className="mx-1 h-6 w-px bg-gray-300"></div>

                <button
                  onClick={() => formatText('justifyLeft')}
                  className="rounded p-1.5 text-gray-700 hover:bg-gray-200"
                  title="Align Left"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => formatText('justifyCenter')}
                  className="rounded p-1.5 text-gray-700 hover:bg-gray-200"
                  title="Center"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm-2 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => formatText('justifyRight')}
                  className="rounded p-1.5 text-gray-700 hover:bg-gray-200"
                  title="Align Right"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm-6 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => formatText('justifyFull')}
                  className="rounded p-1.5 text-gray-700 hover:bg-gray-200"
                  title="Justify"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <div className="mx-1 h-6 w-px bg-gray-300"></div>

                <button
                  onClick={() => formatText('insertUnorderedList')}
                  className="rounded p-1.5 text-gray-700 hover:bg-gray-200"
                  title="Bullet List"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 100 2 1 1 0 000-2zM6 4a1 1 0 000 2h11a1 1 0 100-2H6zM3 9a1 1 0 100 2 1 1 0 000-2zM6 9a1 1 0 000 2h11a1 1 0 100-2H6zM3 14a1 1 0 100 2 1 1 0 000-2zM6 14a1 1 0 000 2h11a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => formatText('insertOrderedList')}
                  className="rounded p-1.5 text-gray-700 hover:bg-gray-200"
                  title="Numbered List"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <div className="mx-1 h-6 w-px bg-gray-300"></div>

                <button
                  onClick={() => formatText('undo')}
                  className="rounded p-1.5 text-gray-700 hover:bg-gray-200"
                  title="Undo"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 011.414 1.414L6.414 10l3.293 3.293a1 1 0 010 1.414zm4 0a1 1 0 01-1.414 0L7.586 10l4.707-4.707a1 1 0 111.414 1.414L10.414 10l3.293 3.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => formatText('redo')}
                  className="rounded p-1.5 text-gray-700 hover:bg-gray-200"
                  title="Redo"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4.707 4.707-4.707 4.707a1 1 0 01-1.414-1.414L13.586 10l-3.293-3.293a1 1 0 010-1.414zm-6 0a1 1 0 011.414 0L10.414 10l-4.707 4.707a1 1 0 01-1.414-1.414L7.586 10 4.293 6.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <div className="mx-1 h-6 w-px bg-gray-300"></div>

                <button
                  onClick={async () => {
                    if (!showSuggestions) {
                      // Start grammar check
                      const plainText =
                        editorRef?.innerText || editorRef?.textContent || '';
                      if (plainText.trim().length < 10) {
                        addToast(
                          'Please write at least 10 characters for grammar check.',
                          { type: 'error' }
                        );
                        return;
                      }

                      addToast('Checking grammar with LanguageTool...', {
                        type: 'success',
                      });

                      try {
                        // Use the simplified checkGrammar function
                        const errors = await checkGrammar(plainText);

                        // Store errors in persistent state for highlighting
                        setGrammarErrors(errors);

                        // Apply inline highlighting directly in the editor
                        if (errors.length > 0 && editorRef) {
                          console.log(
                            'Applying highlights for errors:',
                            errors
                          );
                          const highlightedHTML = highlightText(
                            plainText,
                            errors
                          );
                          console.log(
                            'Generated highlighted HTML:',
                            highlightedHTML
                          );

                          // Force update the editor content
                          editorRef.innerHTML = highlightedHTML;
                          setEssayContent(highlightedHTML);
                          setShowSuggestions(true); // Show the grammar check is active
                        } else {
                          setShowSuggestions(false);
                        }

                        if (errors.length === 0) {
                          addToast('No grammar or spelling issues found! ✅', {
                            type: 'success',
                          });
                        } else {
                          addToast(
                            `Found ${errors.length} issue${errors.length > 1 ? 's' : ''} for improvement.`,
                            { type: 'success' }
                          );
                        }
                      } catch (error) {
                        addToast('Grammar check failed. Please try again.', {
                          type: 'error',
                        });
                      }
                    } else {
                      // Turn off grammar check and remove highlighting
                      setShowSuggestions(false);
                      setGrammarErrors([]); // Clear persistent errors

                      // Remove highlighting by setting clean content
                      if (editorRef) {
                        const plainText =
                          editorRef.innerText || editorRef.textContent || '';
                        // Convert plain text back to simple paragraphs
                        const cleanHTML = plainText
                          .split('\n\n')
                          .map((para) => `<p>${para.trim()}</p>`)
                          .join('');
                        editorRef.innerHTML =
                          cleanHTML || '<p>Start writing your essay...</p>';
                        setEssayContent(editorRef.innerHTML);
                      }
                    }
                  }}
                  className={`rounded p-1.5 text-gray-700 hover:bg-gray-200 ${showSuggestions ? 'bg-blue-100 text-blue-600' : ''}`}
                  title="Grammar Check (LanguageTool)"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Rich Text Editor with Grammarly-like functionality */}
              <div
                ref={setEditorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onClick={handleErrorClick}
                className="min-h-[400px] w-full resize-none rounded-b-lg border border-t-0 border-gray-300 px-4 py-4 text-sm leading-relaxed outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
                dangerouslySetInnerHTML={{
                  __html: highlightInlineSuggestions(
                    essayContent || '<p>Start writing your essay...</p>'
                  ),
                }}
              />

              {/* Grammarly-style CSS */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                  .spelling-error, .grammar-error {
                    cursor: pointer;
                    position: relative;
                    display: inline;
                  }

                  .spelling-error {
                    text-decoration: red wavy underline !important;
                  }

                  .grammar-error {
                    text-decoration: green wavy underline !important;
                  }

                  .spelling-error:hover, .grammar-error:hover {
                    background-color: rgba(255, 255, 0, 0.2) !important;
                  }

                  /* Popup card styles */
                  .grammar-popup {
                    position: absolute;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-size: 13px;
                    z-index: 1000;
                    min-width: 200px;
                    max-width: 300px;
                  }

                  .grammar-popup .popup-header {
                    padding: 8px 12px;
                    border-bottom: 1px solid #eee;
                    font-weight: 600;
                    font-size: 12px;
                    text-transform: uppercase;
                    color: #666;
                  }

                  .grammar-popup .popup-body {
                    padding: 12px;
                  }

                  .grammar-popup .popup-message {
                    margin: 0 0 8px 0;
                    color: #333;
                    line-height: 1.4;
                  }

                  .grammar-popup .popup-buttons {
                    display: flex;
                    gap: 8px;
                  }

                  .grammar-popup .popup-apply {
                    padding: 6px 12px;
                    border: none;
                    background: #007bff;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                  }

                  .grammar-popup .popup-apply:hover {
                    background: #0056b3;
                  }

                  .grammar-popup .popup-dismiss {
                    padding: 6px 12px;
                    border: 1px solid #ccc;
                    background: white;
                    color: #666;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                  }

                  .grammar-popup .popup-dismiss:hover {
                    background: #f8f9fa;
                  }

                  /* Inline suggestion styles */
                  .inline-suggestion {
                    cursor: pointer;
                    transition: all 0.2s ease;
                  }

                  .inline-suggestion:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  }
                `,
                }}
              />

              {/* Grammarly-style Popup Card */}
              {popup && (
                <div
                  className="grammar-popup"
                  style={{
                    top: popup.y,
                    left: popup.x,
                  }}
                >
                  <div className="popup-header">{popup.type} Error</div>
                  <div className="popup-body">
                    <p className="popup-message">{popup.message}</p>
                    <div className="popup-buttons">
                      <button
                        className="popup-apply"
                        onClick={applyGrammarSuggestion}
                      >
                        {popup.suggestion}
                      </button>
                      <button className="popup-dismiss" onClick={dismissPopup}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Auto-saved • Last updated 2 min ago
                </div>

                <div className="flex gap-3">
                  {currentAnalysis && (
                    <Button
                      onClick={() => analyzeEssay(true)}
                      variant="outline"
                      disabled={isReEvaluating}
                      label="Re-evaluate"
                      iconLeft={
                        <ArrowPathIcon
                          className={`h-4 w-4 ${isReEvaluating ? 'animate-spin' : ''}`}
                        />
                      }
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Grammar Check Summary - Compact Version */}
            {showSuggestions && grammarErrors.length > 0 && (
              <div className="fixed top-20 right-4 left-4 z-50 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg lg:right-auto lg:left-[50%] lg:w-[calc(50%-3rem)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 h-3 w-3 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Grammar Check Active
                      </p>
                      <p className="text-xs text-blue-700">
                        {grammarErrors.length} issue
                        {grammarErrors.length > 1 ? 's' : ''} remaining. Click
                        on underlined text to apply suggestions.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSuggestions(false);
                      setGrammarErrors([]); // Clear persistent errors
                      // Remove highlighting
                      if (editorRef) {
                        const plainText =
                          editorRef.innerText || editorRef.textContent || '';
                        const cleanHTML = plainText
                          .split('\n\n')
                          .map((para) => `<p>${para.trim()}</p>`)
                          .join('');
                        editorRef.innerHTML =
                          cleanHTML || '<p>Start writing your essay...</p>';
                        setEssayContent(editorRef.innerHTML);
                      }
                    }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Turn Off
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Analysis */}
          <div className="space-y-6">
            {/* Evaluation System Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Evaluation System
                  </h3>
                  <p className="text-sm text-gray-600">
                    Get detailed 5-criteria scoring and comprehensive feedback
                    using our system.
                  </p>
                </div>
                <button
                  onClick={() => setShowRagPanel(!showRagPanel)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showRagPanel ? ' ' : 'Show Panel'}
                </button>
              </div>

              {showRagPanel && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={async () => {
                      await analyzeEssay(false);
                      await analyzeEssayWithRAG();
                    }}
                    disabled={isRagAnalyzing || isAnalyzing || wordCount < 20}
                    className="w-full rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-6 py-3 font-medium text-white transition-all duration-200 hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRagAnalyzing || isAnalyzing
                      ? 'Analyzing...'
                      : 'Analyze with System'}
                  </button>

                  {(ragAnalysis || currentAnalysis) && (
                    <button
                      onClick={handleDownloadReport}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-green-600 to-emerald-500 px-6 py-3 font-medium text-white transition-all duration-200 hover:from-green-700 hover:to-emerald-600"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Download Report
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 5-Criteria Evaluation Results */}
            {showRagPanel && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-semibold text-gray-900">
                  5-Criteria Evaluation
                </h3>

                <div className="space-y-4">
                  {ragAnalysis?.analysis?.criteria ? (
                    Object.entries(ragAnalysis.analysis.criteria).map(
                      ([key, criteria]) => (
                        <div
                          key={key}
                          className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                        >
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-900">
                              {
                                criteriaLabels[
                                  key as keyof typeof criteriaLabels
                                ]
                              }
                            </span>
                          </div>

                          {criteria?.feedback && (
                            <p className="text-sm leading-relaxed text-gray-700">
                              {criteria.feedback}
                            </p>
                          )}
                        </div>
                      )
                    )
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      Click "Analyze with System" to see detailed evaluation
                      criteria
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RAG Analysis Tabs - Summary, Suggestions, Comments, Structure */}
            {showRagPanel && ragAnalysis && (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b">
                  <div className="flex">
                    {(
                      [
                        'summary',
                        'suggestions',
                        'comments',
                        'structure',
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium capitalize ${
                          activeTab === tab
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === 'summary' && (
                    <div>
                      <h4 className="mb-3 font-medium text-gray-900">
                        Summary
                      </h4>
                      {ragAnalysis?.analysis?.summary ? (
                        <div className="rounded-lg bg-gray-50 p-4">
                          <p className="text-gray-700">
                            {ragAnalysis.analysis.summary}
                          </p>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-gray-500">
                          No summary available
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'suggestions' && (
                    <div className="space-y-4">
                      <h4 className="mb-3 font-medium text-gray-900">
                        Suggestions
                      </h4>
                      {ragAnalysis?.analysis?.suggestions ? (
                        typeof ragAnalysis.analysis.suggestions === 'object' &&
                        'primary' in ragAnalysis.analysis.suggestions ? (
                          <div>
                            <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
                              <button
                                onClick={() => setSuggestionType('primary')}
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                  suggestionType === 'primary'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                Required Changes
                              </button>
                              <button
                                onClick={() => setSuggestionType('alternative')}
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                  suggestionType === 'alternative'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                Good To Have
                              </button>
                            </div>
                            <div className="space-y-3">
                              {(() => {
                                const selectedSuggestions =
                                  suggestionType === 'primary'
                                    ? ragAnalysis.analysis.suggestions.primary
                                    : ragAnalysis.analysis.suggestions
                                        .alternative;
                                return selectedSuggestions?.map(
                                  (suggestion: string, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-start"
                                    >
                                      <span
                                        className={`mt-0.5 mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                                          suggestionType === 'primary'
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-green-100 text-green-600'
                                        }`}
                                      >
                                        {index + 1}
                                      </span>
                                      <p className="text-sm text-gray-700">
                                        {suggestion}
                                      </p>
                                    </div>
                                  )
                                );
                              })()}
                            </div>
                          </div>
                        ) : Array.isArray(ragAnalysis.analysis.suggestions) ? (
                          <div className="space-y-3">
                            {ragAnalysis.analysis.suggestions.map(
                              (suggestion, index) => (
                                <div key={index} className="flex items-start">
                                  <span className="mt-0.5 mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                                    {index + 1}
                                  </span>
                                  <p className="text-sm text-gray-700">
                                    {suggestion}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-gray-500">
                            No suggestions available
                          </div>
                        )
                      ) : (
                        <div className="py-4 text-center text-gray-500">
                          No suggestions available
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'comments' && (
                    <div>
                      <h4 className="mb-3 font-medium text-gray-900">
                        Admissions Perspective
                      </h4>
                      {ragAnalysis?.analysis?.admissions_perspective ? (
                        typeof ragAnalysis.analysis.admissions_perspective ===
                        'object' ? (
                          <div className="space-y-4">
                            <div className="rounded-lg border-l-4 border-green-400 bg-green-50 p-4">
                              <h5 className="mb-2 font-medium text-green-900">
                                What's Good
                              </h5>
                              <p className="text-sm text-green-800">
                                {
                                  ragAnalysis.analysis.admissions_perspective
                                    .positive
                                }
                              </p>
                            </div>
                            <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
                              <h5 className="mb-2 font-medium text-yellow-900">
                                Areas for Improvement
                              </h5>
                              <p className="text-sm text-yellow-800">
                                {
                                  ragAnalysis.analysis.admissions_perspective
                                    .critical
                                }
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-sm text-gray-700">
                              {ragAnalysis.analysis.admissions_perspective}
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="py-4 text-center text-gray-500">
                          No admissions perspective available
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'structure' && (
                    <div>
                      <h4 className="mb-3 font-medium text-gray-900">
                        Structure Analysis
                      </h4>
                      <div className="space-y-3">
                        {ragAnalysis?.analysis?.detailed_feedback?.annotations?.map(
                          (annotation, index) => (
                            <div
                              key={index}
                              className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4"
                            >
                              {annotation.essay_line && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-blue-900">
                                    Essay Line:
                                  </span>
                                  <p className="mt-1 text-sm text-blue-800 italic">
                                    "{annotation.essay_line}"
                                  </p>
                                </div>
                              )}
                              <div>
                                <span className="text-xs font-medium text-blue-900">
                                  Recommendation:
                                </span>
                                <p className="mt-1 text-sm text-blue-800">
                                  {annotation.recommended_change ||
                                    annotation.recommendation}
                                </p>
                              </div>
                            </div>
                          )
                        ) || (
                          <div className="py-4 text-center text-gray-500">
                            No structure feedback available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Original Inline Analysis Results (for reference only) */}
            {currentAnalysis && !showRagPanel && (
              <>
                {/* Analysis Status */}
                <div className="rounded-lg bg-white p-6 text-center shadow">
                  <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                    <span className="text-2xl font-bold text-green-600">✓</span>
                  </div>
                  <h3 className="text-lg font-semibold">Evaluation Complete</h3>
                  <p className="text-sm text-gray-600">
                    Processing time:{' '}
                    {currentAnalysis.processing_time?.toFixed(1)}s
                  </p>
                </div>

                {/* 5 Criteria Sections */}
                <div className="rounded-lg bg-white shadow">
                  <div className="border-b p-6">
                    <h3 className="text-lg font-semibold">
                      {currentAnalysis?.analysis?.improvement_checks
                        ? 'Essay Evaluation & Recommendations'
                        : currentAnalysis?.analysis?.annotations
                          ? 'Specific Feedback & Recommendations'
                          : 'Evaluation Criteria'}
                    </h3>
                  </div>

                  <div className="divide-y">
                    {/* Show new format with improvement checks */}
                    {(() => {
                      if (currentAnalysis?.analysis?.improvement_checks) {
                        return (
                          <div className="p-6">
                            <h4 className="mb-3 font-medium">
                              Improvement Areas
                            </h4>
                            {Object.entries(
                              currentAnalysis.analysis.improvement_checks
                            ).map(([category, checks]) => (
                              <div key={category} className="mb-6">
                                <h5 className="mb-3 font-medium text-gray-900 capitalize">
                                  {category.replace(/_/g, ' ')}
                                </h5>
                                <div className="space-y-3">
                                  {Array.isArray(checks) ? (
                                    checks.map((check: any, index: number) => (
                                      <div
                                        key={index}
                                        className="rounded-lg border-l-4 border-blue-400 bg-gray-50 p-3"
                                      >
                                        <div className="mb-2">
                                          <span className="text-sm font-medium text-gray-900">
                                            {check.check}:
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-700">
                                          {check.feedback}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="rounded-lg bg-gray-50 p-3">
                                      <p className="text-sm text-gray-700">
                                        {JSON.stringify(checks)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      if (currentAnalysis?.analysis?.annotations) {
                        return (
                          <div className="p-6">
                            <h4 className="mb-3 font-medium">
                              Specific Feedback
                            </h4>
                            {currentAnalysis.analysis.annotations.map(
                              (annotation, index) => (
                                <div
                                  key={index}
                                  className="mb-4 rounded-lg border-l-4 border-blue-400 bg-blue-50 p-3"
                                >
                                  <div className="mb-2">
                                    <span className="text-sm font-medium text-blue-900">
                                      Essay Line:
                                    </span>
                                    <p className="text-sm text-blue-800 italic">
                                      "{annotation.line}"
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-blue-900">
                                      Recommendation:
                                    </span>
                                    <p className="text-sm text-blue-800">
                                      {annotation.recommendation}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        );
                      }

                      if (
                        !currentAnalysis?.analysis?.criteria &&
                        !currentAnalysis?.analysis?.improvement_checks
                      ) {
                        return (
                          <div className="p-6 text-center text-gray-500">
                            No evaluation feedback available. Please run
                            evaluation to see detailed feedback.
                          </div>
                        );
                      }

                      if (currentAnalysis?.analysis?.criteria) {
                        return (
                          <>
                            {Object.entries(
                              currentAnalysis.analysis.criteria || {}
                            ).map(([key, criteria]) => (
                              <div key={key} className="p-4">
                                <button
                                  onClick={() => toggleCriteria(key)}
                                  className="flex w-full items-center justify-between text-left"
                                >
                                  <div className="flex-1">
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="font-medium">
                                        {
                                          criteriaLabels[
                                            key as keyof typeof criteriaLabels
                                          ]
                                        }
                                      </span>
                                      <span className="text-sm text-gray-500">
                                        Click to view feedback
                                      </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-200">
                                      <div className="h-2 w-full rounded-full bg-blue-400" />
                                    </div>
                                  </div>
                                  {expandedCriteria.has(key) ? (
                                    <ChevronUpIcon className="ml-4 h-5 w-5 text-gray-400" />
                                  ) : (
                                    <ChevronDownIcon className="ml-4 h-5 w-5 text-gray-400" />
                                  )}
                                </button>

                                {expandedCriteria.has(key) && (
                                  <div className="mt-3 rounded-lg bg-gray-50 p-3">
                                    <p className="mb-3 text-sm text-gray-700">
                                      {criteria?.feedback ||
                                        'No feedback available'}
                                    </p>

                                    {/* Show sub-scores for narrative impact */}
                                    {key === 'narrative_and_impact' &&
                                      criteria?.sub_scores && (
                                        <div className="space-y-2">
                                          <h4 className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                                            Sub-Scores
                                          </h4>
                                          {Object.entries(
                                            criteria.sub_scores || {}
                                          ).map(([subKey, subScore]) => (
                                            <div
                                              key={subKey}
                                              className="flex items-center justify-between"
                                            >
                                              <span className="text-xs text-gray-600 capitalize">
                                                {subKey.replace('_', ' ')}
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <div className="h-1 w-16 rounded-full bg-gray-200">
                                                  <div
                                                    className={`h-1 rounded-full ${getScoreBarColor(subScore)}`}
                                                    style={{
                                                      width: `${subScore * 10}%`,
                                                    }}
                                                  />
                                                </div>
                                                <span
                                                  className={`text-xs font-medium ${getScoreColor(subScore)}`}
                                                ></span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        );
                      }

                      return (
                        <div className="p-6 text-center text-gray-500">
                          No criteria available for display.
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Analysis Tabs */}
                <div className="rounded-lg bg-white shadow">
                  <div className="border-b">
                    <div className="flex">
                      {(
                        [
                          'summary',
                          'suggestions',
                          'comments',
                          'structure',
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-6 py-3 text-sm font-medium capitalize ${
                            activeTab === tab
                              ? 'border-b-2 border-blue-500 text-blue-600'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6">
                    {activeTab === 'summary' && (
                      <div>
                        <h4 className="mb-3 font-medium text-gray-900">
                          General Recommendations
                        </h4>
                        <div className="rounded-lg bg-gray-50 p-4">
                          <p className="text-gray-700">
                            {currentAnalysis?.analysis?.summary ||
                              'No summary available'}
                          </p>
                        </div>

                        {/* Show improvement checks if available */}
                        {currentAnalysis?.analysis?.improvement_checks && (
                          <div className="mt-6">
                            <h4 className="mb-3 font-medium text-gray-900">
                              36-Point Evaluation Checks
                            </h4>
                            {Object.entries(
                              currentAnalysis.analysis.improvement_checks
                            ).map(([category, checks]) => (
                              <div key={category} className="mb-4">
                                <h5 className="mb-2 text-sm font-medium text-gray-800 capitalize">
                                  {category.replace(/_/g, ' ')}
                                </h5>
                                <div className="space-y-2">
                                  {(checks as any[]).map(
                                    (check: any, index: number) => (
                                      <div
                                        key={index}
                                        className="rounded border-l-4 border-blue-400 bg-blue-50 p-3"
                                      >
                                        <p className="text-sm font-medium text-blue-900">
                                          {check.check}
                                        </p>
                                        <p className="mt-1 text-sm text-blue-800">
                                          {check.feedback}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'suggestions' && (
                      <div className="space-y-4">
                        {/* Enhanced Suggestions with Primary/Alternative Toggle */}
                        {typeof currentAnalysis?.analysis?.suggestions ===
                          'object' &&
                        'primary' in
                          (currentAnalysis.analysis.suggestions || {}) ? (
                          <div>
                            {/* Toggle Buttons */}
                            <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
                              <button
                                onClick={() => setSuggestionType('primary')}
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                  suggestionType === 'primary'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                Required Changes
                              </button>
                              <button
                                onClick={() => setSuggestionType('alternative')}
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                  suggestionType === 'alternative'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                Good To Have
                              </button>
                            </div>

                            {/* Display Selected Suggestions */}
                            <div className="space-y-3">
                              {(() => {
                                const suggestions =
                                  currentAnalysis?.analysis?.suggestions;
                                if (
                                  typeof suggestions === 'object' &&
                                  'primary' in suggestions
                                ) {
                                  const selectedSuggestions =
                                    suggestionType === 'primary'
                                      ? suggestions.primary
                                      : suggestions.alternative;
                                  return selectedSuggestions?.map(
                                    (suggestion: string, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-start"
                                      >
                                        <span
                                          className={`mt-0.5 mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                                            suggestionType === 'primary'
                                              ? 'bg-blue-100 text-blue-600'
                                              : 'bg-green-100 text-green-600'
                                          }`}
                                        >
                                          {index + 1}
                                        </span>
                                        <p className="text-sm text-gray-700">
                                          {suggestion}
                                        </p>
                                      </div>
                                    )
                                  );
                                }
                                return (
                                  <div className="py-4 text-center text-gray-500">
                                    No {suggestionType} suggestions available
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        ) : (
                          // New format with summary or fallback
                          <div className="space-y-3">
                            {currentAnalysis?.analysis?.summary ? (
                              <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
                                <h4 className="mb-2 font-medium text-blue-900">
                                  General Recommendations
                                </h4>
                                <p className="text-sm text-blue-800">
                                  {currentAnalysis.analysis.summary}
                                </p>
                              </div>
                            ) : Array.isArray(
                                currentAnalysis?.analysis?.suggestions
                              ) &&
                              (currentAnalysis?.analysis?.suggestions || [])
                                .length > 0 ? (
                              (
                                currentAnalysis?.analysis?.suggestions || []
                              ).map((suggestion, index) => (
                                <div key={index} className="flex items-start">
                                  <span className="mt-0.5 mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                                    {index + 1}
                                  </span>
                                  <p className="text-sm text-gray-700">
                                    {suggestion}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="py-4 text-center text-gray-500">
                                No suggestions available yet
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'comments' && (
                      <div className="py-8 text-center">
                        <p className="text-gray-500">
                          Counselor comments coming soon...
                        </p>
                      </div>
                    )}

                    {activeTab === 'structure' && (
                      <div>
                        <h4 className="mb-3 font-medium">Next Edit Focus</h4>
                        <p className="rounded-lg bg-yellow-50 p-4 text-gray-700">
                          {currentAnalysis?.analysis?.detailed_feedback
                            ?.next_edit_focus ||
                            'No specific focus area identified yet'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* No analysis message */}
            {!ragAnalysis && !currentAnalysis && (
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <ArrowPathIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Ready to Analyze</h3>
                <p className="mb-4 text-gray-600">
                  Write your essay content and run analysis to get detailed
                  feedback
                </p>
                <p className="text-sm text-gray-500">
                  Current word count: {wordCount}{' '}
                  {wordCount < 20 && '(minimum 20 words required)'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Inline Suggestion Popup (Grammarly-style) */}
        {suggestionPopup && (
          <div
            className="fixed z-50 max-w-80 min-w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
            style={{
              left: suggestionPopup.x,
              top: suggestionPopup.y,
            }}
          >
            <div className="mb-3">
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${getSuggestionTypeColor(suggestionPopup.suggestion.type)}`}
                >
                  {suggestionPopup.suggestion.type.toUpperCase()}
                </span>
                <button
                  onClick={() => setSuggestionPopup(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <p className="mb-3 text-sm text-gray-700">
                {suggestionPopup.suggestion.reason}
              </p>
              <div className="mb-3">
                <div className="mb-1 text-xs text-gray-500">Original:</div>
                <div className="rounded border-l-3 border-red-300 bg-red-50 px-2 py-1 text-sm">
                  {suggestionPopup.suggestion.original}
                </div>
              </div>
              <div className="mb-4">
                <div className="mb-1 text-xs text-gray-500">Suggested:</div>
                <div className="rounded border-l-3 border-green-300 bg-green-50 px-2 py-1 text-sm">
                  {suggestionPopup.suggestion.suggested}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => applySuggestion(suggestionPopup.suggestion.id)}
                className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Accept
              </button>
              <button
                onClick={() => rejectSuggestion(suggestionPopup.suggestion.id)}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EssayEvaluatorPage;
