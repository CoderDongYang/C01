import { useState } from 'react';
import { X, Clock, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import type { DocumentVersion } from '@/types';

interface VersionHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
  isLoading: boolean;
  onRollback: (versionId: string) => Promise<void>;
  onPreview?: (version: DocumentVersion) => void;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const parsed = new Date(dateStr.replace(' ', 'T') + 'Z');
  if (isNaN(parsed.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return parsed.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getInitials(name: string) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

export default function VersionHistoryPanel({
  open,
  onClose,
  versions,
  isLoading,
  onRollback,
}: VersionHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  const handleRollback = async (versionId: string) => {
    if (!confirm('确定要恢复到此版本吗？当前内容将被替换。')) return;
    setRollingBack(true);
    try {
      await onRollback(versionId);
      onClose();
    } finally {
      setRollingBack(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/20 lg:hidden"
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 z-40 flex h-full w-full flex-col border-l border-border bg-card shadow-xl transition-transform duration-300 sm:w-[380px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            <h3 className="font-semibold text-foreground">版本历史</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="animate-pulse">加载中...</div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="mb-3 h-8 w-8 opacity-50" />
              <p className="text-sm">暂无历史版本</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-medium text-brand-foreground">
                        {getInitials((version as any).created_by_name || 'U')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {index === 0 ? '当前版本' : `版本 ${version.version_number}`}
                          </p>
                          {index === 0 && (
                            <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                              最新
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(version.created_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === version.id ? null : version.id)
                      }
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {expandedId === version.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {expandedId === version.id && (
                    <div className="mt-3 pl-11">
                      <div className="mb-3 rounded-md bg-muted/50 p-3 max-h-32 overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-1">标题: {version.title}</p>
                      </div>
                      {index !== 0 && (
                        <button
                          onClick={() => handleRollback(version.id)}
                          disabled={rollingBack}
                          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          恢复此版本
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            最多保留最近 10 个版本
          </p>
        </div>
      </div>
    </>
  );
}
