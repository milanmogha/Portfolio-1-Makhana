import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'ROLE_CHANGE', 'OTHER']
  },
  resource: {
    type: String,
    required: true,
    trim: true  // e.g. 'Banner', 'Order', 'User'
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false  // may be null for actions not tied to a specific document
  },
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null  // snapshot of document before change
  },
  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null  // snapshot of document after change
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}   // e.g. IP address, userAgent, etc.
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
