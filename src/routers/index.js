const express = require('express');
const router = express.Router();
const helpers = require("../helpers");

router.use(function timeLog(req, res, next) {
    next()
});

router.get("/", (req, res) => {
    let data = {
        title: "Главная страница",
        objects: [{"url": "users", "name": "Пользователи"}, {"url": "categories", "name": "Категории"}],
        url: req.url,
        breadcrumb: helpers.get_the_path(req.url)
    };
    res.render("index", data);
});

router.use('/users', require('../routers/auth'));
router.use('/categories', require('../routers/categories'));
router.use('/categories', require('../routers/categoryItem'));

module.exports = router;