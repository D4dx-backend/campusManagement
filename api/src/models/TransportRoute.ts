import mongoose, { Schema } from 'mongoose';
import { ITransportRoute } from '../types';

const DistanceGroupFeeSchema = new Schema({
  groupName: {
    type: String,
    required: true
  },
  distanceRange: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const ClassFeeSchema = new Schema({
  classId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Class',
    required: true
  },
  className: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  staffDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  distanceGroupFees: [DistanceGroupFeeSchema]
}, { _id: false });

const VehicleSchema = new Schema({
  vehicleNumber: {
    type: String,
    required: true,
    trim: true
  },
  driverName: {
    type: String,
    required: true,
    trim: true
  },
  driverPhone: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const TransportRouteSchema = new Schema<ITransportRoute>({
  routeName: {
    type: String,
    required: true,
    trim: true
  },
  routeCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  classFees: [ClassFeeSchema],
  useDistanceGroups: {
    type: Boolean,
    default: false
  },
  vehicles: [VehicleSchema],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  branchId: {
    type: Schema.Types.ObjectId as any,
    ref: 'Branch',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
TransportRouteSchema.index({ branchId: 1, status: 1 });
// routeCode index is already created by unique: true

export const TransportRoute = mongoose.model<ITransportRoute>('TransportRoute', TransportRouteSchema);
