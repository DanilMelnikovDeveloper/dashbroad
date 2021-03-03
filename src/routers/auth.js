const express = require('express');
const router = express.Router();

const models = require("../models");
const helpers = require("../helpers");
const controllers = require("../controllers");

let get_data = (req, user) => {
    return {
        auth: true,
        url: req.originalUrl,
        charfield: [
            {label: 'Логин:', name: 'username', required: true, default: user ? user.username : ""},
            {label: 'Пароль:', name: 'password', type: 'password', required: !user},
        ],
        submit_bottom: true
    }
};

router.get('/', async (req, res) => {
    let data = await controllers.getListObjects({
        model: models.User,
        title: "Пользователи",
        url: req.originalUrl,
        addable: true,
        deletable: true,
    });
    res.render("index", data);
});

router.post("/", async (req, res) => {
    await controllers.deleteObjects(models.User, req.body);
    res.redirect(req.originalUrl);
});

router.get("/login", (req, res) => {
    if (req.user) return res.redirect("/");
    let data = {...get_data(req), title: 'Вход в административную панель'};
    res.render("index", data)
});

router.post("/login", async (req, res) => {
    if (req.user) return res.redirect("/");

    let user = {...req.body};
    user.password = helpers.getHashedPassword(user.password);
    let data = {...get_data(req), title: 'Вход в административную панель', messages: []};

    if (!user.username || !user.password) {
        data.messages.push({message: 'Заполните все поля', messageClass: 'alert-warning'});
        res.render("index", data);
        return
    }

    user = await controllers.findModel({model: models.User, filter: user, one: true,});

    if (!user.length) {
        data.messages.push({message: 'Пользователь не найден', messageClass: 'alert-danger'});
        res.render("index", data);
        return
    } else if (!user[0].actuality) {
        data.messages.push({message: 'Пользователь заморожен', messageClass: 'alert-warning'});
        res.render("index", data);
        return
    }

    user = user[0];

    const authToken = helpers.generateAuthToken();
    const update_token = await controllers.findModel({model: models.Token, filter: {user: user.uuid}, one: true});

    if (!update_token.length) {
        const token = new models.Token({authToken, user: user.uuid});
        await token.save()
    } else {
        await models.Token.updateOne({"_id": update_token[0]._id}, {authToken}, (err) => {
                if (err) console.log(err);
            }
        );
    }

    res.cookie('AuthToken', authToken);
    res.redirect("/");
});

router.get('/logout', (req, res) => {
    res.clearCookie("AuthToken");
    res.redirect("/users/login")
});

router.get("/add", (req, res) => {
    let data = {
        ...get_data(req),
        title: "Регистрация нового аккаунта",
        breadcrumb: helpers.get_the_path(req.originalUrl),
        checkbox: [{label: "Пользователь активен", name: "actuality", default: "checked"}]
    };

    data.charfield.push(
        {label: 'Повторите пароль:', name: 'confirm_password', type: 'password', required: true},
        {label: 'Описание:', name: 'description'},
    );
    res.render("index", data)
});


router.post('/add', async (req, res) => {
    let user = {...req.body};

    if (user.password !== user.confirm_password) console.log('Пароли не совпадают');

    user.password = helpers.getHashedPassword(user.password);
    let item = await controllers.findModel({model: models.User, type: "last"});
    user._id = item ? (Number(item._id) + 1) : 1;
    user.uuid = helpers.getHashedPassword(user.username + user.password);

    user = new models.User(user);
    await user.save();
    res.redirect("/users")
});


router.get("/:id", async (req, res) => {
    let user = await controllers.findModel({model: models.User, filter: {_id: req.params.id}, one: true});
    user = user.length ? user[0] : null;

    let data = {
        ...get_data(req, user),
        title: "Регистрация нового аккаунта",
        breadcrumb: helpers.get_the_path(req.originalUrl),
        checkbox: [{label: "Пользователь активен", name: "actuality", default: user.actuality ? "checked" : ""}]
    };

    data.charfield.push(
        {label: 'Повторите пароль:', name: 'confirm_password', type: 'password'},
        {label: 'Описание:', name: 'description', default: user.description},
    );

    res.render("index", data)
});

router.post("/:id", async (req, res) => {
    let user = {username: req.body.username, description: req.body.description, actuality: !!req.body.actuality};

    if (req.body.password) {
        if (req.body.password !== req.body.confirm_password) console.log('Пароли не совпадают');
        user.password = helpers.getHashedPassword(user.password);
    }

    await models.User.updateOne({_id: req.params.id}, user);

    res.redirect("/users")
});

module.exports = router;