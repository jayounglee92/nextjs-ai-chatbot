import { BotIcon, SparklesIcon } from 'lucide-react';

export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'ChatGPT',
    icon: BotIcon,
    description: 'OpenAI의 최신 멀티모달 모델',
  },
  {
    id: 'chat-model-reasoning',
    name: 'ChatGPT Plus',
    icon: SparklesIcon,
    description: '깊이 있는 사고 과정을 보여주는 고급 추론 모델',
  },
];
