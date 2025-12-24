import mongoose from 'mongoose';

const deviceCommandSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  command: {
    fan: { type: Boolean },
    buzzer: { type: Boolean }
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending','sent','failed','acknowledged'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DeviceCommand = mongoose.model('DeviceCommand', deviceCommandSchema);
export default DeviceCommand;