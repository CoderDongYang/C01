import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/api/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [token] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("无效的重置令牌");
      return;
    }

    if (newPassword.length < 8) {
      setError("密码至少8个字符");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError("密码需包含大写字母");
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError("密码需包含小写字母");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError("密码需包含数字");
      return;
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      setError("密码需包含特殊字符");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        token,
        password: newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("无效")) {
        setError("无效的重置令牌");
      } else if (msg.includes("已使用")) {
        setError("该重置令牌已使用");
      } else if (msg.includes("过期")) {
        setError("重置令牌已过期");
      } else {
        setError("密码重置失败，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/login");
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
            {success ? (
              <>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-card-foreground mb-2">密码重置成功</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    您的密码已成功更新，请使用新密码登录。
                  </p>
                  <button
                    onClick={handleGoToLogin}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
                  >
                    返回登录 <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-card-foreground mb-2">重置密码</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  请设置您的新密码，密码需至少8位，包含大小写字母、数字和特殊字符。
                </p>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">新密码</label>
                    <div className="flex items-center border border-border rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-colors">
                      <Lock className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="至少8个字符，包含大小写字母、数字和特殊字符"
                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">确认密码</label>
                    <div className="flex items-center border border-border rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-colors">
                      <Lock className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入新密码"
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
                      <>重置密码 <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
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