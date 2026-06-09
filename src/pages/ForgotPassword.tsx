import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { api } from "@/api/client";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("请输入邮箱");
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.post<{ resetToken: string; email: string }>(
        "/api/auth/forgot-password",
        { email }
      );
      setResetToken(result.resetToken);
      setSent(true);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("未注册")) {
        setError("该邮箱未注册");
      } else {
        setError("请求失败，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToReset = () => {
    navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand to-[hsl(240,33%,28%)] flex-col items-center justify-center px-12">
        <h1 className="text-5xl font-bold text-brand-foreground mb-4">CoDoc</h1>
        <p className="text-xl text-brand-foreground/70">团队协作，从这里开始</p>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-brand mb-2">CoDoc</h1>
            <p className="text-muted-foreground">团队协作，从这里开始</p>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
            {!sent ? (
              <>
                <h2 className="text-2xl font-semibold text-card-foreground mb-2">忘记密码</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  请输入注册时使用的邮箱地址，我们将为您生成密码重置令牌。
                </p>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">邮箱</label>
                    <div className="flex items-center border border-border rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-colors">
                      <Mail className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                    ) : (
                      <>获取重置令牌 <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-card-foreground mb-2">重置令牌已生成</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  您的密码重置令牌已生成，点击下方按钮前往重置密码页面。
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="text-xs text-muted-foreground mb-1.5">重置令牌</p>
                  <p className="text-sm font-mono text-foreground break-all select-all">{resetToken}</p>
                </div>

                <button
                  onClick={handleGoToReset}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
                >
                  前往重置密码 <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                返回登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
