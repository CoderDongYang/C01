import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("请输入邮箱");
      return;
    }
    if (password.length < 8) {
      setError("密码至少8个字符");
      return;
    }

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("登录失败，请检查邮箱和密码");
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
            <h2 className="text-2xl font-semibold text-card-foreground mb-6">登录</h2>

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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">密码</label>
                <div className="flex items-center border border-border rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-colors">
                  <Lock className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="至少8个字符"
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
                  <>登录 <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              还没有账号？{" "}
              <Link to="/register" className="text-accent hover:underline font-medium">
                注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
