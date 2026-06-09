import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, FileText, ArrowLeft, Trash2, Copy,
  Shield, Crown, UserCircle, X, Users,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { useDocumentStore } from '@/stores/documentStore';
import type { SpaceMemberResponse } from '@/types';

function CreateDocDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim());
    setTitle('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">新建文档</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文档标题"
            className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteDialog({
  open,
  onClose,
  spaceId,
}: {
  open: boolean;
  onClose: () => void;
  spaceId: string;
}) {
  const [maxRole, setMaxRole] = useState<'admin' | 'member'>('member');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const createInvite = useSpaceStore((s) => s.createInvite);

  const handleGenerate = async () => {
    const t = await createInvite(spaceId, maxRole);
    setToken(t);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">邀请成员</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm text-muted-foreground">可分配最高角色</label>
          <select
            value={maxRole}
            onChange={(e) => setMaxRole(e.target.value as 'admin' | 'member')}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="member">成员</option>
            <option value="admin">管理员</option>
          </select>
        </div>
        <button
          onClick={handleGenerate}
          className="mb-4 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
        >
          生成邀请链接
        </button>
        {token && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">将以下链接分享给团队成员</p>
            <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
              <code className="flex-1 truncate text-sm text-foreground">{token}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied && <p className="mt-1 text-xs text-accent">已复制</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: SpaceMemberResponse['role'] }) {
  const styles = {
    owner: 'bg-brand text-brand-foreground',
    admin: 'bg-accent text-accent-foreground',
    member: 'bg-muted text-muted-foreground',
  };
  const labels = { owner: '拥有者', admin: '管理员', member: '成员' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[role]}`}>
      {role === 'owner' && <Crown className="h-3 w-3" />}
      {role === 'admin' && <Shield className="h-3 w-3" />}
      {role === 'member' && <UserCircle className="h-3 w-3" />}
      {labels[role]}
    </span>
  );
}

export default function SpaceDetail() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { currentSpace, members, fetchSpace, fetchMembers, updateMemberRole, removeMember } = useSpaceStore();
  const { documents, fetchDocuments, createDocument, deleteDocument } = useDocumentStore();

  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (spaceId) {
      fetchSpace(spaceId);
      fetchDocuments(spaceId);
      fetchMembers(spaceId);
    }
  }, [spaceId, fetchSpace, fetchDocuments, fetchMembers]);

  const canManage = currentSpace?.role === 'owner' || currentSpace?.role === 'admin';
  const canChangeRole = currentSpace?.role === 'owner';

  const handleCreateDoc = async (title: string) => {
    if (!spaceId) return;
    const doc = await createDocument(spaceId, title);
    navigate(`/doc/${doc.id}`, { state: { spaceId } });
  };

  const handleDeleteDoc = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteDocument(docId);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!spaceId) return;
    await updateMemberRole(spaceId, userId, newRole);
    fetchMembers(spaceId);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!spaceId) return;
    await removeMember(spaceId, userId);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回工作台
          </button>
          <h1 className="text-2xl font-bold text-foreground">{currentSpace?.name}</h1>
          {currentSpace?.description && (
            <p className="mt-1 text-muted-foreground">{currentSpace.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 lg:w-2/3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">文档</h2>
              <button
                onClick={() => setShowCreateDoc(true)}
                className="flex items-center gap-1 rounded-md border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
              >
                <Plus className="h-4 w-4" />
                新建文档
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">暂无文档，创建第一个文档吧</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const canDelete = canManage || doc.created_by === user?.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => navigate(`/doc/${doc.id}`, { state: { spaceId } })}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 cursor-pointer hover:border-accent/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 shrink-0 text-brand" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(doc.updated_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/doc/${doc.id}`, { state: { spaceId } });
                          }}
                          className="rounded px-2 py-1 text-xs text-accent hover:bg-accent/10"
                        >
                          编辑
                        </button>
                        {canDelete && (
                          <button
                            onClick={(e) => handleDeleteDoc(doc.id, e)}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:w-1/3">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand" />
                  <h3 className="font-semibold text-foreground">成员</h3>
                </div>
                {canManage && (
                  <button
                    onClick={() => setShowInvite(true)}
                    className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/90"
                  >
                    邀请
                  </button>
                )}
              </div>
              <div className="divide-y divide-border">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-medium text-brand-foreground">
                      {getInitials(member.username)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{member.username}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <RoleBadge role={member.role} />
                      {canChangeRole && member.role !== 'owner' && (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                            className="rounded border border-border bg-background px-1 py-0.5 text-xs text-foreground"
                          >
                            <option value="admin">管理员</option>
                            <option value="member">成员</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateDocDialog
        open={showCreateDoc}
        onClose={() => setShowCreateDoc(false)}
        onCreate={handleCreateDoc}
      />
      <InviteDialog
        open={showInvite}
        onClose={() => setShowInvite(false)}
        spaceId={spaceId!}
      />
    </>
  );
}
