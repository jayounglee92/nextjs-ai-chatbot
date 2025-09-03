export interface LearningItem {
  id: string
  title: string
  description: string
  category: string
  thumbnail: string
  userId: string
  createdAt: string
  tags: string[]
  videoId: string
}

export const learningItems: LearningItem[] = [
  {
    id: '1',
    title: 'React 18의 새로운 기능들을 완벽하게 이해하기',
    description:
      'Concurrent Features, Suspense, 그리고 더 나은 성능을 위한 핵심 개념들을 자세히 살펴봅니다.',
    category: 'Frontend',
    thumbnail: '/images/learning01.webp',
    userId: '김개발',
    createdAt: '2024-01-15',
    tags: ['React', 'JavaScript', 'Frontend'],
    videoId: 'dQw4w9WgXcQ',
  },
  {
    id: '2',
    title: 'Next.js 14 App Router 마스터하기',
    description:
      'App Router의 모든 기능과 Server Components, 그리고 최신 Next.js 패턴들을 배워봅니다.',
    category: 'Fullstack',
    thumbnail: '/images/learning02.webp',
    userId: '박웹개발',
    createdAt: '2024-01-12',
    tags: ['Next.js', 'React', 'Fullstack'],
    videoId: '9bZkp7q19f0',
  },
  {
    id: '3',
    title: 'TypeScript 고급 타입 시스템 완벽 가이드',
    description:
      'Conditional Types, Mapped Types, 그리고 복잡한 타입 조합을 통한 강력한 타입 안전성 구현하기.',
    category: 'Language',
    thumbnail: '/images/learning03.webp',
    userId: '이타입마스터',
    createdAt: '2024-01-10',
    tags: ['TypeScript', 'JavaScript', 'Language'],
    videoId: 'BwuLxPH8IDs',
  },
  {
    id: '4',
    title: 'AI와 함께하는 현대적인 웹 개발',
    description:
      'ChatGPT, GitHub Copilot을 활용한 효율적인 개발 워크플로우와 팁들을 공유합니다.',
    category: 'AI & Tools',
    thumbnail: '/images/learning04.webp',
    userId: '최AI개발자',
    createdAt: '2024-01-08',
    tags: ['AI', 'Web Development', 'Productivity'],
    videoId: 'jNQXAC9IVRw',
  },
  {
    id: '5',
    title: '성능 최적화를 위한 웹팩 설정 완벽 가이드',
    description:
      '번들 크기 최적화, 코드 스플리팅, 그리고 프로덕션 빌드 최적화 전략들.',
    category: 'Build Tools',
    thumbnail: '/images/learning05.webp',
    userId: '정번들마스터',
    createdAt: '2024-01-05',
    tags: ['Webpack', 'Build Tools', 'Performance'],
    videoId: 'kJQP7kiw5Fk',
  },
  {
    id: '6',
    title: '모던 CSS Grid와 Flexbox 완벽 활용법',
    description:
      '실제 프로젝트에서 사용할 수 있는 레이아웃 패턴들과 반응형 디자인 구현하기.',
    category: 'CSS',
    thumbnail: '/images/learning06.webp',
    userId: '한CSS전문가',
    createdAt: '2024-01-03',
    tags: ['CSS', 'Layout', 'Responsive Design'],
    videoId: 'JJSoEo8JSnc',
  },
  {
    id: '7',
    title: 'React 18의 새로운 기능들을 완벽하게 이해하기',
    description:
      'Concurrent Features, Suspense, 그리고 더 나은 성능을 위한 핵심 개념들을 자세히 살펴봅니다.',
    category: 'Frontend',
    thumbnail: '/images/learning01.webp',
    userId: '김개발',
    createdAt: '2024-01-15',
    tags: ['React', 'JavaScript', 'Frontend'],
    videoId: 'dQw4w9WgXcQ',
  },
  {
    id: '8',
    title: 'Next.js 14 App Router 마스터하기',
    description:
      'App Router의 모든 기능과 Server Components, 그리고 최신 Next.js 패턴들을 배워봅니다.',
    category: 'Fullstack',
    thumbnail: '/images/learning02.webp',
    userId: '박웹개발',
    createdAt: '2024-01-12',
    tags: ['Next.js', 'React', 'Fullstack'],
    videoId: '9bZkp7q19f0',
  },
  {
    id: '9',
    title: 'TypeScript 고급 타입 시스템 완벽 가이드',
    description:
      'Conditional Types, Mapped Types, 그리고 복잡한 타입 조합을 통한 강력한 타입 안전성 구현하기.',
    category: 'Language',
    thumbnail: '/images/learning03.webp',
    userId: '이타입마스터',
    createdAt: '2024-01-10',
    tags: ['TypeScript', 'JavaScript', 'Language'],
    videoId: 'BwuLxPH8IDs',
  },
  {
    id: '10',
    title: 'AI와 함께하는 현대적인 웹 개발',
    description:
      'ChatGPT, GitHub Copilot을 활용한 효율적인 개발 워크플로우와 팁들을 공유합니다.',
    category: 'AI & Tools',
    thumbnail: '/images/learning04.webp',
    userId: '최AI개발자',
    createdAt: '2024-01-08',
    tags: ['AI', 'Web Development', 'Productivity'],
    videoId: 'jNQXAC9IVRw',
  },
  {
    id: '11',
    title: '성능 최적화를 위한 웹팩 설정 완벽 가이드',
    description:
      '번들 크기 최적화, 코드 스플리팅, 그리고 프로덕션 빌드 최적화 전략들.',
    category: 'Build Tools',
    thumbnail: '/images/learning05.webp',
    userId: '정번들마스터',
    createdAt: '2024-01-05',
    tags: ['Webpack', 'Build Tools', 'Performance'],
    videoId: 'kJQP7kiw5Fk',
  },
  {
    id: '12',
    title: '모던 CSS Grid와 Flexbox 완벽 활용법',
    description:
      '실제 프로젝트에서 사용할 수 있는 레이아웃 패턴들과 반응형 디자인 구현하기.',
    category: 'CSS',
    thumbnail: '/images/learning06.webp',
    userId: '한CSS전문가',
    createdAt: '2024-01-03',
    tags: ['CSS', 'Layout', 'Responsive Design'],
    videoId: 'JJSoEo8JSnc',
  },
  {
    id: '13',
    title: 'React 18의 새로운 기능들을 완벽하게 이해하기',
    description:
      'Concurrent Features, Suspense, 그리고 더 나은 성능을 위한 핵심 개념들을 자세히 살펴봅니다.',
    category: 'Frontend',
    thumbnail: '/images/learning01.webp',
    userId: '김개발',
    createdAt: '2025-09-02T06:56:51.648Z',
    tags: ['React', 'JavaScript', 'Frontend'],
    videoId: 'dQw4w9WgXcQ',
  },
  {
    id: '14',
    title: 'Next.js 14 App Router 마스터하기',
    description:
      'App Router의 모든 기능과 Server Components, 그리고 최신 Next.js 패턴들을 배워봅니다.',
    category: 'Fullstack',
    thumbnail: '/images/learning02.webp',
    userId: '박웹개발',
    createdAt: '2025-09-02T06:56:51.648Z',
    tags: ['Next.js', 'React', 'Fullstack'],
    videoId: '9bZkp7q19f0',
  },
  {
    id: '15',
    title: 'TypeScript 고급 타입 시스템 완벽 가이드',
    description:
      'Conditional Types, Mapped Types, 그리고 복잡한 타입 조합을 통한 강력한 타입 안전성 구현하기.',
    category: 'Language',
    thumbnail: '/images/learning03.webp',
    userId: '이타입마스터',
    createdAt: '2025-09-02T06:56:51.648Z',
    tags: ['TypeScript', 'JavaScript', 'Language'],
    videoId: 'BwuLxPH8IDs',
  },
  {
    id: '16',
    title: 'AI와 함께하는 현대적인 웹 개발',
    description:
      'ChatGPT, GitHub Copilot을 활용한 효율적인 개발 워크플로우와 팁들을 공유합니다.',
    category: 'AI & Tools',
    thumbnail: '/images/learning04.webp',
    userId: '최AI개발자',
    createdAt: '2025-09-02T06:56:51.648Z',
    tags: ['AI', 'Web Development', 'Productivity'],
    videoId: 'jNQXAC9IVRw',
  },
  {
    id: '17',
    title: '성능 최적화를 위한 웹팩 설정 완벽 가이드',
    description:
      '번들 크기 최적화, 코드 스플리팅, 그리고 프로덕션 빌드 최적화 전략들.',
    category: 'Build Tools',
    thumbnail: '/images/learning05.webp',
    userId: '정번들마스터',
    createdAt: '2025-09-02T06:56:51.648Z  ',
    tags: ['Webpack', 'Build Tools', 'Performance'],
    videoId: 'kJQP7kiw5Fk',
  },
  {
    id: '18',
    title: '모던 CSS Grid와 Flexbox 완벽 활용법',
    description:
      '실제 프로젝트에서 사용할 수 있는 레이아웃 패턴들과 반응형 디자인 구현하기.',
    category: 'CSS',
    thumbnail: '/images/learning06.webp',
    userId: '한CSS전문가',
    createdAt: '2025-09-02T06:56:51.648Z',
    tags: ['CSS', 'Layout', 'Responsive Design'],
    videoId: 'JJSoEo8JSnc',
  },
]
