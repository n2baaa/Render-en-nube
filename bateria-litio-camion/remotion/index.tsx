import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { VideoExplicativo } from './Video';
import timelineJson from '../voz/timeline.json';

const dur = (timelineJson.dur || 57.3) + 0.8;
const fps = 60;
const durationInFrames = Math.round(dur * fps);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VideoExplicativo"
      component={VideoExplicativo}
      durationInFrames={durationInFrames}
      fps={fps}
      width={1080}
      height={1920}
    />
  );
};

registerRoot(RemotionRoot);
