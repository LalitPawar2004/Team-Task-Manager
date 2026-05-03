const Task = require('../models/Task');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// Helper: Check if user is project member
const isProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  return project.members.some(
    (member) => member.user.toString() === userId.toString()
  );
};

// Helper: Check if user is project admin
const isProjectAdmin = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  return project.admin.toString() === userId.toString();
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Project Admin only)
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, dueDate, project, assignedTo } = req.body;

    // Check if user is admin of the project
    const isAdmin = await isProjectAdmin(project, req.user._id);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only project admin can create tasks' });
    }

    // If assignedTo is provided, check if they are project member
    if (assignedTo) {
      const isMember = await isProjectMember(project, assignedTo);
      if (!isMember) {
        return res.status(400).json({ message: 'Assigned user is not a project member' });
      }
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      project,
      assignedTo,
      createdBy: req.user._id,
    });

    // Populate references
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private (Project Members)
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user is project member
    const isMember = await isProjectMember(projectId, req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view these tasks' });
    }

    // Check if user is admin
    const isAdmin = await isProjectAdmin(projectId, req.user._id);

    let tasks;

    if (isAdmin) {
      // Admin sees all tasks in the project
      tasks = await Task.find({ project: projectId })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('project', 'name')
        .sort({ createdAt: -1 });
    } else {
      // Members see only tasks assigned to them
      tasks = await Task.find({
        project: projectId,
        assignedTo: req.user._id,
      })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('project', 'name')
        .sort({ createdAt: -1 });
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private (Assigned user or Admin)
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization
    const isAdmin = await isProjectAdmin(task.project, req.user._id);
    const isAssigned = task.assignedTo?._id.toString() === req.user._id.toString();

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private (Assigned user or Admin)
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['To Do', 'In Progress', 'Done'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization
    const isAdmin = await isProjectAdmin(task.project, req.user._id);
    const isAssigned = task.assignedTo?.toString() === req.user._id.toString();

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    task.status = status;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private (Project Admin only)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only admin can update task details
    const isAdmin = await isProjectAdmin(task.project, req.user._id);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admin can update task details' });
    }

    const { title, description, priority, dueDate, assignedTo } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;

    // If changing assignment, check if new user is project member
    if (assignedTo) {
      const isMember = await isProjectMember(task.project, assignedTo);
      if (!isMember) {
        return res.status(400).json({ message: 'Assigned user is not a project member' });
      }
      task.assignedTo = assignedTo;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Project Admin only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only admin can delete
    const isAdmin = await isProjectAdmin(task.project, req.user._id);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admin can delete tasks' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTaskStatus,
  updateTask,
  deleteTask,
};