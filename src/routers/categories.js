const express = require('express');
const router = express.Router();
const fs = require("fs");
const path = require("path");

const models = require("../models");
const controllers = require("../controllers");
const helpers = require("../helpers");


let default_fields = (category = {}) => {
    return {
        charfield: [
            {label: "Название вашей категории:", name: "name", required: true, default: category.name, maxlength: 75},
            {label: "URL:", name: "url", required: true, default: category.url, maxlength: 50},
            {label: 'Описание:', name: 'description', default: category.description, maxlength: 200},
        ],
        checkbox: [
            {label: "Включить заголовок", name: "titleField", default: category.titleField},
            {label: "Включить подзаголовок", name: "subtitleField", default: category.subtitleField},
            {label: "Включить текст", name: "textField", default: category.textField},
            {label: "Включить изображение", name: "imageField", default: category.imageField},
            {label: "Категория активна", name: "actuality", default: category.actuality}
        ],
        filefield: [{label: 'Изображение:', name: 'image'}],
        image: category.image,
        submit_bottom: true,
        enctype: "multipart/form-data",
    }
};

let default_fields_off = {
    titleField: false,
    subtitleField: false,
    textField: false,
    imageField: false,
    actuality: false
};

router.get("/api", async (req, res) => {
    let data = await controllers.findModel({
        model: models.Category, filter: {actuality: true},
        projection: {
            uuid: false,
            __v: false,
            actuality: false,
            titleField: false,
            imageField: false,
            subtitleField: false,
            textField: false,
            created_at: false,
            updated_at: false,
            description: false
        }
    });
    res.send(data);
});

router.get("/", async (req, res) => {
    let data = await controllers.getListObjects({
        model: models.Category,
        title: "Категории",
        url: req.originalUrl,
        addable: true,
        deletable: true,
    });

    res.render("index", data);
});


router.post("/", async (req, res) => {
    let categories = await models.Category.find({'_id': {$in: Object.keys(req.body)}}).select('url  -_id')
    let urls = [];
    categories.forEach(category => urls.push(category.url))

    await controllers.deleteObjects(models.Category, req.body);
    await models.CategoryItem.deleteMany({'category': {$in: urls}}, err => {
        if (err) console.log(err)
    })

    res.redirect(req.originalUrl);
});

router.get("/add", (req, res) => {
    res.render("index", {...controllers.addObject({...default_fields(), url: req.originalUrl})});
});

router.post("/add", (req, res) => {
    let upload = helpers.upload.single('image');
    upload(req, res, async function (err) {
        if (err) {
            let data = {...controllers.addObject({...default_fields(req.body), url: req.originalUrl})}
            data.messages = [];
            if (err.code === "LIMIT_FILE_SIZE") {
                data.messages.push({messageClass: 'alert-danger', message: "Слишком большой файл"})
            } else {
                data.messages.push({messageClass: 'alert-danger', message: err.code})
            }
            return res.render("index", data);
        }

        let last_category = await controllers.findModel({model: models.Category, type: "last"});
        let obj = {
            _id: last_category ? (Number(last_category._id) + 1) : 1,
            uuid: helpers.getHashedPassword(last_category ? last_category.uuid : "1"),
            ...req.body
        };

        if (req.file) obj.image = '/uploads/' + obj.url + "/" + req.file.filename;

        let category = new models.Category(obj);
        await category.save();
        res.redirect("/categories")
    })
});

router.get("/:url/change", async (req, res) => {
    let category = await controllers.findModel({model: models.Category, filter: {url: req.params.url}, type: "one"});
    let data = {...controllers.addObject({...default_fields(category), url: req.originalUrl})};
    res.render("index", data)
});

router.post("/:url/change", helpers.upload.single('image'), async (req, res, next) => {
    let obj = {...default_fields_off, ...req.body}
    if (req.file) obj.image = '/uploads/' + obj.url + "/" + req.file.filename;
    await models.Category.updateOne({"url": req.params.url}, obj, {new: true},
        err => {
            if (err) console.log(err);
        }
    )
    ;

    res.redirect("/categories/" + obj.url || req.params.url);
});


module.exports = router;