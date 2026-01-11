import { FC, ReactNode, useState } from 'react';
import { Label } from '@/app/_components/Typography';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggleOpen = (): void => setIsOpen((prev) => !prev);

  return (
    <div className="mb-4 rounded-lg border border-neutral-200">
      <div
        className="flex cursor-pointer items-center justify-between border-b border-neutral-200 p-5"
        onClick={toggleOpen}
      >
        <Label size="lg" className="font-semibold text-neutral-900">
          {title}
        </Label>
        <span
          className={`transform text-xl leading-none transition-transform duration-200 pb-100px${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <svg
            className="h-4 w-4 text-gray-800 dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 8"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 5.326 5.7a.909.909 0 0 0 1.348 0L13 1"
            />
          </svg>
        </span>
      </div>

      {isOpen && <div className="bg-white p-4">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
