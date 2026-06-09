import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, FileText, Crown, Shield, UserCircle } from 'lucide-react';
import { useSpaceStore } from '@/stores/spaceStore';
import type { SpaceResponse } from '@/types';

const roleConfig: Record<string, { label: string; icon: typeof Crown; className: string }> = {
  owner: { label: '所有者', icon: Crown, className: 'bg-brand/10 text-brand' },
  admin: { label: '管理员', icon: Shield, className: 'bg-accent/10 text-accent' },
  member: { label: '成员', icon: UserCircle, className: 'bg-muted text-muted-foreground' },
};

function SpaceCard({ space }: { space: SpaceResponse }) {
  const navigate = useNavigate();
  const role = roleConfig[space.role] ?? roleConfig.member;
  const RoleIcon = role.icon;

  return (
    <button
      onClick={() => navigate(`/space/${space.id}`)}
      className="group w-full overflow-hidden rounded-lg bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-1 bg-gradient-to-r from-brand to-accent" />
      <div className="p-5">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-brand">
          {space.name}
        </h3>
        {space.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {space.description}
          </p>
        )}
        <div className="mt-4 flex items-center gap-4">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {space.member_count}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {space.document_count}
          </span>
          <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${role.className}`}>
            <RoleIcon className="h-3 w-3" />
            {role.label}
          </span>
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-sm">
      <div className="h-1 animate-pulse bg-muted" />
      <div className="p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
        <div className="mt-1 h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-4 flex items-center gap-4">
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

function CreateSpaceDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const createSpace = useSpaceStore((s) => s.createSpace);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createSpace(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground">创建新空间</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              空间名称 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              placeholder="输入空间名称"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              placeholder="可选，简要描述此空间"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinSpaceDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const joinSpace = useSpaceStore((s) => s.joinSpace);
  const fetchSpaces = useSpaceStore((s) => s.fetchSpaces);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!token.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await joinSpace(token.trim());
      await fetchSpaces();
      setToken('');
      onClose();
    } catch {
      setError('加入失败，请检查邀请链接是否有效');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground">通过邀请链接加入</h2>
        <div className="mt-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            placeholder="粘贴邀请令牌"
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!token.trim() || submitting}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-50"
          >
            加入
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { spaces, fetchSpaces, isLoading } = useSpaceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">我的空间</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              通过邀请链接加入
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" />
              创建空间
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <div className="mt-24 flex flex-col items-center text-center">
            <FileText className="h-16 w-16 text-muted" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">还没有加入任何空间</p>
            <p className="mt-1 text-sm text-muted-foreground">创建一个新空间开始协作，或通过邀请链接加入</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" />
              创建空间
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        )}
      </div>

      <CreateSpaceDialog open={showCreate} onClose={() => setShowCreate(false)} />
      <JoinSpaceDialog open={showJoin} onClose={() => setShowJoin(false)} />
    </>
  );
}
