import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  ArrowLeft, Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Code, Quote, Minus, X, Send, Bot, Sparkles,
  Image as ImageIcon, Undo2, Redo2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDocumentStore } from '@/stores/documentStore';

const lowlight = createLowlight(common);

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function EditorToolbar({
  editor,
  onUploadImage,
}: {
  editor: ReturnType<typeof useEditor> | null;
  onUploadImage: (file: File) => void;
}) {
  if (!editor) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const historyButtons = [
    { icon: Undo2, action: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo(), label: '撤销' },
    { icon: Redo2, action: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo(), label: '重做' },
  ];

  const formatButtons = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), label: '粗体' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), label: '斜体' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), label: '删除线' },
  ];

  const headingButtons = [
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }), label: '标题1' },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), label: '标题2' },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), label: '标题3' },
  ];

  const listButtons = [
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), label: '无序列表' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), label: '有序列表' },
    { icon: CheckSquare, action: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive('taskList'), label: '任务列表' },
  ];

  const insertButtons = [
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock'), label: '代码块' },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), label: '引用' },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), active: false, label: '分割线' },
    { icon: ImageIcon, action: handleImageClick, active: false, label: '插入图片' },
  ];

  const ToolbarDivider = () => <div className="mx-1 h-5 w-px bg-border" />;

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
      {historyButtons.map(({ icon: Icon, action, disabled, label }) => (
        <button
          key={label}
          onClick={action}
          disabled={disabled}
          title={label}
          className={`rounded p-1.5 transition-colors ${
            disabled
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}

      <ToolbarDivider />

      {formatButtons.map(({ icon: Icon, action, active, label }) => (
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

      <ToolbarDivider />

      {headingButtons.map(({ icon: Icon, action, active, label }) => (
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

      <ToolbarDivider />

      {listButtons.map(({ icon: Icon, action, active, label }) => (
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

      <ToolbarDivider />

      {insertButtons.map(({ icon: Icon, action, active, label }) => (
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                  return updated;
                });
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '请求失败，请检查网络连接后重试。',
        };
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

  const quickActions = [
    { label: '总结文档', prompt: '请帮我总结一下这篇文档的内容' },
    { label: '提取关键词', prompt: '请帮我提取这篇文档的关键词' },
    { label: '文档统计', prompt: '请帮我统计一下这篇文档的字数和段落信息' },
    { label: '标题建议', prompt: '请帮我为这篇文档推荐几个合适的标题' },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={onClose} />}
      <div
        className={`fixed right-0 top-0 z-40 flex h-full w-full flex-col border-l border-border bg-card shadow-xl transition-transform duration-300 sm:w-[420px] ${
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
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Sparkles className="mb-3 h-8 w-8 text-accent" />
                <p className="text-sm font-medium">文档智能助手</p>
                <p className="text-xs mt-1 text-muted-foreground/70">
                  支持文档总结、关键词提取、内容分析等功能
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">快捷操作</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      disabled={isStreaming}
                      className="flex flex-col items-start gap-1 rounded-lg border border-border bg-background p-3 text-left hover:border-accent/50 hover:bg-accent/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-sm font-medium text-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
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
              placeholder="输入消息，或点击上方快捷操作..."
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
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder: '开始书写...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
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

  const handleUploadImage = useCallback(
    async (file: File) => {
      try {
        const token = useAuthStore.getState().accessToken;
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();
        if (result.success && result.data?.url) {
          editor?.chain().focus().setImage({ src: result.data.url }).run();
        } else {
          console.error('上传失败:', result.error);
        }
      } catch (error) {
        console.error('图片上传错误:', error);
      }
    },
    [editor],
  );

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
        editor.commands.setContent(content, false);
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
          <EditorToolbar editor={editor} onUploadImage={handleUploadImage} />
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
