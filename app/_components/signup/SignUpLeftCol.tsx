'use client';

import { useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import imgTopRightPolygonBackground from '@/assets/images/top-right-polygons.svg';
import imgBottomLeftPolygonBackground from '@/assets/images/bottom-left-polygons.svg';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { BrainWithoutBGLottie } from '@/app/_components/LottieAnimation';
import { EditingWithoutBGLottie } from '@/app/_components/LottieAnimation';
import { IvyWithoutBGLottie } from '@/app/_components/LottieAnimation';

const slides = [
  {
    title: 'Find Your Best Essay Ideas',
    text: 'Use smart tools to brainstorm topics that reflect your story and stand out.',
  },
  {
    title: 'Edit and Refine Your Essays',
    text: 'Get AI-powered suggestions to improve your writing and make your essays shine.',
  },
  {
    title: 'Ivy Assistant',
    text: 'AI Copilot for your college applications',
  },
];
export default function SignUpLeftCol(): React.ReactElement {
  const [current, setCurrent] = useState(0);
  const [isManual, setIsManual] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isManual) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isManual]);

  const handleDotClick = (index: number): void => {
    setCurrent(index);
    setIsManual(true);
  };
  const slideTextContent = (slideNo: number): React.ReactElement => {
    const { title, text } = slides[slideNo];
    return (
      <>
        <Heading level={3} className="mb-2 text-center font-extrabold">
          {title}
        </Heading>
        <Paragraph className="mb-6 text-center" size="sm">
          {text}
        </Paragraph>
      </>
    );
  };
  const slideRender = (slideNo: number): React.ReactElement => {
    return (
      <>
        <div className="mb-2 flex h-40 w-full items-center justify-center">
          {current == 0 && (
            <BrainWithoutBGLottie className="h-full w-full object-contain" />
          )}
          {current == 1 && (
            <EditingWithoutBGLottie className="h-full w-full object-contain" />
          )}
          {current == 2 && (
            <IvyWithoutBGLottie className="h-full w-full object-contain" />
          )}
        </div>
        {slideTextContent(slideNo)}
      </>
    );
  };
  return (
    <div className="signup-background relative hidden overflow-hidden md:flex md:w-2/5 md:items-center md:justify-center">
      {/* polygon on top right half cut */}
      <Image
        src={imgTopRightPolygonBackground}
        alt="Polygon Background"
        className="absolute top-0 right-0"
      />
      {/* polygon on bottom left half cut */}
      <Image
        src={imgBottomLeftPolygonBackground}
        alt="Polygon Background"
        className="absolute bottom-0 left-0"
      />
      <div className="flex flex-col items-center px-8 py-12">
        {/* Illustration placeholder */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="p-6"
          >
            {slideRender(current)}
          </motion.div>
        </AnimatePresence>

        {/* Pagination Dots */}
        <div className="mt-4 flex justify-center space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                current === index ? 'bg-action-gradient-800 w-4' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
