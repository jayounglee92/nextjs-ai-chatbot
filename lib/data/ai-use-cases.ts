export interface AiUseCase {
  id: string
  title: string
  readingTime: string
  publicationDate: string
  description: string
  author: string
  thumbnail: string
}

export const aiUseCases: AiUseCase[] = [
  {
    id: '1',
    title: 'AI로 더 똑똑하게 페르소나와 저니맵 만드는 법',
    readingTime: '15분',
    publicationDate: '2025.07.10.',
    description:
      'AI 기술을 활용하여 더욱 정확하고 효과적인 페르소나와 저니맵을 만드는 방법을 알아봅니다. 데이터 기반의 인사이트를 통해 사용자 경험을 향상시키는 전략을 제시합니다.',
    author: '요즘IT의 번역글',
    thumbnail: '/images/thumbnail01.webp',
  },
  {
    id: '2',
    title: 'AI 시대 기획자가 GPT로 타깃 고객 분석하는 법',
    readingTime: '8분',
    publicationDate: '2025.07.07.',
    description:
      'AI 시대에 맞춰 기획자가 GPT를 활용하여 타깃 고객을 분석하고 인사이트를 도출하는 실용적인 방법을 소개합니다.',
    author: 'AI기획연구소',
    thumbnail: '/images/thumbnail02.png',
  },
  {
    id: '3',
    title: 'PRD 중심으로 AI 에이전트와 제품 개발하기',
    readingTime: '13분',
    publicationDate: '2025.07.07.',
    description:
      'PRD(Product Requirements Document)를 중심으로 AI 에이전트와 협업하여 효율적으로 제품을 개발하는 방법을 알아봅니다.',
    author: '제품개발팀',
    thumbnail: '/images/thumbnail03.png',
  },
  {
    id: '4',
    title: "'큐레이션' 하나로 고객 경험을 바꿀 수 있을까?",
    readingTime: '8분',
    publicationDate: '2025.05.27.',
    description:
      '큐레이션 기능만으로도 고객 경험을 크게 개선할 수 있는지, 실제 사례를 통해 분석하고 전략을 제시합니다.',
    author: 'UX연구팀',
    thumbnail: '/images/thumbnail04.jpg',
  },
  {
    id: '5',
    title: '카카오 T에서 "심야주차권"을 3분 떨리 쓰면 벌어지는 일에 대하여',
    readingTime: '12분',
    publicationDate: '2025.05.22.',
    description:
      '카카오 T의 심야주차권 서비스에서 발생할 수 있는 예상치 못한 상황들과 그에 대한 대응 방안을 분석합니다.',
    author: '모빌리티연구소',
    thumbnail: '/images/thumbnail05.png',
  },
  {
    id: '6',
    title: '구글 직원은 왜 "구글러"일까? 커뮤니케이션 브랜딩의 힘',
    readingTime: '11분',
    publicationDate: '2025.05.01.',
    description:
      '구글의 내부 브랜딩 전략과 "구글러"라는 용어가 직원들에게 미치는 긍정적인 영향을 분석하고, 기업 문화 구축에 대한 인사이트를 제공합니다.',
    author: '브랜딩전략팀',
    thumbnail: '/images/thumbnail06.jpg',
  },
  {
    id: '7',
    title: 'AI로 묻고 답하는 설문조사 둘 "Theysald"',
    readingTime: '8분',
    publicationDate: '2025.04.17.',
    description:
      'AI 기술을 활용한 혁신적인 설문조사 도구 "Theysald"의 특징과 활용 사례를 소개합니다.',
    author: 'AI도구연구소',
    thumbnail: '/images/thumbnail07.png',
  },
  {
    id: '8',
    title: '생각만으로 글 쓰는 시대 올까? 뇌-컴퓨터 인터페이스 혁명',
    readingTime: '12분',
    publicationDate: '2025.04.15.',
    description:
      '뇌-컴퓨터 인터페이스 기술의 발전과 함께 생각만으로 글을 쓸 수 있는 시대가 올 수 있는지, 현재 기술 수준과 미래 전망을 다룹니다.',
    author: '미래기술연구소',
    thumbnail: '/images/thumbnail08.jpg',
  },
  {
    id: '9',
    title: '프로젝트보다 "프로덕트" 중심 마인드셋이 중요한 이유',
    readingTime: '10분',
    publicationDate: '2025.03.28.',
    description:
      '일회성 프로젝트가 아닌 지속 가능한 프로덕트 중심의 마인드셋이 기업 성장에 중요한 이유와 그 전환 방법을 제시합니다.',
    author: '제품전략팀',
    thumbnail: '/images/thumbnail09.jpg',
  },
  {
    id: '10',
    title: '왜 잘 나가는 기업은 "인터널 브랜딩"부터 챙길까?',
    readingTime: '10분',
    publicationDate: '2025.03.20.',
    description:
      '성공하는 기업들이 외부 브랜딩보다 내부 브랜딩을 우선시하는 이유와 효과적인 내부 브랜딩 전략을 분석합니다.',
    author: '조직문화연구소',
    thumbnail: '/images/thumbnail10.png',
  },
  {
    id: '11',
    title: 'AI로 더 똑똑하게 페르소나와 저니맵 만드는 법',
    readingTime: '15분',
    publicationDate: '2025.07.10.',
    description:
      'AI 기술을 활용하여 더욱 정확하고 효과적인 페르소나와 저니맵을 만드는 방법을 알아봅니다. 데이터 기반의 인사이트를 통해 사용자 경험을 향상시키는 전략을 제시합니다.',
    author: '요즘IT의 번역글',
    thumbnail: '/images/thumbnail01.webp',
  },
  {
    id: '12',
    title: 'AI 시대 기획자가 GPT로 타깃 고객 분석하는 법',
    readingTime: '8분',
    publicationDate: '2025.07.07.',
    description:
      'AI 시대에 맞춰 기획자가 GPT를 활용하여 타깃 고객을 분석하고 인사이트를 도출하는 실용적인 방법을 소개합니다.',
    author: 'AI기획연구소',
    thumbnail: '/images/thumbnail02.png',
  },
  {
    id: '13',
    title: 'PRD 중심으로 AI 에이전트와 제품 개발하기',
    readingTime: '13분',
    publicationDate: '2025.07.07.',
    description:
      'PRD(Product Requirements Document)를 중심으로 AI 에이전트와 협업하여 효율적으로 제품을 개발하는 방법을 알아봅니다.',
    author: '제품개발팀',
    thumbnail: '/images/thumbnail03.png',
  },
  {
    id: '14',
    title: "'큐레이션' 하나로 고객 경험을 바꿀 수 있을까?",
    readingTime: '8분',
    publicationDate: '2025.05.27.',
    description:
      '큐레이션 기능만으로도 고객 경험을 크게 개선할 수 있는지, 실제 사례를 통해 분석하고 전략을 제시합니다.',
    author: 'UX연구팀',
    thumbnail: '/images/thumbnail04.jpg',
  },
  {
    id: '15',
    title: '카카오 T에서 "심야주차권"을 3분 떨리 쓰면 벌어지는 일에 대하여',
    readingTime: '12분',
    publicationDate: '2025.05.22.',
    description:
      '카카오 T의 심야주차권 서비스에서 발생할 수 있는 예상치 못한 상황들과 그에 대한 대응 방안을 분석합니다.',
    author: '모빌리티연구소',
    thumbnail: '/images/thumbnail05.png',
  },
  {
    id: '16',
    title: '구글 직원은 왜 "구글러"일까? 커뮤니케이션 브랜딩의 힘',
    readingTime: '11분',
    publicationDate: '2025.05.01.',
    description:
      '구글의 내부 브랜딩 전략과 "구글러"라는 용어가 직원들에게 미치는 긍정적인 영향을 분석하고, 기업 문화 구축에 대한 인사이트를 제공합니다.',
    author: '브랜딩전략팀',
    thumbnail: '/images/thumbnail06.jpg',
  },
  {
    id: '17',
    title: 'AI로 묻고 답하는 설문조사 둘 "Theysald"',
    readingTime: '8분',
    publicationDate: '2025.04.17.',
    description:
      'AI 기술을 활용한 혁신적인 설문조사 도구 "Theysald"의 특징과 활용 사례를 소개합니다.',
    author: 'AI도구연구소',
    thumbnail: '/images/thumbnail07.png',
  },
  {
    id: '18',
    title: '생각만으로 글 쓰는 시대 올까? 뇌-컴퓨터 인터페이스 혁명',
    readingTime: '12분',
    publicationDate: '2025.04.15.',
    description:
      '뇌-컴퓨터 인터페이스 기술의 발전과 함께 생각만으로 글을 쓸 수 있는 시대가 올 수 있는지, 현재 기술 수준과 미래 전망을 다룹니다.',
    author: '미래기술연구소',
    thumbnail: '/images/thumbnail08.jpg',
  },
  {
    id: '19',
    title: '프로젝트보다 "프로덕트" 중심 마인드셋이 중요한 이유',
    readingTime: '10분',
    publicationDate: '2025.03.28.',
    description:
      '일회성 프로젝트가 아닌 지속 가능한 프로덕트 중심의 마인드셋이 기업 성장에 중요한 이유와 그 전환 방법을 제시합니다.',
    author: '제품전략팀',
    thumbnail: '/images/thumbnail09.jpg',
  },
  {
    id: '20',
    title: '왜 잘 나가는 기업은 "인터널 브랜딩"부터 챙길까?',
    readingTime: '10분',
    publicationDate: '2025.03.20.',
    description:
      '성공하는 기업들이 외부 브랜딩보다 내부 브랜딩을 우선시하는 이유와 효과적인 내부 브랜딩 전략을 분석합니다.',
    author: '조직문화연구소',
    thumbnail: '/images/thumbnail10.png',
  },
]
