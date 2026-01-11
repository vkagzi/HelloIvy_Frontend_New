import React from 'react';
import ListenButton from '@/app/(saas)/profile/_components/ListenButton';

interface InstructionsProps {
  title?: string;
  content?: string;
  readMoreHref?: string;
  onListen?: () => void;
}

const Instructions: React.FC<InstructionsProps> = ({
  title = 'Instructions',
  content = `Lorem ipsum dolor sit amet consectetur. Aliquet volutpat eget sed tellus arcu suscipit gravida amet sagittis. Quam rhoncus fa ibus sed turpis sit sociis faucibus leo enim.Egestas nec facilisis scelerisque tortor interdum massa sem nibh pellentesque. Lorem ipsum dolor sit amet consectetur. Aliquet volutpat eget sed tellus arcu suscipit gravida amet sagittis. Quam rhoncus fauc ibus sed turpis sit sociis faucibus leo enim.Egestas nec facilisis scelerisque tortor interdum massa sem nibh pellentesque`,
  // readMoreHref = '#',
}) => {
  return (
    <div className="rounded-2xl border border-orange-200 bg-white p-5">
      <div className="flex h-8 items-center justify-between">
        <div className="--text-product-h5 font-bold text-neutral-900">
          {title}
        </div>
        <ListenButton />
      </div>
      <div className="mt-2 flex flex-col gap-4">
        <div className="text-para-sm line-clamp-2 text-neutral-600">
          {content}
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg p-1">
          <div className="text-label-sm font-medium text-blue-500">
            Read More
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
