const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const nodeMailer = require('../../config/nodeMailer');
const utils = require('../../cmnFun/utils')
const Users = mongoose.model('Users');
const Roles = mongoose.model('Roles');
const crypto = require('crypto');
var speakeasy = require("speakeasy")
var fs = require('fs');
const logger = require('../../config/winston');
var _js = require('underscore');

router.post('/', auth.optional, (req, res, next) => {
  try {
    const user = req.body;
    if (!user.firstName) {
      return res.status(422).json({
        errors: {
          message: res.__('First name is required'),
        },
      });
    }

    if (!user.lastName) {
      return res.status(422).json({
        errors: {
          message: res.__('Last name is required'),
        },
      });
    }
    if (!user.email) {
      return res.status(422).json({
        errors: {
          message: res.__('Email is required'),
        },
      });
    }

    if (!utils.validateEmail(user.email)) {
      return res.status(422).json({
        errors: {
          message: res.__('Plese enter a Valid Email Address'),
        },
      });
    }

    if (!user.password) {
      return res.status(422).json({
        errors: {
          message: res.__('Password is required'),
        },
      });
    }

    if (!utils.validatePassword(user.password)) {
      return res.status(422).json({
        errors: {
          message: res.__('Password must be at least 8 characters, and must include at least one upper case letter, one lower case letter, and one numeric digit and a spcial charcter'),
        }
      });
    }
    user.emailVerified = false;
    Users.find({ email: user.email }).exec(function (err, userDetails) {
      if (userDetails.length > 0) {
        return res.status(422).json({
          errors: {
            message: res.__('Email Already Registered'),
          },
        });
      } else {
        Roles.find({ roleCode: 'psl' }).exec(function (err, roles) {
          if (roles) {
            user.role = roles[0]._id;
            createUser(user, res, req);
          } else {
            return res.status(422).json({
              errors: {
                message: res.__('Some Error Occured. Contact us with Error Code: 2122'),
              },
            });
          }
        })
      }
    })
  } catch (err) {
    logger.error("error in User Signup" + err);
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
});

function createUser(user, res, req) {
  try {
    const finalUser = new Users(user);
    finalUser.setPassword(user.password);
    return finalUser.save().then(() => {
      sendEmailVerificationEmail(req, res, finalUser);
      res.json({ message: res.__("Registration Successful, Proceed to Login") })
    });
  } catch (err) {
    logger.error("error in Create user function");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
}

function sendEmailVerificationEmail(req, res, user) {
  try {
    crypto.randomBytes(48, function (err, buffer) {
      var token = buffer.toString('hex');
      Users.updateOne({ _id: user._id }, { $set: { verificationToken: token } }, (err, val) => {
        if (err) {
          logger.error(err);
          return res.status(500).json({
            errors: {
              message: res.__('Internal Server Error')
            }
          });
        }
        let link = process.env.NODE_SRC + "/api/users/verify?id=" + user._id.toString() + "&token=" + token;
        fs.readFile('././templates/email.html', 'utf8', function (err, html) {
          if (html.indexOf("$name") !== -1) {
            html = html.replace("$name", user.firstName);
          }
          if (html.indexOf("$heading") !== -1) {
            html = html.replace("$heading", res.__("Welcome to Bitium"));
          }
          if (html.indexOf("$salutation") !== -1) {
            html = html.replace("$salutation", res.__("Hello"));
          }
          if (html.indexOf("$linkMsg") !== -1) {
            html = html.replace("$linkMsg", res.__("If you are unable to click above button, copy and paste the below url in browser :"));
          }
          if (html.indexOf("$subject") !== -1) {
            html = html.replace("$subject", res.__("Click on the below link to confirm your Email."));
          }
          if (html.indexOf("$link") !== -1) {
            html = html.replace("$link", link);
          }
          if (html.indexOf("$link") !== -1) {
            html = html.replace("$link", link);
          }
          if (html.indexOf("$button") !== -1) {
            html = html.replace("$button", res.__("Confirm Email"));
          }
          var mailOptions = {
            to: user.email,
            from: "info@bitium.io",
            subject: res.__("Please confirm your Email account"),
            html: html
          }
          nodeMailer(mailOptions).then((result) => {
            if (result) {
              logger.info("Email verification mail Sent");
            } else {
              logger.info("Password reset mail not Sent");
            }
          })
        })
      })
    });
  } catch (err) {
    logger.error("error in sendEmailVerificationEmail");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
}

router.post('/login', auth.optional, (req, res, next) => {
  try {
    const user = req.body;
    if (!user.email) {
      return res.status(422).json({
        errors: {
          message: res.__('Email is required')
        },
      });
    }
    if (!user.password) {
      return res.status(422).json({
        errors: {
          message: res.__('Password is required')
        },
      });
    }

    passport.authenticate('local', { session: true }, (err, passportUser, info) => {
      if (err) {
        return next(err);
      }
      if (passportUser) {
        if (req.query.id == 'dABaLuSivn') {
          Roles.find({ roleCode: 'sp' }, (err, role) => {
            if (role.length > 0) {
              if (role[0]._id.toString() == passportUser.role.toString()) {
                const user = passportUser;
                user.token = passportUser.generateJWT();
                return res.json({ user: user.toAuthJSON() });
              } else {
                return res.status(422).json({
                  errors: {
                    message: res.__('Invalid Username or Password')
                  },
                });
              }
            }
          })
        } else {
          const user = passportUser;
          user.token = passportUser.generateJWT();
          return res.json({ user: user.toAuthJSON() });
        }
      } else {
        return res.status(422).json({
          errors: {
            message: res.__('Invalid Username or Password')
          },
        });
      }

    })(req, res, next);
  } catch (err) {
    logger.error("error in login");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
});


router.post('/forgotPassword', auth.optional, (req, res, next) => {
  try {
    const user = req.body;

    if (!user.email) {
      return res.status(422).json({
        errors: {
          message: res.__('Email is required')
        },
      });
    }

    return Users.find({ email: user.email }, (err, doc) => {
      if (err) {
        logger.error(err);
        return res.status(500).json({
          errors: {
            message: res.__('Internal Server Error')
          }
        });
      }
      if (doc.length > 0) {
        crypto.randomBytes(48, function (err, buffer) {
          var token = buffer.toString('hex');
          Users.updateOne({ _id: doc[0]._id }, { $set: { verificationToken: token } }, (err, val) => {
            if (err) {
              logger.error(err);
              return res.status(500).json({
                errors: {
                  message: res.__('Internal Server Error')
                }
              });
            }
            //To-do add frontend set password route
            let link = process.env.WEB_ADDRESS + "/set-password/" + doc[0]._id.toString() + "/" + token;
            fs.readFile('././templates/email.html', 'utf8', function (err, html) {
              if (html.indexOf("$name") !== -1) {
                html = html.replace("$name", doc[0].firstName);
              }
              if (html.indexOf("$heading") !== -1) {
                html = html.replace("$heading", res.__("Reset Password"));
              }
              if (html.indexOf("$salutation") !== -1) {
                html = html.replace("$salutation", res.__("Hello"));
              }
              if (html.indexOf("$linkMsg") !== -1) {
                html = html.replace("$linkMsg", res.__("If you are unable to click above button, copy and paste the below url in browser :"));
              }
              if (html.indexOf("$subject") !== -1) {
                html = html.replace("$subject", res.__("Click on the below link to reset your password"));
              }
              if (html.indexOf("$link") !== -1) {
                html = html.replace("$link", link);
              }
              if (html.indexOf("$link") !== -1) {
                html = html.replace("$link", link);
              }
              if (html.indexOf("$button") !== -1) {
                html = html.replace("$button", res.__("Reset password"));
              }
              var mailOptions = {
                to: user.email,
                from: "info@bitium.io",
                subject: res.__("Reset your password"),
                html: html
              }
              nodeMailer(mailOptions).then((result) => {
                if (result) {
                  return res.json({ message: res.__("Password reset mail Sent") });
                } else {
                  return res.status(422).json({
                    errors: {
                      message: res.__('Some error occured, please retry again')
                    }
                  });
                }
              })
            })
          })
        });
      } else {
        return res.status(422).json({
          errors: {
            message: res.__('Email not Registered'),
          }
        });
      }
    });
  } catch (err) {
    logger.error("error in forgotPassword");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
});

router.get('/verify', auth.optional, (req, res, next) => {
  try {
    let data = req.query;
    Users.findById(mongoose.Types.ObjectId(data.id), (err, user) => {
      if (err) {
        logger.error(err);
        return res.status(500).json({
          errors: {
            message: res.__('Internal Server Error')
          }
        });
      }
      if (user && !user.emailVerified) {
        if (data.token === user.verificationToken) {
          Users.updateOne({ _id: user._id }, { $set: { verificationToken: "", emailVerified: true } }, (err, val) => {
            if (err) {
              logger.error(err);
              return res.status(500).json({
                errors: {
                  message: res.__('Internal Server Error')
                }
              });
            }
            // redirect to Email Verified Successfull Page
            fs.readFile('././templates/response.html', 'utf8', function (err, html) {
              if (html.indexOf("$subject") !== -1) {
                html = html.replace("$subject", res.__("Email Verification Successful"));
              }
              if (html.indexOf("$description") !== -1) {
                html = html.replace("$description", res.__("Your Email is now verified and you may proceed to login by clicking the button below"));
              }
              if (html.indexOf("$button") !== -1) {
                html = html.replace("$button", res.__("Proceed to login"));
              }
              if (html.indexOf("$link") !== -1) {
                html = html.replace("$link", process.env.WEB_ADDRESS + "/login");
              }
              res.send(html)
            })
          })
        } else {
          return res.status(422).json({
            errors: {
              message: res.__('Invalid Token, Request for resend of Verification Email')
            }
          });
        }
      } else {
        return res.status(422).json({
          errors: {
            message: res.__('Email Already Verified')
          }
        });
      }
    })
  } catch (err) {
    logger.error("error in verify");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
});

router.post('/setPassword', auth.optional, (req, res, next) => {
  try {
    let data = req.body;
    const id = data.id;
    Users.findById(mongoose.Types.ObjectId(id), (err, user) => {
      if (err) {
        logger.error(err);
        return res.status(500).json({
          errors: {
            message: res.__('Internal Server Error')
          }
        });
      }
      if (user) {
        if (data.token === user.verificationToken) {
          user.verificationToken = "";
          if (!utils.validatePassword(data.newPassword)) {
            return res.status(422).json({
              errors: {
                message: res.__('Password must be at least 8 characters, and must include at least one upper case letter, one lower case letter, and one numeric digit and a spcial charcter'),
              },
            });
          }
          const finalUser = new Users(user);
          finalUser.setPassword(data.newPassword);
          return finalUser.updateOne(finalUser, (err, doc) => {
            if (err) {
              logger.error(err);
              return res.status(500).json({
                errors: {
                  message: res.__('Internal Server Error')
                }
              });
            }
            res.json({ message: res.__("Password Reset Successful") })
          });
        } else {
          return res.status(422).json({
            errors: {
              message: res.__('Invalid Verification Token or Expired, Request new link to reset password')
            }
          });
        }
      } else {
        return res.status(422).json({
          errors: {
            message: res.__('No user found')
          }
        });
      }
    })
  } catch (err) {
    logger.error("error in setPassword");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
});

router.post('/updateProfile', auth.required, (req, res, next) => {
  try {
    let data = req.body;
    const id = req.payload.id;
    //todo change email if its not verified
    Users.findById(req.payload.id, function (err, user) {
      if ((data.email != user.email) && !user.emailVerified) {
        Users.find({ email: data.email }).exec(function (err, userDetails) {
          if (userDetails.length > 0) {
            return res.status(422).json({
              errors: {
                message: res.__('Email Already Registered'),
              },
            });
          } else {
            if (!utils.validateEmail(data.email)) {
              return res.status(422).json({
                errors: {
                  message: res.__('Plese enter a Valid Email Address'),
                },
              });
            }
            Users.updateOne({ _id: user._id }, { $set: data }, (err, doc) => {
              if (err) {
                logger.error(err);
                return res.status(500).json({
                  errors: {
                    message: res.__('Internal Server Error')
                  }
                });
              }
              if (doc) {
                res.json({ message: res.__("Profile Updated Successfully") })
              }
            })
          }
        })
      } else {
        var emailsent = false;
        if (data.email) {
          delete data.email;
          emailsent = true;
        }
        Users.updateOne({ _id: user._id }, { $set: data }, (err, doc) => {
          if (err) {
            logger.error(err);
            return res.status(500).json({
              errors: {
                message: res.__('Internal Server Error')
              }
            });
          }
          if (doc) {
            if (emailsent) {
              res.json({ message: res.__("Profile Updated Successfully, Except Email as it's verified") })
            } else {
              res.json({ message: res.__("Profile Updated Successfully") })
            }
          }
        })
      }
    })
  } catch (err) {
    logger.error("error in setPassword");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
});

router.post('/changePassword', auth.required, (req, res, next) => {
  try {
    let data = req.body;
    const id = req.payload.id;
    Users.findById(id, (err, user) => {
      if (err) {
        logger.error(err);
        return res.status(500).json({
          errors: {
            message: res.__('Internal Server Error')
          }
        });
      }
      if (user && user.validatePassword(data.currentPassword)) {
        // if (!utils.validatePassword(data.newPassword)) {
        //   return res.status(422).json({
        //     errors: {
        //       message: res.__('Password must be at least 8 characters, and must include at least one upper case letter, one lower case letter, and one numeric digit and a special charcter'),
        //     },
        //   });
        // }
        const finalUser = new Users(user);
        finalUser.setPassword(data.newPassword);
        return finalUser.updateOne(finalUser, (err, doc) => {
          if (err) {
            logger.error(err);
            return res.status(500).json({
              errors: {
                message: res.__('Internal Server Error')
              }
            });
          }
          res.json({ message: res.__("Password Changed Successfully") })
        });
      } else {
        return res.status(422).json({
          errors: {
            message: res.__('Current Passowrd does not match')
          }
        });
      }
    })
  } catch (err) {
    logger.error("error in changePassword");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
});

router.post('/resendVerification', auth.optional, (req, res, next) => {
  try {
    const user = req.body;
    Users.find({ email: user.email }, (err, user) => {
      if (err) {
        logger.error(err);
        return res.status(500).json({
          errors: {
            message: res.__('Internal Server Error')
          }
        });
      }
      if (user.length > 0) {
        if (!user[0].emailVerified) {
          sendEmailVerificationEmail(req, res, user[0]);
          return res.json({
            message: res.__('Verification Email Sent')
          });
        } else {
          return res.status(422).json({
            errors: {
              message: res.__('Email Already Verified')
            }
          });
        }
      } else {
        return res.status(422).json({
          errors: {
            message: res.__('Email Not Found')
          }
        });
      }
    });
  } catch (err) {
    logger.error("error in resendVerification");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured')
      }
    });
  }
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  try {
    const id = req.payload.id;
    Users.findById(id, 'firstName lastName companyName email ipVerification twoFactorEnabled emailVerified prefferences', function (err, user) {
      if (err) {
        logger.error(err);
      }
      return res.json({ user: user });
    })
  } catch (err) {
    logger.error("error in currentUser");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
});

router.get('/notifications', auth.required, (req, res, next) => {
  try {
    const id = req.payload.id;
    return res.json({ count: 0 });
  } catch (err) {
    logger.error("error in currentUser");
    return res.status(400).json({
      errors: {
        message: res.__('Some Error Occured'),
      },
    });
  }
});

//Admin Routes
router.get('/all', auth.required, (req, res, next) => {
  const roleId = req.payload.role;
  utils.isAdmin(roleId).then((isAdmin) => {
    if (isAdmin) {
      Users.find({}, ['firstName', 'lastName', 'email', '_id', 'twoFactorEnabled', 'ipVerification', 'emailVerified', 'createdDate'], (err, user) => {
        res.json(user);
      })
    } else {
      return res.status(500).json({
        errors: {
          message: res.__('Invalid Request'),
        },
      });
    }
  })
})



module.exports = router;