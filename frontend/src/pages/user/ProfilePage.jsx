import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { User, Mail, Users, Shield, Building } from 'lucide-react';
import { roleLabel } from '../../utils/roleLabel';

export default function ProfilePage() {
  const { user } = useAuth();

  const roleVariant = {
    ADMIN: 'danger',
    TRAINEE: 'primary',
    INTERN: 'info',
    PPO: 'success',
    TL: 'warning',
    TR: 'info',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">My Profile</h1>
        <p className="text-text-light mt-1">Your account information</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text">{user?.name}</h2>
              <p className="text-text-light">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-text-light" />
              <div>
                <p className="text-sm text-text-light">Full Name</p>
                <p className="font-medium">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-text-light" />
              <div>
                <p className="text-sm text-text-light">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-text-light" />
              <div>
                <p className="text-sm text-text-light">Role</p>
                <Badge variant={roleVariant[user?.role] || 'default'}>{roleLabel(user?.role)}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-text-light" />
              <div>
                <p className="text-sm text-text-light">Team</p>
                <p className="font-medium">{user?.teamName || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
