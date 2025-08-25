import { OrbitIcon } from 'lucide-react';

export default function SpacePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center flex flex-col items-center">
        <div className="flex flex-col items-center gap-2">
          <OrbitIcon className="mb-4 !size-10 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">공간</h1>
        </div>
        <p className="text-muted-foreground">
          공간 기능은 곧 출시될 예정입니다.
        </p>
        <div className="text-sm text-muted-foreground/70">
          다른 사용자들과 함께 대화를 나누고 아이디어를 공유해보세요.
        </div>
      </div>
    </div>
  );
}
