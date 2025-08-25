import { UsersIcon } from 'lucide-react';

export default function CommunityPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center flex flex-col items-center">
        <UsersIcon className="mb-4 !size-16" />
        <h1 className="text-2xl font-semibold text-foreground">커뮤니티</h1>
        <p className="text-muted-foreground">
          커뮤니티 기능은 곧 출시될 예정입니다.
        </p>
        <div className="text-sm text-muted-foreground/70">
          다른 사용자들과 함께 대화하고 지식을 공유할 수 있는 공간이 준비
          중입니다.
        </div>
      </div>
    </div>
  );
}
