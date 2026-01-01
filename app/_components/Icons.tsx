import React from 'react';

// FlatIcons UI Icon Library
// Only import the icons you need for tree-shaking
// Usage: <FiArrowSmallRight className="w-4 h-4" />

type IconProps = {
  name: string;
  className?: string;
};

type IconNameProps = {
  className?: string;
};

const FiIcon: React.FC<IconProps> = ({ name, className = '' }) => {
  // if class doesnot contains h- or w- then add h-4 w-4
  if (!className.includes('h-') && !className.includes('w-')) {
    className += ' h-4 w-4';
  }
  if (!name.startsWith('sr-')) {
    name = `rr-${name}`;
  }
  return <i className={`fi fi-${name} ${className}`.trim()} />;
};

export { FiIcon };

const FiArrowSmallRight: React.FC<IconNameProps> = (props) => (
  <FiIcon name="arrow-small-right" {...props} />
);
export { FiArrowSmallRight };
