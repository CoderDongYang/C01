import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  ArrowLeft, Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Code, Quote, Minus, X, Send, Bot, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentStore } from '@/stores/documentStore';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null;

  const buttons = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), label: '粗体' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), label: '斜体' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), label: '删除线' },
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }), label: '标题1' },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), label: '标题2' },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), label: '标题3' },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), label: '无序列表' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), label: '有序列表' },
    { icon: CheckSquare, action: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive('taskList'), label: '任务列表' },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock'), label: '代码块' },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), label: '引用' },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), active: false, label: '分割线' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
      {buttons.map(({ icon: Icon, action, active, label }) => (
        <button
          key={label}
          onClick={action}
          title={label}
          className={`rounded p-1.5 transition-colors ${
            active
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function AiChatPanel({
  open,
  onClose,
  docContent,
}: {
  open: boolean;
  onClose: () => void;
  docContent: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: content.trim() }];
    setMessages([...newMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);

    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newMessages, context: docContent }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              accumulated += parsed.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                return updated;
              });
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: '请求失败，请重试' };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={onClose} />}
      <div
        className={`fixed right-0 top-0 z-40 flex h-full w-full flex-col border-l border-border bg-card shadow-xl transition-transform duration-300 sm:w-[380px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            <h3 className="font-semibold text-foreground">AI 助手</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Sparkles className="mb-3 h-8 w-8" />
              <p className="text-sm">向 AI 助手提问吧</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.content || (
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse delay-100">●</span>
                    <span className="animate-pulse delay-200">●</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              rows={1}
              className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="shrink-0 rounded-md bg-accent p-2 text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DocumentEditor() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const spaceId = (location.state as { spaceId?: string })?.spaceId;

  const { currentDocument, fetchDocument, updateDocument, setCurrentSpaceId } = useDocumentStore();
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [title, setTitle] = useState('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder: '开始书写...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: '',
    onUpdate: ({ editor: e }) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (docId) {
          updateDocument(docId, { content: e.getJSON() });
        }
      }, 1000);
    },
  });

  useEffect(() => {
    if (!docId) return;
    if (spaceId) setCurrentSpaceId(spaceId);
    fetchDocument(docId);
  }, [docId, spaceId, fetchDocument, setCurrentSpaceId]);

  useEffect(() => {
    if (currentDocument) {
      setTitle(currentDocument.title);
      if (editor && !editor.isDestroyed) {
        let content: any = currentDocument.content ?? '';
        if (typeof content === 'string') {
          try {
            const parsed = JSON.parse(content);
            if (
              parsed !== null &&
              typeof parsed === 'object' &&
              !Array.isArray(parsed)
            ) {
              content = parsed;
            } else if (Array.isArray(parsed)) {
              content = { type: 'doc', content: parsed };
            } else {
              content = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: String(parsed) }] }] };
            }
          } catch {
            content = {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: content ? [{ type: 'text', text: content }] : [],
                },
              ],
            };
          }
        }
        if (
          content === null ||
          typeof content !== 'object' ||
          Array.isArray(content) ||
          content.type !== 'doc'
        ) {
          content = { type: 'doc', content: [] };
        }
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [currentDocument, editor]);

  const handleTitleBlur = useCallback(() => {
    if (docId && title.trim() && currentDocument?.title !== title.trim()) {
      updateDocument(docId, { title: title.trim() });
    }
  }, [docId, title, currentDocument, updateDocument]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
    [],
  );

  const docTextContent = editor?.getText() || '';

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentDocument) navigate(`/space/${currentDocument.space_id}`);
              else if (spaceId) navigate(`/space/${spaceId}`);
              else navigate('/dashboard');
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回空间
          </button>
          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              showAiPanel
                ? 'bg-accent text-accent-foreground'
                : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI 助手
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          placeholder="无标题文档"
          className="mb-3 w-full bg-transparent text-2xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />

        <div className="mb-3">
          <EditorToolbar editor={editor} />
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="min-h-[60vh] rounded-lg border border-border bg-card p-6 sm:p-8">
            <EditorContent editor={editor} className="prose-editor" />
          </div>
        </div>
      </div>

      <AiChatPanel
        open={showAiPanel}
        onClose={() => setShowAiPanel(false)}
        docContent={docTextContent}
      />
    </>
  );
}
