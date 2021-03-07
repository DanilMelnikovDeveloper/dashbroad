const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/administrationDB",
    {useNewUrlParser: true, useUnifiedTopology: true});

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const categorySchema = new mongoose.Schema({
        _id: {type: String, required: true},
        name: {type: String, required: true},
        url: {type: String, required: true, unique: true},
        uuid: {type: String, required: true},
        image: String,
        titleField: Boolean,
        subtitleField: Boolean,
        textField: Boolean,
        imageField: Boolean,
        tableField: Boolean,
        description: {type: String},
        actuality: {type: Boolean, default: false},
    }, {_id: false, timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}}
);

const Category = mongoose.model("Category", categorySchema);

const categoryItemSchema = new mongoose.Schema({
        _id: {type: String, required: true},
        uuid: {type: String, required: true},
        category: {type: String, required: true},
        title: String,
        subtitle: String,
        text: String,
        image: String,
        table: String,
        actuality: {type: Boolean},
        description: {type: String},
    }, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}}
);

const CategoryItem = mongoose.model("CategoryItem", categoryItemSchema);

const userSchema = new mongoose.Schema({
        _id: {type: Number, required: true},
        uuid: {type: String, required: true},
        username: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        actuality: {type: Boolean},
        description: {type: String},
    }, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}}
);

const User = mongoose.model("User", userSchema);

const tokenSchema = new mongoose.Schema({
        authToken: {type: String, required: true},
        user: {type: String, required: true}
    }, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}}
);


const Token = mongoose.model("Token", tokenSchema);


module.exports = {Category, CategoryItem, User, Token};