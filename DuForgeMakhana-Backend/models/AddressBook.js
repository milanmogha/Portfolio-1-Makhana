import mongoose from 'mongoose';

const addressBookSchema = new mongoose.Schema({
  user: {
    type: String,      // Firebase UID
    required: true,
    index: true
  },
  fullName:  { type: String, required: true },
  phone:     { type: String, required: true },
  flat:      { type: String, default: '' },
  area:      { type: String, default: '' },
  landmark:  { type: String, default: '' },
  pincode:   { type: String, required: true },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model('AddressBook', addressBookSchema);
