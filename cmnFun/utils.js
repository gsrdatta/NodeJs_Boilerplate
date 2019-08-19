var speakeasy = require("speakeasy")
const mongoose = require('mongoose');
const Roles = mongoose.model('Roles');
const Promise = require('bluebird')

module.exports = {
  isAdmin: function (role) {
    return new Promise(function (resolve, reject) {
      Roles.findById(role, (err, res) => {
        if (res && res.roleCode == 'adm') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
    })
  },
  getAdminId: function () {
    return new Promise(function (resolve, reject) {
      Roles.find({ "roleCode": 'adm' }, (err, res) => {
        if (res.length > 0) {
          resolve(res[0]);
        } else {
          resolve(false);
        }
      })
    })
  },
  validateEmail: function (email) {
    const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return expression.test(String(email).toLowerCase())
  },
  validatePassword: function (password) {
    const expression = /^(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,30}$/i;
    return expression.test(String(password))
  },
  clone: function (obj) {
    let copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    // Handle Array
    else if (obj instanceof Array) {
      copy = [];
      for (let i = 0, len = obj.length; i < len; i++) {
        copy[i] = this.clone(obj[i]);
      }
      return copy;
    }

    // Handle Object
    else if (obj instanceof Object) {
      copy = {};
      for (let attr in obj) {
        if (obj.hasOwnProperty(attr)) {
          copy[attr] = this.clone(obj[attr])
        };
      }
      return copy;
    }
    else if (JSON.stringify(obj)) {
      newObject = JSON.parse(JSON.stringify(obj))
      if (newObject instanceof Object) {
        copy = {};
        for (let attr in newObject) {
          if (newObject.hasOwnProperty(attr)) {
            copy[attr] = this.clone(newObject[attr])
          };
        }
        return copy;
      }
    }
    console.log("Unable to copy obj! Its type isn't supported.");
  },
  getRandNum: function (digits) {
    var min = parseInt(1 + new Array(digits).join('0'));
    var max = parseInt(9 + new Array(digits).join('9'));
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};