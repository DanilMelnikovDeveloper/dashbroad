const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require('cookie-parser');
const cors = require('cors')

const models = require("./models");
const helpers = require("./helpers");

const app = express();
const publicDir = path.join(__dirname, "../public");
const viewsDir = path.join(__dirname, "../templates/views");

// require("./models/students")

app.use(cors())
app.use(express.static(publicDir));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.set("view engine", "hbs");
app.set("views", viewsDir);

app.use(cookieParser());
app.use(async (req, res, next) => {
    let authToken = req.cookies['AuthToken'];
    let token = await models.Token.findOne({authToken});
    if (token) req.user = await models.User.findOne({uuid: token.user});

    if (!req.user && req.originalUrl !== "/users/login" && !req.originalUrl.endsWith("api")) {
        res.redirect("/users/login");
        return
    }

    next();
});

const router = require("../src/routers");
app.use("/", router);


app.listen(3000, () => {
    console.log("Server has started")
});

helpers.handleAction();