const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
require('dotenv/config');

const models = require("../src/models/models");
const router = require("../src/routers");

const app = express();
const publicDir = path.join(__dirname, "../public");
const viewsDir = path.join(__dirname, "../templates/views");

app.use(express.static(publicDir));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "hbs");
app.set("views", viewsDir);


const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

const upload = multer({storage: storage});

/*
ToDo: categories models
ToDo: category
ToDo: create form
ToDo: create form Handler
*/

app.use("/", router);

function get_the_path(path) {
    let path_dict = {
        "": {url: "/", name: "Главная"},
        "categories": {url: "categories/", name: "Категории"},
        "add": {url: "add/", name: "Добавить"},
        "change": {url: "change/", name: "Изменить"},
    };

    if (path.slice(-1) === "/") path = path.replace(/.$/, "");
    let path_split = path.split("/");
    let output_path = [];

    for (let i = 0; i < path_split.length; i++) {
        let name = path_dict[path_split[i]] ? path_dict[path_split[i]].name : path_split[i];
        let full_path = "";
        for (let j = 0; j <= i; j++) {
            if (path_dict[path_split[j]]) full_path += path_dict[path_split[j]].url;
            else full_path += path_split[j] + "/";
        }
        full_path = full_path !== "/" ? full_path.replace(/.$/, "") : "/";
        output_path.push({name, full_path})
    }
    return output_path;
}

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/categories", (req, res) => {
    models.Category.find((err, categories) => {
        let data = {title: "Категории", objects: [], url: req.url, breadcrumb: get_the_path(req.url)};
        get_the_path(req.url);
        categories.forEach((category) => {
            data.objects.push({"id": category._id, "name": category.name});
        });
        res.render("objects", data);
    });
});

app.post("/categories", (req, res) => {
    models.Category.deleteMany(
        {_id: {$in: Object.keys(req.body)}},
        (err, result) => {
            res.redirect("categories")
        }
    );
});

app.get("/categories/add", (req, res) => {
    let data = {
        breadcrumb: get_the_path(req.url),
        charfield: [
            {label: "Название вашей категории:", name: "name", required: "required"}
        ],
        checkbox: [
            {label: "Включить заголовок", name: "titleField"},
            {label: "Включить подзаголовок", name: "subtitleField"},
            {label: "Включить текст", name: "textField"},
            {label: "Включить изображение", name: "imageField"},
        ]
    };
    get_the_path(req.url);
    res.render("object", data);
});

app.post("/categories/add", (req, res) => {
    models.Category.find({}).sort({_id: -1}).limit(1).then((categories) => {
        let values = {
            _id: categories[0] ? (Number(categories[0]._id) + 1).toString() : "1",
            name: req.body.name,
            imageField: Boolean(req.body.imageField),
            titleField: Boolean(req.body.titleField),
            subtitleField: Boolean(req.body.subtitleField),
            textField: Boolean(req.body.textField)
        };

        let category = new models.Category(values);
        category.save();
        res.redirect("/categories")
    });
});


app.get("/categories/:id/", (req, res) => {
    models.CategoryItem.find({category: req.params.id}, (err, items) => {
        let data = {title: "Категории", objects: [], url: req.url, breadcrumb: get_the_path(req.url), change: true};
        get_the_path(req.url);
        items.forEach((item) => {
            data.objects.push({"id": item._id, "name": item.title || item.subtitle || item.text});
        });
        res.render("objects", data);
    });
});

app.post("/categories/:id/", (req, res) => {
    models.CategoryItem.deleteMany(
        {_id: {$in: Object.keys(req.body)}},
        (err, result) => {
            res.redirect("/categories/" + req.params.id)
        }
    );
});

app.get("/categories/:id/add", (req, res) => {
    models.Category.findOne({_id: req.params.id}, (err, category) => {
        let data = {charfield: [], textfield: [], filefield: [], breadcrumb: get_the_path(req.url)};

        if (category.titleField) data.charfield.push({label: 'Введите заголовок:', name: 'title'});
        if (category.subtitleField) data.charfield.push({label: 'Введите подзаголовок:', name: 'subtitle'});
        if (category.textField) data.textfield.push({label: 'Введите текст:', name: 'text'});
        if (category.imageField) data.filefield.push({label: 'Изображение:', name: 'image'});

        res.render("object", data)
    });
});


app.post('/categories/:id/add', upload.single('image'), (req, res, next) => {
    let categoryId = req.params.id;

    let obj = {...req.body, category: categoryId,};

    if (req.body.image) {
        obj.image = {
            data: fs.readFileSync(path.join(__dirname, '../uploads/' + req.file.filename)),
            contentType: 'image/png'
        }
    }

    models.CategoryItem.find({}).sort({_id: -1}).limit(1).then((items) => {
        obj["_id"] = items[0] ? (Number(items[0]._id) + 1).toString() : "1";

        let categoryItem = new models.CategoryItem(obj);
        categoryItem.save();
        res.redirect("/categories/" + categoryId)
    });
});

app.get("/categories/:id/change", (req, res) => {
    models.Category.findOne({_id: req.params.id}, (err, category) => {
        if (err) console.log(err);
        let data = {
            breadcrumb: get_the_path(req.url),
            charfield: [
                {label: "Название вашей категории:", name: "name", required: "required"}
            ],
            checkbox: [
                {label: "Включить заголовок", name: "titleField"},
                {label: "Включить подзаголовок", name: "subtitleField"},
                {label: "Включить текст", name: "textField"},
                {label: "Включить изображение", name: "imageField"},
            ]
        };

        if (category.name) data.charfield[0].default = category.name;

        for (let i = 0; i < data.checkbox.length; i++) {
            if (category[data.checkbox[i].name]) data.checkbox[i].default = "checked"
        }

        console.log(data.checkbox);
        res.render("object", data)
    });
});

app.listen(3000, () => {
    console.log("Server has started")
});