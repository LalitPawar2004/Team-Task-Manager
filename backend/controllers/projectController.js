const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      admin: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }],
    });

    // Populate member details
    const populatedProject = await Project.findById(project._id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email');

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all projects for logged in user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    // Find projects where user is a member
    const projects = await Project.find({
      'members.user': req.user._id,
    })
      .populate('admin', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private (Members only)
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member of this project
    const isMember = project.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Admin only)
const addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if requester is admin
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    const { email } = req.body;

    // Find user by email
    const User = require('../models/User');
    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check if user is already a member
    const alreadyMember = project.members.find(
      (member) => member.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Add member
    project.members.push({ user: userToAdd._id, role: 'Member' });
    await project.save();

    // Return updated project
    const updatedProject = await Project.findById(project._id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email');

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Admin only)
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if requester is admin
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can remove members' });
    }

    // Cannot remove the admin
    if (req.params.userId === project.admin.toString()) {
      return res.status(400).json({ message: 'Cannot remove the admin from project' });
    }

    // Remove member
    project.members = project.members.filter(
      (member) => member.user.toString() !== req.params.userId
    );

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email');

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only admin can delete
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can delete this project' });
    }

    await project.deleteOne();

    // Also delete all tasks associated with this project
    const Task = require('../models/Task');
    await Task.deleteMany({ project: req.params.id });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  addMember,
  removeMember,
  deleteProject,
};