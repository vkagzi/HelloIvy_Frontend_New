'use client';
import React from 'react';
import Lottie from 'lottie-react';
import brainWithoutBGAnimation from '@/assets/lottie/brain-without-bg.json';
import editingWithoutBGAnimation from '@/assets/lottie/editing-without-bg.json';
import ivyWithoutBGAnimation from '@/assets/lottie/ivy-without-bg.json';
import brainAnimation from '@/assets/lottie/brain.json';
import editingAnimation from '@/assets/lottie/editing.json';
import ivyAnimation from '@/assets/lottie/ivy.json';
type AnyLottieProps = {
  loop?: number | boolean;
  animate?: boolean;
  className?: string;
};
type LottieAnimationProps = {
  animationData: object;
  loop?: number | boolean;
  animate?: boolean;
  className?: string;
  ariaLabel?: string;
};

const LottieAnimation: React.FC<LottieAnimationProps> = ({
  animationData,
  loop = 0,
  animate = true,
  className = '',
  ariaLabel = 'Lottie animation',
}) => {
  // lottie-react uses 'loop' and 'autoplay' props
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={animate}
      className={className}
      aria-label={ariaLabel}
      role="img"
    />
  );
};

const BrainLottie: React.FC<AnyLottieProps> = ({
  loop = 0,
  animate = true,
  className = '',
}) => (
  <LottieAnimation
    animationData={brainAnimation}
    loop={loop}
    animate={animate}
    className={className}
    ariaLabel={'Brain animation'}
  />
);

const EditingLottie: React.FC<AnyLottieProps> = ({
  loop = 0,
  animate = true,
  className = '',
}) => (
  <LottieAnimation
    animationData={editingAnimation}
    loop={loop}
    animate={animate}
    className={className}
    ariaLabel={'Editing animation'}
  />
);

const IvyLottie: React.FC<AnyLottieProps> = ({
  loop = 0,
  animate = true,
  className = '',
}) => (
  <LottieAnimation
    animationData={ivyAnimation}
    loop={loop}
    animate={animate}
    className={className}
    ariaLabel={'Ivy animation'}
  />
);

const BrainWithoutBGLottie: React.FC<AnyLottieProps> = ({
  loop = 0,
  animate = true,
  className = '',
}) => (
  <LottieAnimation
    animationData={brainWithoutBGAnimation}
    loop={loop}
    animate={animate}
    className={className}
    ariaLabel={'Brain without background animation'}
  />
);

const EditingWithoutBGLottie: React.FC<AnyLottieProps> = ({
  loop = 0,
  animate = true,
  className = '',
}) => (
  <LottieAnimation
    animationData={editingWithoutBGAnimation}
    loop={loop}
    animate={animate}
    className={className}
    ariaLabel={'Editing without background animation'}
  />
);
const IvyWithoutBGLottie: React.FC<AnyLottieProps> = ({
  loop = 0,
  animate = true,
  className = '',
}) => (
  <LottieAnimation
    animationData={ivyWithoutBGAnimation}
    loop={loop}
    animate={animate}
    className={className}
    ariaLabel={'Ivy without background animation'}
  />
);

export default LottieAnimation;

export {
  BrainLottie,
  EditingLottie,
  IvyLottie,
  BrainWithoutBGLottie,
  EditingWithoutBGLottie,
  IvyWithoutBGLottie,
};
