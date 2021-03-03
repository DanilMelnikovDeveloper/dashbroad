function get_the_path(path) {
    let path_dict = {
        "": {url: "/", name: "Главная"},
        "categories": {url: "categories/", name: "Категории"},
        "add": {url: "add/", name: "Добавить"},
        "change": {url: "change/", name: "Изменить"},
        "users": {url: "users/", name: "Пользователи"},
        "login": {url: "login/", name: "Войти в аккаунт"},
        "registration": {url: "registration/", name: "Регистрация аккаунта"},
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

const crypto = require('crypto');
const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    return sha256.update(password).digest('base64').slice(0, 35);
};

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
};


const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const models = require("./models");

const args = yargs(hideBin(process.argv)).argv;

async function handleAction() {
    if (args.action === 'createsuperuser') {
        if (!args.username) {
            console.log("Укажите --username=");
            return
        }
        if (!args.password) {
            console.log("Укажите --password=");
            return
        }

        let user = {username: args.username, password: args.password.toString(), actuality: true};
        user.password = getHashedPassword(user.password);

        let item = await models.User.find({}).sort({_id: -1}).limit(1);
        user._id = item._id ? (Number(item._id) + 1) : 1;
        user.uuid = getHashedPassword(user.password);
        user = new models.User(user);
        await user.save();
        console.log('Пользователь добавлен')
    }
}

const fs = require("fs");
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = './public/uploads' + '/' + (req.body.url || req.params.url)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        let fileName = file.fieldname + '-' + Date.now();
        if (req.originalUrl === "/categories/add") fileName = "categoryCover";
        cb(null, fileName + "." + file.originalname.split(".").slice(-1)[0])
    }
});

const upload = multer({storage: storage, limits: {fileSize: 2 * 1024 * 1024}});

module.exports = {get_the_path, getHashedPassword, generateAuthToken, handleAction, upload};