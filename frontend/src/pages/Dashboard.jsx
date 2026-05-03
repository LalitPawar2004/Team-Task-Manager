import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      name: 'Total Tasks',
      value: stats?.totalTasks || 0,
      color: 'bg-blue-500',
      icon: '📋',
    },
    {
      name: 'To Do',
      value: stats?.tasksByStatus?.['To Do'] || 0,
      color: 'bg-yellow-500',
      icon: '📝',
    },
    {
      name: 'In Progress',
      value: stats?.tasksByStatus?.['In Progress'] || 0,
      color: 'bg-purple-500',
      icon: '⚡',
    },
    {
      name: 'Done',
      value: stats?.tasksByStatus?.['Done'] || 0,
      color: 'bg-green-500',
      icon: '✅',
    },
    {
      name: 'Overdue',
      value: stats?.overdueTasks || 0,
      color: 'bg-red-500',
      icon: '⚠️',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tasks Per User */}
        {stats?.tasksPerUser && stats.tasksPerUser.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Tasks Per User
              </h3>
              <div className="space-y-4">
                {stats.tasksPerUser.map((userTask) => (
                  <div key={userTask._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium text-sm">
                          {userTask.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {userTask.name || 'Unassigned'}
                        </p>
                        <p className="text-xs text-gray-500">{userTask.email || ''}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      {userTask.count} tasks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {stats?.tasksPerUser?.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No tasks assigned yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;