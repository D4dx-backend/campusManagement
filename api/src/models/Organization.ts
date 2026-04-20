import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  status: 'active' | 'inactive';
  subscriptionPlan?: string;
  maxBranches?: number;
  // Business settings (defaults for all branches)
  taxId?: string;          // GST / Tax Registration Number
  taxLabel?: string;       // Label for the tax field (e.g. "GST", "VAT", "TRN")
  currency: string;        // Default currency code (e.g. "BHD", "INR", "USD")
  currencySymbol?: string; // Symbol (e.g. "₹", "$", "BD")
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  registrationNumber?: string;
  footerText?: string;    // Default receipt footer text
  enabledFeatures?: string[];  // Feature keys enabled for this org (empty/undefined = all)
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Organization code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    logo: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    subscriptionPlan: {
      type: String,
      trim: true
    },
    maxBranches: {
      type: Number,
      default: 10
    },
    // Business settings
    taxId: {
      type: String,
      trim: true
    },
    taxLabel: {
      type: String,
      trim: true,
      default: 'GST'
    },
    currency: {
      type: String,
      trim: true,
      default: 'BHD'
    },
    currencySymbol: {
      type: String,
      trim: true,
      default: 'BD'
    },
    country: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    registrationNumber: {
      type: String,
      trim: true
    },
    footerText: {
      type: String,
      trim: true
    },
    enabledFeatures: {
      type: [String],
      default: undefined
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
OrganizationSchema.index({ status: 1 });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
