import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  clearStatus,
  resetState,
  setError,
  setField,
  submitRegister,
  submitVerifyOtp,
} from "../store/slices/registerSlice";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function Register() {
  const dispatch = useAppDispatch();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    step,
    fullName,
    email,
    password,
    confirmPassword,
    otp,
    loading,
    error,
    message,
  } = useAppSelector((state) => state.register);

  useEffect(() => {
    dispatch(clearStatus());
  }, [dispatch, step]);

  const onChange = (field) => (event) =>
    dispatch(setField({ field, value: event.target.value }));

  const handleRegisterSubmit = (event) => {
    event.preventDefault();

    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim();

    if (!normalizedFullName) {
      dispatch(setError("Name is required"));
      return;
    }

    if (normalizedFullName.length < 2 || normalizedFullName.length > 50) {
      dispatch(setError("Name must be between 2 and 50 characters"));
      return;
    }

    if (!normalizedEmail) {
      dispatch(setError("Email is required"));
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      dispatch(setError("Email is invalid"));
      return;
    }

    if (!password) {
      dispatch(setError("Password is required"));
      return;
    }

    if (!strongPasswordRegex.test(password)) {
      dispatch(
        setError(
          "Password must contain at least 8 characters, uppercase, lowercase, number and special character",
        ),
      );
      return;
    }

    if (!confirmPassword) {
      dispatch(setError("Confirm password is required"));
      return;
    }

    if (password !== confirmPassword) {
      dispatch(setError("Confirm password does not match"));
      return;
    }

    if (!acceptedTerms) {
      dispatch(setError("Please agree to the Terms of Service and Privacy Policy"));
      return;
    }

    dispatch(
      submitRegister({
        fullName: normalizedFullName,
        email: normalizedEmail,
        password,
      }),
    );
  };

  const handleOtpSubmit = (event) => {
    event.preventDefault();

    if (!otp.trim()) {
      dispatch(setError("Please enter OTP"));
      return;
    }

    if (otp.length !== 6) {
      dispatch(setError("OTP must contain 6 digits"));
      return;
    }

    dispatch(submitVerifyOtp({ email, otp }));
  };

  const handleRestart = () => {
    setAcceptedTerms(false);
    dispatch(resetState());
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[430px]">
        <div className="rounded-xl border border-slate-100 bg-white px-9 py-8 shadow-sm">
          {step === "register" ? (
            <RegisterForm
              acceptedTerms={acceptedTerms}
              confirmPassword={confirmPassword}
              email={email}
              error={error}
              fullName={fullName}
              loading={loading}
              message={message}
              onChange={onChange}
              onSubmit={handleRegisterSubmit}
              password={password}
              setAcceptedTerms={setAcceptedTerms}
              setShowConfirmPassword={setShowConfirmPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              showPassword={showPassword}
            />
          ) : null}

          {step === "verify-otp" ? (
            <OtpForm
              email={email}
              error={error}
              loading={loading}
              message={message}
              onChange={onChange}
              onSubmit={handleOtpSubmit}
              otp={otp}
            />
          ) : null}

          {step === "success" ? (
            <SuccessPanel message={message} onRestart={handleRestart} />
          ) : null}
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link className="font-semibold text-[#2538ff]" to="/login">
            Sign In
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

const RegisterForm = ({
  acceptedTerms,
  confirmPassword,
  email,
  error,
  fullName,
  loading,
  message,
  onChange,
  onSubmit,
  password,
  setAcceptedTerms,
  setShowConfirmPassword,
  setShowPassword,
  showConfirmPassword,
  showPassword,
}) => (
  <form onSubmit={onSubmit}>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">
        <span className="text-[#2538ff]">ZaloUTE</span> Register
      </h1>
      <p className="mt-1 text-xs text-slate-500">
        Create your account to get started
      </p>
    </div>

    <FieldLabel label="Name" />
    <InputShell icon="mail">
      <input
        type="text"
        value={fullName}
        onChange={onChange("fullName")}
        placeholder="Vo An Thai"
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
      />
    </InputShell>

    <FieldLabel label="Email" className="mt-5" />
    <InputShell icon="mail">
      <input
        type="email"
        value={email}
        onChange={onChange("email")}
        placeholder="student@hcmute.edu.vn"
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
      />
    </InputShell>

    <FieldLabel label="Password" className="mt-5" />
    <InputShell icon="lock">
      <input
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={onChange("password")}
        placeholder="********"
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
      />
      <PasswordToggle
        onClick={() => setShowPassword((current) => !current)}
        show={showPassword}
      />
    </InputShell>

    <FieldLabel label="Confirm Password" className="mt-5" />
    <InputShell icon="lock">
      <input
        type={showConfirmPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={onChange("confirmPassword")}
        placeholder="********"
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
      />
      <PasswordToggle
        onClick={() => setShowConfirmPassword((current) => !current)}
        show={showConfirmPassword}
      />
    </InputShell>

    <label className="mt-5 flex items-start gap-2 text-xs text-slate-500">
      <input
        type="checkbox"
        checked={acceptedTerms}
        onChange={(event) => setAcceptedTerms(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-200"
      />
      <span>
        I agree to the{" "}
        <Link className="font-semibold text-[#2538ff]" to="/register">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link className="font-semibold text-[#2538ff]" to="/register">
          Privacy Policy
        </Link>
        .
      </span>
    </label>

    <StatusMessage error={error} message={message} />

    <button
      type="submit"
      disabled={loading}
      className="mt-6 h-11 w-full rounded-lg bg-[#3329ff] text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#241ce5] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Creating account..." : "Sign in"}
    </button>

    <Divider />

    <GoogleButton />
  </form>
);

const OtpForm = ({ email, error, loading, message, onChange, onSubmit, otp }) => (
  <form onSubmit={onSubmit}>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Verify <span className="text-[#2538ff]">OTP</span>
      </h1>
      <p className="mt-1 text-xs text-slate-500">
        Enter the code sent to {email || "your email"}.
      </p>
    </div>

    <FieldLabel label="OTP Code" />
    <InputShell icon="pin">
      <input
        type="text"
        value={otp}
        onChange={onChange("otp")}
        placeholder="000000"
        maxLength={6}
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
      />
    </InputShell>

    <StatusMessage error={error} message={message} />

    <button
      type="submit"
      disabled={loading}
      className="mt-6 h-11 w-full rounded-lg bg-[#3329ff] text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#241ce5] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Verifying..." : "Verify OTP"}
    </button>
  </form>
);

const SuccessPanel = ({ message, onRestart }) => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900">
      Register <span className="text-[#2538ff]">Success</span>
    </h1>
    <p className="mt-2 text-sm text-slate-500">
      {message || "Your account has been created successfully."}
    </p>
    <Link
      to="/login"
      className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-[#3329ff] text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#241ce5]"
    >
      Go to Login
    </Link>
    <button
      type="button"
      onClick={onRestart}
      className="mt-3 h-11 w-full rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
    >
      Register another account
    </button>
  </div>
);

const AuthShell = ({ children }) => (
  <main className="min-h-screen bg-[#1f1f1f] p-8 text-slate-900">
    <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl overflow-hidden bg-white lg:grid-cols-[1.15fr_1fr]">
      <div className="flex flex-col justify-center bg-[#075bd6] px-16 text-white">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold leading-tight">
            Join the ZaloUTE
            <br />
            Community
          </h2>
          <div className="mt-28">
            <ZaloLogo />
          </div>
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

const PasswordToggle = ({ onClick, show }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-slate-400 hover:text-slate-600"
    aria-label={show ? "Hide password" : "Show password"}
  >
    <span className="material-symbols-outlined text-[18px]">visibility</span>
  </button>
);

const StatusMessage = ({ error, message }) => {
  if (!error && !message) return null;

  return (
    <div
      className={`mt-4 rounded-md px-3 py-2 text-xs ${
        error ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {error || message}
    </div>
  );
};

const Divider = () => (
  <div className="my-6 flex items-center gap-3">
    <div className="h-px flex-1 bg-slate-100" />
    <span className="text-[10px] font-semibold text-slate-400">OR</span>
    <div className="h-px flex-1 bg-slate-100" />
  </div>
);

const GoogleButton = () => (
  <button
    type="button"
    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
  >
    <span className="font-bold text-[#4285f4]">G</span>
    Continue with Google
  </button>
);

export default Register;
