import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card, { CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Users as UsersIcon } from 'lucide-react';
import { roleLabel } from '../../utils/roleLabel';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminService.getAllUsers();
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId) => {
    if (!newRole) return;
    setUpdating(true);
    try {
      await adminService.changeUserRole(userId, { role: newRole });
      toast.success('Role updated successfully');
      setEditingId(null);
      setNewRole('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const roleVariant = (role) => {
    const map = { ADMIN: 'danger', TRAINEE: 'primary', INTERN: 'info', PPO: 'success', TL: 'warning', TR: 'info' };
    return map[role] || 'default';
  };

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Users Management</h1>
        <p className="text-text-light mt-1">{users.length} registered users</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-text-light">Name</th>
                <th className="text-left py-3 px-2 font-medium text-text-light">Email</th>
                <th className="text-left py-3 px-2 font-medium text-text-light">Team</th>
                <th className="text-left py-3 px-2 font-medium text-text-light">Role</th>
                <th className="text-left py-3 px-2 font-medium text-text-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">{user.name}</td>
                  <td className="py-3 px-2 text-text-light">{user.email}</td>
                  <td className="py-3 px-2 text-text-light">{user.teamName || '-'}</td>
                  <td className="py-3 px-2">
                    <Badge variant={roleVariant(user.role)}>{roleLabel(user.role)}</Badge>
                  </td>
                  <td className="py-3 px-2">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="px-2 py-1 border border-border rounded text-sm"
                        >
                          <option value="">Select</option>
                          <option value="ADMIN">Admin</option>
                          <option value="TRAINEE">Trainee</option>
                          <option value="INTERN">Intern</option>
                          <option value="PPO">Full-time</option>
                          <option value="TL">Team Lead</option>
                          <option value="TR">Team Representative</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleChangeRole(user.id)}
                          loading={updating}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditingId(null); setNewRole(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => { setEditingId(user.id); setNewRole(user.role); }}
                      >
                        Change Role
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
