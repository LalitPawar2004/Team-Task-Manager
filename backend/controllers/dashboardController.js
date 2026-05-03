const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get dashboard statistics for logged in user
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all projects where user is a member
    const userProjects = await Project.find({
      'members.user': userId,
    }).select('_id');

    const projectIds = userProjects.map((p) => p._id);

    if (projectIds.length === 0) {
      return res.json({
        totalTasks: 0,
        tasksByStatus: {
          'To Do': 0,
          'In Progress': 0,
          'Done': 0,
        },
        tasksPerUser: [],
        overdueTasks: 0,
      });
    }

    // Check if user is admin in any project
    const adminProjects = await Project.find({
      admin: userId,
    }).select('_id');

    const isAdminOfSomeProject = adminProjects.length > 0;

    let taskFilter = {};

    if (isAdminOfSomeProject) {
      // Admin sees all tasks from projects they admin
      const adminProjectIds = adminProjects.map((p) => p._id);
      taskFilter = { project: { $in: adminProjectIds } };
    } else {
      // Member sees only their assigned tasks
      taskFilter = {
        project: { $in: projectIds },
        assignedTo: userId,
      };
    }

    // 1. Total tasks
    const totalTasks = await Task.countDocuments(taskFilter);

    // 2. Tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Format status counts
    const statusCounts = {
      'To Do': 0,
      'In Progress': 0,
      'Done': 0,
    };

    tasksByStatus.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    // 3. Tasks per user (for all members in user's projects)
    let tasksPerUserFilter = {};
    
    if (isAdminOfSomeProject) {
      const adminProjectIds = adminProjects.map((p) => p._id);
      tasksPerUserFilter = { project: { $in: adminProjectIds } };
    } else {
      tasksPerUserFilter = {
        project: { $in: projectIds },
        assignedTo: userId,
      };
    }

    const tasksPerUser = await Task.aggregate([
      { $match: tasksPerUserFilter },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          name: '$user.name',
          email: '$user.email',
        },
      },
    ]);

    // 4. Overdue tasks (due date passed and not done)
    const overdueTasks = await Task.countDocuments({
      ...taskFilter,
      status: { $ne: 'Done' },
      dueDate: { $lt: new Date() },
    });

    res.json({
      totalTasks,
      tasksByStatus: statusCounts,
      tasksPerUser,
      overdueTasks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardStats };