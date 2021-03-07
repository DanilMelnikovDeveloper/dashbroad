const express = require('express');
const router = express.Router();
const fs = require("fs");
const path = require("path");

const models = require("../models");
const controllers = require("../controllers");
const helpers = require("../helpers");

function getTable(categoryItemTable) {
    let table = [];
    if (categoryItemTable) {
        categoryItemTable.split("<n>").forEach(row => {
            let rowDict = {"cells": row};
            if (row.includes('<b>')) {
                rowDict['rowBold'] = true;
                rowDict['cells'] = rowDict['cells'].split("<b>").join("").split("</b>").join("")
            }
            rowDict['cells'] = rowDict['cells'].split("|")
            table.push(rowDict)
        })
    }
    return table
}

function add_default_fields(category = {}, categoryItem = {}) {
    return {
        charfield: [
            category.titleField ? {
                label: 'Введите заголовок:',
                name: 'title',
                default: categoryItem.title,
                maxlength: 75
            } : "",
            category.subtitleField ? {
                label: 'Введите подзаголовок:',
                name: 'subtitle',
                default: categoryItem.subtitle,
                maxlength: 75
            } : "",
            category.textField ? {
                label: 'Введите текст:',
                name: 'text',
                default: categoryItem.text,
                maxlength: 15000
            } : "",
            category.tableField ? {
                label: 'Таблица',
                name: 'table',
                default: categoryItem.table
            } : "",
            {
                label: 'Описание:', name: 'description', default: categoryItem.description,
                maxlength: 200
            }
        ],
        filefield: [category.imageField ? {label: 'Изображение:', name: 'image'} : "",],
        checkbox: [{label: "Информация активна", name: "actuality", default: categoryItem.actuality}],
        tablefield: !!category.tableField,
        tablerows: categoryItem.table ? getTable(categoryItem.table) : "",
        enctype: category.imageField ? "multipart/form-data" : "",
        image: categoryItem.image,
        submit_bottom: true,
    }
}

router.get("/:url/api", async (req, res) => {
    let data = await controllers.findModel({
        model: models.CategoryItem, filter: {actuality: true, category: req.params.url},
        fields: 'title subtitle text image table',
    });

    res.send(data);
});

router.get("/:url/", async (req, res) => {
    let data = await controllers.getListObjects({
        model: models.CategoryItem,
        title: "Объекты в категории",
        url: req.originalUrl,
        addable: true,
        deletable: true,
        changeable: true,
        filter: {category: req.params.url}
    });

    res.render("index", data);
});

router.post("/:url/", async (req, res) => {
    await controllers.deleteObjects(models.CategoryItem, req.body);
    res.redirect(req.originalUrl);
});

router.get("/:url/add", async (req, res) => {
    let category = await controllers.findModel({model: models.Category, filter: {url: req.params.url}, type: "one"});
    let data = {...controllers.addObject({...add_default_fields(category), url: req.originalUrl})};
    res.render("index", data)
});


router.post('/:url/add', helpers.upload.single('image'), async (req, res, next) => {
    let categoryUrl = req.params.url;
    let obj = {...req.body, category: categoryUrl,};
    if (req.file) obj.image = '/uploads/' + req.params.url + "/" + req.file.filename;

    let item = await controllers.findModel({model: models.CategoryItem, type: "last"});
    obj._id = item ? (Number(item._id) + 1) : 1;
    obj.uuid = helpers.getHashedPassword(item ? item.uuid : "1");

    let categoryItem = new models.CategoryItem(obj);
    await categoryItem.save();

    res.redirect("/categories/" + categoryUrl)
});


router.get("/:url/:itemId", async (req, res) => {
    let category = await controllers.findModel({model: models.Category, filter: {"url": req.params.url}, type: "one"});

    let categoryItem = await controllers.findModel({
        model: models.CategoryItem, filter: {"_id": req.params.itemId}, type: "one"
    });

    let data = {...controllers.addObject({...add_default_fields(category, categoryItem), url: req.originalUrl}),};

    res.render("index", data)
});

router.post("/:url/:itemId", helpers.upload.single('image'), async (req, res, next) => {
    let obj = {...req.body, actuality: !!req.body.actuality};
    if (req.file) obj.image = '/uploads/' + req.params.url + "/" + req.file.filename;

    await models.CategoryItem.updateOne({"_id": req.params.itemId}, obj, (err) => {
            if (err) console.log(err);
        }
    );
    res.redirect("/categories/" + req.params.url);
});

module.exports = router;