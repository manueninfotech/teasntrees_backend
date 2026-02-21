import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    brand: {
      type: String,
      enum: ['teasntrees', 'littleh'],
      default: 'teasntrees',
      required: true
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },

    // ✅ Used ONLY for single-price products
    price: {
      type: Number,
      required: false,
      min: 0
      // ❌ no default value (prevents ₹0 bug)
    },

    image: {
      type: String,
      default: 'default-image.jpg'
    },

    isAvailable: {
      type: Boolean,
      default: true
    },

    preparationTime: {
      type: Number,
      default: 10
    },

    ingredients: [String],

    allergens: [String],

    inStock: {
      type: Boolean,
      default: true
    },

    stockQuantity: Number,

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    totalRatings: {
      type: Number,
      default: 0
    },

    orderCount: {
      type: Number,
      default: 0
    },

    tags: {
      type: [String],
      enum: ['new-intro', 'must-try', 'best-seller', 'egg-contains'],
      default: []
    },

    isSeasonal: {
      type: Boolean,
      default: false
    },

    availableMonths: {
      type: [Number],
      validate: {
        validator: function (months) {
          return months.every(m => m >= 1 && m <= 12);
        },
        message: 'Months must be between 1 and 12'
      },
      default: []
    },

    // ✅ For size-based products (pizza, sandwich, shakes, burgers)
    sizeOptions: [
      {
        size: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],

    variants: [
      {
        name: String,
        price: Number
      }
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//
// ✅ VIRTUAL: displayPrice
// - If sizeOptions exist → lowest size price
// - Else → product price
//
productSchema.virtual('displayPrice').get(function () {
  if (this.sizeOptions && this.sizeOptions.length > 0) {
    return Math.min(...this.sizeOptions.map(option => option.price));
  }
  return this.price ?? null;
});

//
// ✅ VALIDATION RULES
// - Product MUST have either price OR sizeOptions
// - Product MUST NOT have both
//
productSchema.pre('validate', function () {
  const hasPrice = this.price !== undefined && this.price !== null;
  const hasSizeOptions = this.sizeOptions && this.sizeOptions.length > 0;

  if (!hasPrice && !hasSizeOptions) {
    throw new Error('Product must have either a price or sizeOptions');
  }

  if (hasPrice && hasSizeOptions) {
    throw new Error('Product cannot have both price and sizeOptions');
  }
});

//
// ✅ INDEXES
//
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);
