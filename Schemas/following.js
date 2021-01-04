var mongoose = require("mongoose");

var schema = mongoose.Schema({
  username: String,
  followed: Number,
});

var Model = mongoose.model("followModel", schema, "following");

module.exports = Model;
