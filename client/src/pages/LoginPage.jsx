import { useState } from "react";
import { authAPI } from "../services/api";

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Unable to log in. Please try again.";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await authAPI.login({
        email: email.trim(),
        password,
      });
      const { token, redirectUrl } = response.data.data;

      localStorage.setItem("token", token);
      window.location.assign(redirectUrl === "/home" ? "/" : redirectUrl || "/");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Connect with Your UTE"
      subtitle="Community"
      logoPosition="center"
    >
      <form className="w-full max-w-[360px]" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-100 bg-white px-8 py-8 shadow-sm">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome <span className="text-[#2538ff]">ZaloUTE</span>
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Please enter your academic credentials.
            </p>
          </div>

          <FieldLabel label="Username" />
          <InputShell icon="mail">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="student@hcmute.edu.vn"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
            />
          </InputShell>

          <FieldLabel label="Password" className="mt-5" />
          <InputShell icon="lock">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-[18px]">
                visibility
              </span>
            </button>
          </InputShell>

          <div className="mt-5 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-500">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-200 text-[#2538ff]"
              />
              Remember me
            </label>
            <a className="font-semibold text-[#2538ff]" href="/forgot-password">
              Forgot password?
            </a>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="mt-6 h-11 w-full rounded-lg bg-[#3329ff] text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#241ce5] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Log In"}
          </button>

          <Divider />

          <button
            type="button"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <span className="font-bold text-[#4285f4]">G</span>
            Continue with Google
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <a className="font-semibold text-[#2538ff]" href="/register">
            Register
          </a>
        </p>
      </form>
    </AuthShell>
  );
}

const AuthShell = ({ title, subtitle, logoPosition, children }) => (
  <main className="min-h-screen bg-[#1f1f1f] p-8 text-slate-900">
    <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl overflow-hidden bg-white lg:grid-cols-[1.15fr_1fr]">
      <div className="flex flex-col items-center justify-center bg-[#075bd6] px-8 text-white">
        <div
          className={`flex w-full max-w-lg flex-col ${
            logoPosition === "center"
              ? "items-center text-center"
              : "items-start text-left"
          }`}
        >
          <ZaloLogo />
          <h2 className="mt-20 text-4xl font-bold leading-tight">
            {title}
            <br />
            <span className="text-blue-200">{subtitle}</span>
          </h2>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        {children}
      </div>
    </section>
  </main>
);

const ZaloLogo = () => (
  <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white text-7xl font-black text-[#075bd6] shadow-sm">
    z
  </div>
);

const FieldLabel = ({ label, className = "" }) => (
  <label className={`mb-2 block text-xs font-semibold text-slate-500 ${className}`}>
    {label}
  </label>
);

const InputShell = ({ icon, children }) => (
  <div className="flex h-11 items-center gap-2 rounded-lg bg-slate-100 px-3">
    <span className="material-symbols-outlined text-[18px] text-slate-400">
      {icon}
    </span>
    {children}
  </div>
);

const Divider = () => (
  <div className="my-7 flex items-center gap-3">
    <div className="h-px flex-1 bg-slate-100" />
    <span className="text-[10px] font-semibold text-slate-400">OR</span>
    <div className="h-px flex-1 bg-slate-100" />
  </div>
);

export default LoginPage;
