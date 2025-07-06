const mongoose = require('mongoose');

const allowedRolesSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  roleIds: [String]
});

module.exports = mongoose.model('AllowedRoles', allowedRolesSchema);
