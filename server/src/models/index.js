import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const slot = new Schema(
  {
    day: { type: Number, min: 1, max: 7, required: true },
    start: { type: String, match: TIME, required: true },
    end: { type: String, match: TIME, required: true },
  },
  { _id: false }
);

export const DIRECTIONS = ['frontend', 'backend', 'python', 'scratch', 'robotics', 'design'];

export const Manager = model(
  'Manager',
  new Schema({ name: String, email: { type: String, unique: true, lowercase: true, required: true }, passwordHash: { type: String, required: true } }, { timestamps: true })
);

export const Mentor = model(
  'Mentor',
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      phone: String,
      directions: [{ type: String, enum: DIRECTIONS }],
      languages: [{ type: String, enum: ['uz', 'ru', 'en'] }],
      level: { type: String, enum: ['junior', 'middle', 'senior'], default: 'junior' },
      availability: [slot],
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

export const Group = model(
  'Group',
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      direction: { type: String, enum: DIRECTIONS, required: true },
      level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
      language: { type: String, enum: ['uz', 'ru', 'en'], default: 'uz' },
      room: String,
      schedule: { type: [slot], validate: (v) => v.length > 0 },
      mentor: { type: Schema.Types.ObjectId, ref: 'Mentor', default: null },
      students: { type: Number, default: 0 },
      progressNote: String, // guruh qayerga kelgani — yangi mentorga topshiriladi
      startDate: { type: String, match: DATE }, // guruh ochilgan sana — o'tilgan darslar shundan hisoblanadi
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

export const Absence = model(
  'Absence',
  new Schema(
    {
      mentor: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
      from: { type: String, match: DATE, required: true },
      to: { type: String, match: DATE, required: true },
      reason: String,
    },
    { timestamps: true }
  )
);

export const Replacement = model(
  'Replacement',
  new Schema(
    {
      group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
      fromMentor: { type: Schema.Types.ObjectId, ref: 'Mentor', default: null },
      toMentor: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
      type: { type: String, enum: ['temporary', 'permanent'], required: true },
      date: { type: String, match: DATE, required: true },
      reason: { type: String, enum: ['kasal', 'tatil', 'ishdan ketdi', 'jadval', 'yuklama', 'boshqa'], default: 'boshqa' },
      note: String,
      score: Number,
      cancelled: { type: Boolean, default: false },
      createdBy: { type: Schema.Types.ObjectId, ref: 'Manager' },
    },
    { timestamps: true }
  )
);
