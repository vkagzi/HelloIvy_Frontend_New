import { IvyWithoutBGLottie } from '@/app/_components/LottieAnimation';
import { ReactNode } from 'react';

export default function CryptoListBox(): ReactNode {
  return (
    <div className="relative mt-12.5 rounded-2xl bg-[linear-gradient(to_top_right,#3b82f6,#8b5cf6,#10b981,#facc15,#ef4444)] p-[1px]">
      <div className="absolute -top-14 left-4 h-[100px] w-[79.22px] rounded-full p-1">
        <IvyWithoutBGLottie className="h-full w-full bg-white object-contain" />
      </div>

      <div className="bg-white p-6 pt-[48px] pb-[20px] text-neutral-900">
        THETA algorand tether secret quant klaytn livepeer. Decred audius
        siacoin waves chainlink velas IOTA.
      </div>
    </div>
  );
}
