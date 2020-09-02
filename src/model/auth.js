const database = require("../config/config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authModel = {
  register: (body) => {
    return new Promise((resolve, reject) => {
      const { password } = body;
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          reject({ msg: "unknown error" });
        }
        bcrypt.hash(password, salt, (err, hashedPassword) => {
          let registerQuery = "";
          if (body.notLoggingIn) {
            registerQuery = "INSERT INTO users SET ?";
          } else {
            registerQuery =
              "INSERT INTO users SET ?;SELECT first_name, last_name, type_id FROM users WHERE users.email=?;";
          }
          const { notLoggingIn, ...updatedBody } = body;
          console.log(updatedBody);
          if (err) {
            reject({ msg: "Unknown Error" });
          }
          const newBody = { ...updatedBody, password: hashedPassword };
          database.query(registerQuery, [newBody, body.email], (err, data) => {
            if (!err) {
              try {
                const payload = {
                  email: body.email,
                  type_id: body.type_id,
                };
                const token = jwt.sign(payload, process.env.SECRET_KEY);
                const { first_name, last_name, type_id } = data[1][0];
                const msg = "Account Registered";
                resolve({ first_name, last_name, type_id, msg, token });
              } catch (e) {
                const msg = "Account Registered";
                resolve({ msg });
              }
            } else {
              reject({ msg: "Account Already Exist" });
            }
          });
        });
      });
    });
  },
  login: (body) => {
    return new Promise((resolve, reject) => {
      const loginQuery =
        "SELECT first_name, last_name, email, password, type_id FROM users WHERE email=?;";
      database.query(loginQuery, [body.email], (err, data) => {
        if (err) {
          reject({ msg: "query error" });
        }
        if (data.length === 0) {
          const msg = "User Not Found. Please Register First";
          reject({ msg });
        } else {
          bcrypt.compare(body.password, data[0].password, (err, isSame) => {
            if (err) {
              reject({ msg: "Unknown Error" });
            }
            if (isSame) {
              const { first_name, last_name, email, type_id } = data[0];
              const payload = {
                email,
                type_id,
              };
              const token = jwt.sign(payload, process.env.SECRET_KEY);
              const msg = "Login Success";
              resolve({ first_name, last_name, type_id, msg, token });
            } else {
              reject({ msg: "Wrong Password" });
            }
          });
        }
      });
    });
  },
  userData: (body) => {
    return new Promise((resolve, reject) => {
      const userQuery = `SELECT first_name, last_name, type_id FROM users WHERE users.email=?`;
      database.query(userQuery, [body.email], (err, data) => {
        if (err) {
          reject({ msg: "User not found" });
        }
        resolve(data);
      });
    });
  },
};

module.exports = authModel;