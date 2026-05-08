import React from 'react';
import ListenButton from '@/app/(saas)/profile/_components/ListenButton';

interface InstructionsProps {
  title?: string;
  content?: string;
  readMoreHref?: string;
  onListen?: () => void;
  action?: React.ReactNode;
}

const Instructions: React.FC<InstructionsProps> = ({
  title = 'Instructions',
  content = `Please provide comprehensive information about your educational background. This includes your degree, field of study, institution details, and academic achievements. Accurate information helps us deliver personalized career guidance and relevant opportunities tailored to your qualifications and goals.`,
  readMoreHref = '#',
  onListen,
  action,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleListen = () => {
    if (onListen) {
      onListen();
      return;
    }
    // Default TTS behavior using Web Speech API
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="rounded-2xl border border-orange-200 bg-white p-5">
      <div className="flex h-8 items-center justify-between">
        <div className="--text-product-h5 font-bold text-neutral-900">
          {title}
        </div>
        <ListenButton onClick={handleListen} />
      </div>
      <div className="mt-2 flex flex-col gap-4">
        <div className={`text-para-sm text-neutral-600 ${expanded ? '' : 'line-clamp-2'}`}>
          {content}
        </div>
        <div className="flex items-center justify-end">
          {action && <div className="mr-4 flex-shrink-0">{action}</div>}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-label-sm cursor-pointer font-medium text-blue-500 hover:text-blue-700"
          >
            {expanded ? 'Show Less' : 'Read More'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
