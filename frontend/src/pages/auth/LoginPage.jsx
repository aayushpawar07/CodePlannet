import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { Diamond, Mail, Lock } from 'lucide-react';
import Footer from '../../components/Footer';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      const authData = res.data.data;

      if (authData.requires2FA) {
        navigate('/verify-otp', { state: { email: data.email } });
        toast.success('OTP sent to your email');
      } else {
        login(authData);
        toast.success('Login successful!');
        navigate(['ADMIN', 'TL', 'TR'].includes(authData.role) ? '/admin' : '/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 relative overflow-hidden items-center justify-center p-8">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-white text-center space-y-8">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-3xl border-2 border-white/30 flex items-center justify-center">
              <Diamond className="w-8 h-8" />
            </div>
          </div>

          <div>
            <h2 className="text-5xl font-bold mb-4 leading-tight">
              Evaluate Talent with
              <br />
              <span className="text-blue-300">Precision & Scale.</span>
            </h2>
            <p className="text-blue-100 text-lg max-w-md mx-auto">
              The comprehensive platform for role-based assessments, tracking progress from Trainee to Lead.
            </p>
          </div>

          <div className="flex justify-center gap-12 pt-8">
            <div>
              <div className="text-4xl font-bold">98%</div>
              <div className="text-blue-200 text-sm">EFFICIENCY GAIN</div>
            </div>
            <div>
              <div className="text-4xl font-bold">500+</div>
              <div className="text-blue-200 text-sm">ASSESSMENTS WEEKLY</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
              <Diamond className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Enter your credentials to access your assessment dashboard.</p>
          </div>



          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">📧 {errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">🔐 {errors.password.message}</p>}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="keepSignedIn"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="keepSignedIn" className="ml-2 text-sm text-gray-600">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 space-y-4">
            <p className="text-center text-sm text-gray-600">
              New to the assessment program?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Create Account
              </Link>
            </p>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
