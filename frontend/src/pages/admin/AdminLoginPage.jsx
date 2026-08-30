import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';

import { Seo } from '../../components/Seo.jsx';
import { useToast } from '../../components/Toaster.jsx';
import { useIsAuthenticated, useLogin } from '../../hooks/queries.js';
import { loginSchema } from '../../lib/schemas.js';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const login = useLogin();
  const authenticated = useIsAuthenticated();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ resolver: zodResolver(loginSchema) });

  if (authenticated) return <Navigate to="/admin" replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await login.mutateAsync({ email, password });
      toast.success('Welcome back!');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError('root', { message: err?.message ?? 'Login failed' });
    }
  });

  return (
    <>
      <Seo title="Admin Login" />
      <section className="flex min-h-[70vh] items-center justify-center bg-brand-light px-4 py-16">
        <div className="card-base w-full max-w-sm p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-mid text-white">
              <GraduationCap size={24} aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-xl">Admin Sign In</h1>
            <p className="mt-1 text-xs text-slate-500">MediHub Pakistan content management</p>
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                className="input-field"
                placeholder="admin@medihub.pk"
                {...register('email')}
              />
              {errors.email && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                className="input-field"
                {...register('password')}
              />
              {errors.password && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errors.root && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {errors.root.message}
              </p>
            )}

            <button type="submit" disabled={login.isPending} className="btn-primary w-full">
              {login.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
