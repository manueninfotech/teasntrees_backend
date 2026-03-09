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

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true
    },

    price: {
      type: Number,
      min: 0
    },

    cakePricing: {
      basePricePerKg: {
        type: Number,
        min: 0
      },
      customizationAvailable: {
        type: Boolean,
        default: false
      },
      customizationPricePerKg: {
        type: Number,
        min: 0
      },
      egglessAvailable: {
        type: Boolean,
        default: true
      },
      egglessExtraCharge: {
        type: Number,
        min: 0,
        default: 100
      }
    },

    brand: {
      type: String,
      enum: ['teasntrees', 'littleh'],
      required: true,
      default: 'teasntrees',
      index: true
    },

    image: {
      type: String,
      // default to brand-specific Cloudinary placeholder URLs
      default: function () {
        const b = this.brand || 'teasntrees';
        if (b === 'littleh') return 'https://res.cloudinary.com/dpguxi28j/image/upload/v1771913436/products/gt4qc5az6vxyiauiellt.jpg';
        if (b === 'teasntrees') return 'https://res.cloudinary.com/dpguxi28j/image/upload/v1771913166/products/xbacarjgxk64umg36aoz.jpg';
        return 'https://res.cloudinary.com/dpguxi28j/image/upload/v1771913166/products/xbacarjgxk64umg36aoz.jpg';
      }
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true
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

    // For size-based products (pizza, sandwich, shakes, burgers)
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
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        if (!ret.image || ret.image === 'default-image.jpg') {
          const b = ret.brand || 'teasntrees';
          ret.image = b === 'littleh' ? 'default-coffee.png' : 'default-cake.png';
        }
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

//
// VIRTUAL: displayPrice
// - If sizeOptions exist → lowest size price
// - Else → product price
//
productSchema.virtual('displayPrice').get(function () {
  if (this.cakePricing?.basePricePerKg !== undefined && this.cakePricing?.basePricePerKg !== null) {
    return this.cakePricing.basePricePerKg;
  }
  if (this.sizeOptions && this.sizeOptions.length > 0) {
    return Math.min(...this.sizeOptions.map(option => option.price));
  }
  return this.price ?? null;
});

//
// VALIDATION RULES
// - Product MUST have either price OR sizeOptions
// - Product MUST NOT have both
//
productSchema.pre('validate', function () {
  const hasPrice = this.price !== undefined && this.price !== null;
  const hasSizeOptions = this.sizeOptions && this.sizeOptions.length > 0;
  const hasCakePricing = this.cakePricing &&
    this.cakePricing.basePricePerKg !== undefined &&
    this.cakePricing.basePricePerKg !== null;

  const pricingModesUsed = [hasPrice, hasSizeOptions, hasCakePricing].filter(Boolean).length;

  if (this.brand !== 'littleh' && hasCakePricing) {
    throw new Error('cakePricing is only supported for littleh cake products');
  }

  if (pricingModesUsed === 0) {
    throw new Error('Product must have one pricing mode: price, sizeOptions, or cakePricing');
  }

  if (pricingModesUsed > 1) {
    throw new Error('Product cannot have multiple pricing modes');
  }

  if (hasCakePricing && this.cakePricing?.customizationAvailable !== true) {
    this.cakePricing.customizationPricePerKg = null;
  }

  // if image field is empty/undefined/null we want to populate the brand
  // specific placeholder before saving.  the default() defined above only
  // runs when the field is omitted, and updates sometimes set it to null.
  if (!this.image) {
    const b = this.brand || 'teasntrees';
    this.image = b === 'littleh' ? 'default-coffee.png' : 'default-cake.png';
  }

  // Normalize availableMonths for indexing
  if (!this.isSeasonal) {
    this.availableMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }
});

//
// INDEXES
//
productSchema.index({ brand: 1, isAvailable: 1, createdAt: -1 }); // Optimized for customer browsing
productSchema.index({
  brand: 1,
  isAvailable: 1,
  category: 1,
  createdAt: -1
});
productSchema.index({ name: 'text', description: 'text' });
// Optimized for customer browsing with seasonal filtering (availableMonths holds all months for non-seasonal)
productSchema.index({ brand: 1, isAvailable: 1, availableMonths: 1, createdAt: -1 });

// Tag filtering
productSchema.index({
  tags: 1
});

export default mongoose.model('Product', productSchema);
