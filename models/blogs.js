var mongoose = require('mongoose');
// Schema for  Mongoose
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body : String,
    author: String,
	created: {type:Date, default:Date.now},
});
module.exports = mongoose.model("blog",blogSchema);
