import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { adminService } from '../../services/adminService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';
import api from '../../services/api';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  teamId: z.string().min(1, 'Team is required'),
  role: z.string().min(1, 'Role is required'),
  teamLeadName: z.string().optional(),
  description: z.string().optional(),
});

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    api.get('/auth/teams').catch(() => {});
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/admin/teams');
      setTeams(res.data.data || []);
    } catch {
      setTeams([
        { id: 1, name: 'Falconz' },
        { id: 2, name: 'Beyonders' },
        { id: 3, name: 'Eternals' },
        { id: 4, name: "La Masia's" },
        { id: 5, name: 'Ariba' },
      ]);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.register({
        ...data,
        teamId: parseInt(data.teamId),
      });
      const authData = res.data.data;
      if (authData.requires2FA) {
        toast.success('OTP sent to your email');
        navigate('/verify-otp', { state: { email: data.email } });
      } else {
        login(authData);
        toast.success('Registration successful!');
        navigate(['ADMIN', 'TL', 'TR'].includes(authData.role) ? '/admin' : '/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">Create Account</h1>
          <p className="text-text-light mt-1">Join the assessment platform</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Select label="Team" error={errors.teamId?.message} {...register('teamId')}>
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </Select>

            <Select label="Role" error={errors.role?.message} {...register('role')}>
              <option value="">Select a role</option>
              <option value="TRAINEE">Trainee</option>
              <option value="INTERN">Intern</option>
              <option value="PPO">Full-time</option>
              <option value="TL">Team Lead</option>
              <option value="TR">Team Representative</option>
            </Select>

            <Input
              label="Team Lead Name (optional)"
              placeholder="Lead's name"
              {...register('teamLeadName')}
            />

            <Button type="submit" className="w-full" loading={loading}>
              Register
            </Button>
          </form>

          <p className="text-center text-sm text-text-light mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
          <Footer />
        </Card>
      </div>
    </div>
  );
}
