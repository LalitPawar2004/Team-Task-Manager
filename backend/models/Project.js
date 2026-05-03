const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['Admin', 'Member'],
          default: 'Member',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add admin as first member automatically
projectSchema.pre('save', function (next) {
  const isAdminAdded = this.members.some(
    (member) =>
      member.user.toString() === this.admin.toString() &&
      member.role === 'Admin'
  );

  if (!isAdminAdded) {
    this.members.push({ user: this.admin, role: 'Admin' });
  }
});

module.exports = mongoose.model('Project', projectSchema);