import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, Check, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const PASSWORD_RULES = [
  { key: "length", label: "至少8个字符", test: (p: string) => p.length >= 8 },
  { key: "upper", label: "包含大写字母", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", label: "包含小写字母", test: (p: string) => /[a-z]/.test(p) },
  { key: "digit", label: "包含数字", test: (p: string) => /\d/.test(p) },
  { key: "special", label: "包含特殊字符", test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, isAuthenticated } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );

  const isPasswordValid = passwordChecks.every((c) => c.passed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("请输入用户名");
      return;
    }
    if (!email.trim()) {
      setError("请输入邮箱");
      return;
    }
    if (!isPasswordValid) {
      setError("密码不满足复杂度要求");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    try {
      await register(username, email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.message || err?.data?.error || "";
      if (msg.includes("已被注册")) {
        setError("该邮箱已被注册");
      } else if (msg.includes("复杂度") || msg.includes("密码")) {
        setError(msg);
      } else {
        setError("注册失败，请稍后重试");
      }
    }
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
            <h2 className="text-2xl font-semibold text-card-foreground mb-6">创建账号</h2>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">用户名</label>
                <div className="flex items-center border border-border rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-colors">
                  <User className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="你的用户名"
                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  />
                </div>
              </div>

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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">密码</label>
                <div className="flex items-center border border-border rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="设置安全密码"
                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  />
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordChecks.map((check) => (
                      <div
                        key={check.key}
                        className={`flex items-center gap-1.5 text-xs ${
                          check.passed ? "text-accent" : "text-muted-foreground"
                        }`}
                      >
                        {check.passed ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        {check.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">确认密码</label>
                <div className="flex items-center border border-border rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">两次输入的密码不一致</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                ) : (
                  <>创建账号 <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              已有账号？{" "}
              <Link to="/login" className="text-accent hover:underline font-medium">
                登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
