import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-nano': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': openai('gpt-4o-mini'), // 개발환경: 비용 효율적인 최신 모델
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-4o-mini'), // 개발환경: 추론 작업도 저비용 모델 사용
          middleware: extractReasoningMiddleware({ tagName: 'think' }), // AI의 사고 과정을 추출하는 미들웨어
        }),
        'title-model': openai('gpt-3.5-turbo'), // 개발환경: 제목 생성은 가장 저렴한 모델
        'artifact-model': openai('gpt-4o-mini'), // 개발환경: 아티팩트 생성도 저비용 모델
      },
      imageModels: {
        'small-model': openai.image('dall-e-2'), // 이미지 생성은 dall-e-2가 더 저렴
        'large-model': openai.image('dall-e-2'), // 개발환경에서는 dall-e-2 사용
      },
    });
