import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Member management
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Task creation
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    assignedTo: '',
  });
  const [taskError, setTaskError] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  const isAdmin = project?.admin?._id === user?._id;

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      setError('Failed to load project');
      if (err.response?.status === 403) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) {
      setMemberError('Email is required');
      return;
    }

    try {
      setAddingMember(true);
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberEmail('');
      setMemberError('');
      fetchProjectAndTasks(); // Refresh
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchProjectAndTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Create task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      setTaskError('Task title is required');
      return;
    }

    try {
      setCreatingTask(true);
      await api.post('/tasks', {
        ...taskForm,
        project: id,
        assignedTo: taskForm.assignedTo || undefined,
      });
      setShowTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        assignedTo: '',
      });
      setTaskError('');
      fetchProjectAndTasks();
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  // Update task status
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      fetchProjectAndTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProjectAndTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
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

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      </Layout>
    );
  }

  const columns = [
    { title: 'To Do', status: 'To Do', color: 'bg-yellow-50 border-yellow-200' },
    { title: 'In Progress', status: 'In Progress', color: 'bg-purple-50 border-purple-200' },
    { title: 'Done', status: 'Done', color: 'bg-green-50 border-green-200' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/projects')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{project?.name}</h2>
                {project?.description && (
                  <p className="text-gray-600 mt-1">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Manage Members
                  </button>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    + Add Task
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Members Avatars */}
          <div className="flex items-center mt-4 space-x-2">
            <span className="text-sm text-gray-500">Members:</span>
            <div className="flex -space-x-2">
              {project?.members?.slice(0, 5).map((member) => (
                <div
                  key={member.user?._id}
                  className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center"
                  title={`${member.user?.name} (${member.role})`}
                >
                  <span className="text-xs font-medium text-indigo-600">
                    {member.user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              ))}
              {project?.members?.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{project.members.length - 5}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Task Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.status);
            return (
              <div key={column.status} className={`rounded-lg border-2 ${column.color} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="text-sm bg-white px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <div key={task._id} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                        <div className="flex items-center space-x-1">
                          {/* Priority Badge */}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              task.priority === 'High'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'Medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        {task.assignedTo && (
                          <div className="flex items-center space-x-1">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-[10px] text-indigo-600">
                                {task.assignedTo?.name?.charAt(0)}
                              </span>
                            </div>
                            <span>{task.assignedTo?.name}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <span className={new Date(task.dueDate) < new Date() ? 'text-red-500 font-medium' : ''}>
                            📅 {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2">
                        {/* Status change dropdown */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Member Modal */}
        {showMemberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Manage Members</h3>
                <button onClick={() => { setShowMemberModal(false); setMemberError(''); }} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Add member form */}
              <form onSubmit={handleAddMember} className="mb-4">
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="Enter email to add..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm disabled:opacity-50"
                  >
                    {addingMember ? 'Adding...' : 'Add'}
                  </button>
                </div>
                {memberError && <p className="text-red-500 text-xs mt-1">{memberError}</p>}
              </form>

              {/* Members list */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {project?.members?.map((member) => (
                  <div key={member.user?._id} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {member.user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.user?.name}</p>
                        <p className="text-xs text-gray-500">{member.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                        {member.role}
                      </span>
                      {member.role !== 'Admin' && (
                        <button
                          onClick={() => handleRemoveMember(member.user?._id)}
                          className="text-red-400 hover:text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Create New Task</h3>
                <button
                  onClick={() => { setShowTaskModal(false); setTaskError(''); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {taskError && (
                <div className="mb-4 bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm">{taskError}</div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Task description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {project?.members?.map((member) => (
                      <option key={member.user?._id} value={member.user?._id}>
                        {member.user?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTask}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creatingTask ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectDetail;