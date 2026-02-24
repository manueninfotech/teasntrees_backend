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
      required: true
    },

    price: {
      type: Number,
      required: false,
      min: 0
    },

    // Brand is important for multi‑outlet support.  stored as a simple string
    // with an enum of the two brands used by the app.  controllers already pass
    // this value but the schema didn’t enforce it previously.
    brand: {
      type: String,
      enum: ['teasntrees', 'littleh'],
      required: true,
      default: 'teasntrees'
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

  if (!hasPrice && !hasSizeOptions) {
    throw new Error('Product must have either a price or sizeOptions');
  }

  if (hasPrice && hasSizeOptions) {
    throw new Error('Product cannot have both price and sizeOptions');
  }

  // if image field is empty/undefined/null we want to populate the brand
  // specific placeholder before saving.  the default() defined above only
  // runs when the field is omitted, and updates sometimes set it to null.
  if (!this.image) {
    const b = this.brand || 'teasntrees';
    this.image = b === 'littleh' ? 'default-coffee.png' : 'default-cake.png';
  }
});

//
// INDEXES
//
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ brand: 1 }); // used heavily in filters
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);
