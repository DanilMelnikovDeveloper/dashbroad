const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/administrationDB",
    {useNewUrlParser: true, useUnifiedTopology: true});

const categorySchema = new mongoose.Schema({
    _id: {type: String, required: true},
    name: {type: String, required: true},
    titleField: Boolean,
    subtitleField: Boolean,
    textField: Boolean,
    imageField: Boolean,
}, {_id: false});

const Category = mongoose.model("Category", categorySchema);

const categoryItemSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    category: {type: String, required: true},
    title: String,
    subtitle: String,
    textField: String,
    imageField: {
        data: Buffer,
        contentType: String
    },
});

const CategoryItem = mongoose.model("CategoryItem", categoryItemSchema);

module.exports = {Category, CategoryItem};