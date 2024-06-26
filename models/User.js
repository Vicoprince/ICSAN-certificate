const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Please enter an email address'],
      unique: true,
      loercase: true,
      validate: [isEmail, 'Please enter a valid email ']
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlenght: [6, 'Minumum password lenght is 6 characters']
    }
  },
  { timestamps: true }
);

// Trigger a function after doc is saved to db
userSchema.post('save', function (doc, next) {
  console.log('new user was created', doc);
  next();
})

// Trigger a function before doc is saved to db
userSchema.pre('save', async function(next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// static method to login user
userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user
    }
    throw Error("Incorrect password");
  } 
  throw Error('Incorrect email');
}

const User = mongoose.model('user', userSchema);

module.exports = User;