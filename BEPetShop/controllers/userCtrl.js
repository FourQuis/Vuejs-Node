const Users = require('../models/userModel');
const Payments = require('../models/paymentModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMe = require('../middleware/authMe');

const userCtrl = {
  register: async (req, res) => {
    try {
      const { name, email, password ,lname , phone ,avatar} = req.body;

      const user = await Users.findOne({ email });
      avatar ="https://bootdey.com/img/Content/avatar/avatar7.png";
      if (user)
        return res.status(400).json({ msg: 'The email already exists.' });

      if (password.length < 6)
        return res
          .status(400)
          .json({ msg: 'Password is at least 6 characters long.' });
      // Password Encryption
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = new Users({
        name,
        lname,
        avatar,
        phone,
        email,
        password: passwordHash,
      });
      // Save mongodb
      await newUser.save();
      // Then create jsonwebtoken to authentication
      const accesstoken = createAccessToken({ id: newUser._id });
      const refreshtoken = createRefreshToken({ id: newUser._id });
      // res.sessionStorage.setItem('refreshtoken',refreshtoken)
      res.cookie('refreshtoken', refreshtoken, {
        httpOnly: true,
        path: '/user/refresh_token',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
      });
      res.json({ accesstoken,refreshtoken });
    } catch (err) {
      console.log(err.message);
      return res.status(500).json({ msg: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await Users.findOne({ email });

      if (!user) return res.status(400).json({ msg: 'User does not exist.' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Incorrect password.' });

      // If login success , create access token and refresh token
      const accesstoken = createAccessToken({ id: user._id });
      const refreshtoken = createRefreshToken({ id: user._id });
      res.cookie('refreshtoken', refreshtoken, {
        httpOnly: true,
        path: '/user/refresh_token',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
      });
      res.json({ accesstoken , refreshtoken});
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  logout: async (req, res) => {
    try {
      // res.sessionStorage.removeItem('refreshtoken',refreshtoken)
      res.clearCookie('refreshtoken', { path: '/user/refresh_token' });
      return res.json({ msg: 'Logged out' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  refreshToken: (req, res) => {
    try {
      // const rf_token = req.cookies.refreshtoken;
      const tf_token = req.headers['authorization'];
      console.log(tf_token)
      if ((!tf_token))
        return res.status(400).json({ msg: 'Please Login or Register' });

      jwt.verify(tf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err)
          return res.status(400).json({ msg: 'Please Login or Register' });

        const accesstoken = createAccessToken({ id: user.id });

        res.json({ accesstoken });
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getUser: async (req, res) => {
    try {
      const userID = await authMe(req);
      const user = await Users.findById(userID).select('-password');
      if (!user) return res.status(400).json({ msg: 'User does not exist.' });
      res.json(user);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  addCart: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id);
      if (!user) return res.status(400).json({ msg: 'User does not exist.' });
      await Users.findOneAndUpdate(
        { _id: req.user.id },
        {
          cart: req.body.cart,
        }
      );
      return res.json({ msg: 'Added to cart' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },


  history: async (req, res) => {
    try {
      const history = await Payments.find({ user_id: req.user.id });
      res.json(history);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const userID = await authMe(req);
      const { pet, avatar, birthday, sex, fullName, phone, address } = req.body;
      const user = await Users.findById(userID);
      if (!user) return res.status(400).json({ message: "User does not exist." })
      if (pet) user.pet = pet;
      if (avatar) user.avatar = avatar;
      if (birthday) user.birthday = birthday;
      if (sex) user.sex = sex;
      if (fullName) user.fullName = fullName;
      if (phone) user.phone = phone;
      if (address) user.address = address;
      await user.save();
      res.json(user);
    }
    catch (err) {
      console.log(err)
      res.status(500).json({ error: "Internal Server Error" })
    }
  },
};

const createAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
};
const createRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

module.exports = userCtrl;
