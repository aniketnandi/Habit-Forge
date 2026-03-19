const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { getDB } = require("./connection");

function configurePassport() {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const db = getDB();
        const user = await db
          .collection("users")
          .findOne({ username: username.trim().toLowerCase() });

        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, { _id: user._id, username: user.username });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const db = getDB();
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
      if (!user) return done(null, false);
      done(null, { _id: user._id, username: user.username });
    } catch (err) {
      done(err);
    }
  });

  return passport;
}

module.exports = configurePassport;
