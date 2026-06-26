import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authService } from '../../services/service-auth';
import { useAuthStore } from '../../store/auth-store';

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate  = useNavigate();
  const setAuth   = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleLogin = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      setAuth(res.token, res.user);
      toast.success(`Bem-vindo, ${res.user.name}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      toast.error(message === 'Invalid credentials' ? 'E-mail ou senha inválidos' : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo CCM */}
        <img
          src="/logo-ccm-white.png"
          alt="CCM Tecnologia"
          className="login-logo"
        />

        {/* Título */}
        <div className="login-title">ADMSQUAD</div>

        {/* Logo Squad Warriors — abaixo do título, maior */}
        <img
          src="/logo-squad-warriors.png"
          alt="Squad Warriors"
          style={{
            height: 'auto',
            maxHeight: '110px',
            maxWidth: '110px',
            width: 'auto',
            display: 'block',
            objectFit: 'contain',
            margin: '12px auto 24px',
            borderRadius: '6px',
          }}
        />

        <form onSubmit={handleSubmit(handleLogin)} noValidate>
          {/* E-mail */}
          <div className="mb-3">
            <label className="login-label">E-mail</label>
            <input
              type="email"
              className={`form-control login-input ${errors.email ? 'is-invalid' : ''}`}
              placeholder="seu@email.com.br"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email.message}</div>
            )}
          </div>

          {/* Senha */}
          <div className="mb-4">
            <label className="login-label">Senha</label>
            <input
              type="password"
              className={`form-control login-input ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-ccm-primary w-100 py-2"
            disabled={loading}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" /> Entrando…</>
              : <><i className="bi bi-box-arrow-in-right me-2" />Entrar</>
            }
          </button>
        </form>

        <div className="login-footer-text">
          CCM Tecnologia &nbsp;·&nbsp; Acesso Restrito
        </div>
      </div>
    </div>
  );
}
