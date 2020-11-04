const winston = require("winston");
const LoginService = require("./login.service");
const UserService = require("./user.service");
const { User } = require("../models");

const logger = winston.loggers.get("logger");

exports.loginServiceInstance = new LoginService({ logger, userModel: User });

exports.userServiceInstance = new UserService({ logger, userModel: User });
