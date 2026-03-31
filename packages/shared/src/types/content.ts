import { ContentType } from './enums.js'

export const VIDEO_TYPES: readonly ContentType[] = [
  ContentType.YOUTUBE_VIDEO,
  ContentType.YOUTUBE_SHORT,
  ContentType.INSTAGRAM_REEL,
  ContentType.TIKTOK_SHORT,
  ContentType.LIVE_STREAM,
  ContentType.WEBINAR,
  ContentType.COURSE_LESSON,
  ContentType.LECTURE_RECORDING,
  ContentType.AD_CREATIVE,
  ContentType.PRODUCT_DEMO
] as const

export const AUDIO_ONLY_TYPES: readonly ContentType[] = [
  ContentType.PODCAST_EPISODE,
  ContentType.PODCAST_CLIP,
  ContentType.AUDIO_AD
] as const

export const SHORT_FORM_TYPES: readonly ContentType[] = [
  ContentType.YOUTUBE_SHORT,
  ContentType.INSTAGRAM_REEL,
  ContentType.TIKTOK_SHORT,
  ContentType.PODCAST_CLIP,
  ContentType.AUDIO_AD,
  ContentType.AD_CREATIVE
] as const

export const EXPECTED_DURATION: Record<ContentType, { minSeconds: number; maxSeconds: number }> = {
  [ContentType.YOUTUBE_VIDEO]: { minSeconds: 60, maxSeconds: 3600 },
  [ContentType.YOUTUBE_SHORT]: { minSeconds: 10, maxSeconds: 180 },
  [ContentType.INSTAGRAM_REEL]: { minSeconds: 5, maxSeconds: 120 },
  [ContentType.TIKTOK_SHORT]: { minSeconds: 5, maxSeconds: 180 },
  [ContentType.PODCAST_EPISODE]: { minSeconds: 300, maxSeconds: 14400 },
  [ContentType.PODCAST_CLIP]: { minSeconds: 15, maxSeconds: 180 },
  [ContentType.AUDIO_AD]: { minSeconds: 5, maxSeconds: 60 },
  [ContentType.LIVE_STREAM]: { minSeconds: 900, maxSeconds: 21600 },
  [ContentType.WEBINAR]: { minSeconds: 900, maxSeconds: 14400 },
  [ContentType.COURSE_LESSON]: { minSeconds: 180, maxSeconds: 5400 },
  [ContentType.LECTURE_RECORDING]: { minSeconds: 600, maxSeconds: 7200 },
  [ContentType.AD_CREATIVE]: { minSeconds: 5, maxSeconds: 90 },
  [ContentType.PRODUCT_DEMO]: { minSeconds: 20, maxSeconds: 900 }
}

export const METRICS_BY_CONTENT_TYPE: Record<
  ContentType,
  { hook: string; boredom: string; emotion: string; analysisBadge: 'SHORT_FORM' | 'STANDARD' | 'LONG_FORM' }
> = {
  [ContentType.YOUTUBE_VIDEO]: {
    hook: 'Sensory Hook',
    boredom: 'Drop-off Risk',
    emotion: 'Emotional Impact',
    analysisBadge: 'STANDARD'
  },
  [ContentType.YOUTUBE_SHORT]: {
    hook: 'Hook Strength',
    boredom: 'Swipe-away Risk',
    emotion: 'Viral Potential',
    analysisBadge: 'SHORT_FORM'
  },
  [ContentType.INSTAGRAM_REEL]: {
    hook: 'Scroll Stopper',
    boredom: 'Swipe-away Risk',
    emotion: 'Share Potential',
    analysisBadge: 'SHORT_FORM'
  },
  [ContentType.TIKTOK_SHORT]: {
    hook: 'First Impression',
    boredom: 'Skip Probability',
    emotion: 'Loop Potential',
    analysisBadge: 'SHORT_FORM'
  },
  [ContentType.PODCAST_EPISODE]: {
    hook: 'Listening Depth',
    boredom: 'Drop-off Risk',
    emotion: 'Resonance',
    analysisBadge: 'LONG_FORM'
  },
  [ContentType.PODCAST_CLIP]: {
    hook: 'Opening Punch',
    boredom: 'Skip Probability',
    emotion: 'Share Potential',
    analysisBadge: 'SHORT_FORM'
  },
  [ContentType.AUDIO_AD]: {
    hook: 'Attention Grab',
    boredom: 'Skip Probability',
    emotion: 'Purchase Intent',
    analysisBadge: 'SHORT_FORM'
  },
  [ContentType.LIVE_STREAM]: {
    hook: 'Live Momentum',
    boredom: 'Viewer Drift',
    emotion: 'Community Resonance',
    analysisBadge: 'LONG_FORM'
  },
  [ContentType.WEBINAR]: {
    hook: 'Attention Capture',
    boredom: 'Fatigue Risk',
    emotion: 'Trust Lift',
    analysisBadge: 'LONG_FORM'
  },
  [ContentType.COURSE_LESSON]: {
    hook: 'Concept Clarity',
    boredom: 'Cognitive Fatigue',
    emotion: 'Learning Resonance',
    analysisBadge: 'LONG_FORM'
  },
  [ContentType.LECTURE_RECORDING]: {
    hook: 'Topic Engagement',
    boredom: 'Fatigue Risk',
    emotion: 'Retention Resonance',
    analysisBadge: 'LONG_FORM'
  },
  [ContentType.AD_CREATIVE]: {
    hook: 'Thumb Stop',
    boredom: 'Skip Probability',
    emotion: 'Conversion Emotion',
    analysisBadge: 'SHORT_FORM'
  },
  [ContentType.PRODUCT_DEMO]: {
    hook: 'Feature Pull',
    boredom: 'Interest Drop',
    emotion: 'Intent Lift',
    analysisBadge: 'STANDARD'
  }
}

export const CONTENT_TYPE_GROUPS: ReadonlyArray<{
  label: string
  options: ReadonlyArray<{ type: ContentType; title: string; subtitle: string }>
}> = [
  {
    label: 'Social Video',
    options: [
      { type: ContentType.YOUTUBE_VIDEO, title: 'YouTube Video', subtitle: 'Long-form creator video' },
      { type: ContentType.YOUTUBE_SHORT, title: 'YouTube Short', subtitle: 'Vertical short video' },
      { type: ContentType.INSTAGRAM_REEL, title: 'Instagram Reel', subtitle: 'Short-form social clip' },
      { type: ContentType.TIKTOK_SHORT, title: 'TikTok', subtitle: 'Fast short-form content' }
    ]
  },
  {
    label: 'Audio',
    options: [
      { type: ContentType.PODCAST_EPISODE, title: 'Podcast Episode', subtitle: 'Long-form audio content' },
      { type: ContentType.PODCAST_CLIP, title: 'Podcast Clip', subtitle: 'Short promotional clip' },
      { type: ContentType.AUDIO_AD, title: 'Audio Ad', subtitle: 'Paid audio creative' }
    ]
  },
  {
    label: 'Live',
    options: [
      { type: ContentType.LIVE_STREAM, title: 'Live Stream', subtitle: 'Real-time audience session' },
      { type: ContentType.WEBINAR, title: 'Webinar', subtitle: 'Presentation or workshop' }
    ]
  },
  {
    label: 'Education',
    options: [
      { type: ContentType.COURSE_LESSON, title: 'Course Lesson', subtitle: 'Structured learning module' },
      { type: ContentType.LECTURE_RECORDING, title: 'Lecture Recording', subtitle: 'Long-form teaching content' }
    ]
  },
  {
    label: 'Ads',
    options: [
      { type: ContentType.AD_CREATIVE, title: 'Ad Creative', subtitle: 'Paid social/commercial' },
      { type: ContentType.PRODUCT_DEMO, title: 'Product Demo', subtitle: 'Feature walkthrough video' }
    ]
  }
] as const

