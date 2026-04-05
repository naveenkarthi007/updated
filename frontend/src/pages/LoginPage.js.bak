import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleRedirect = (role) => {
    if (role === 'admin') navigate('/');
    else if (role === 'caretaker') navigate('/caretaker');
    else if (role === 'warden') navigate('/warden');
    else navigate('/student');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back!');
      handleRedirect(data.user.role);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async credentialResponse => {
    setLoading(true);
    try {
      const data = await googleLogin(credentialResponse.credential);
      toast.success('Welcome! Signed in with Google.');
      handleRedirect(data.user.role);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in was cancelled or failed.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-brand-border bg-white px-6 py-7 shadow-sm sm:px-7">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-sm font-bold text-white">
              BIT
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-brand-text">Hostel Portal Login</h1>
            <p className="mt-2 text-sm text-brand-muted">Sign in to continue to your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="h-11 w-full rounded-xl border border-brand-border bg-[#EEF2FB] px-3.5 text-sm text-brand-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-gray-700">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="h-11 w-full rounded-xl border border-brand-border bg-[#EEF2FB] px-3.5 text-sm text-brand-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/15"
                required
              />
            </div>

            <Button
              type="submit"
              size="md"
              loading={loading}
              className="h-11 w-full justify-center rounded-xl"
            >
              Login
            </Button>
          </form>

          <div className="my-5 text-center text-sm text-gray-500">Or</div>

          <div className="flex justify-center">
            <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
