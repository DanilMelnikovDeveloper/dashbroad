const helpers = require('../helpers');

async function findModel({model, filter, type, projection}) {
    if (type === "one") return model.findOne(filter, (err) => {
        if (err) console.log(err)
    });
    if (type === "last") {
        return await model.findOne({}, {}, { sort: { 'created_at' : -1 } })
    }
    return await model.find(filter, projection, (err) => {
        if (err) console.log(err)
    }).sort({'created_at': -1});
}

async function getListObjects({model, filter, title, url, addable, changeable, deletable}) {
    let objects = await findModel({model, filter});
    let data = {
        objects: [],
        breadcrumb: helpers.get_the_path(url),
        title,
        url,
        addable,
        changeable,
        deletable,
    };
    objects.forEach((obj) => {
        data.objects.push({
            id: obj._id,
            url: url + (obj.url ? "/" + obj.url : "/" + obj._id),
            name: obj.name || obj.title || obj.subtitle || obj.text || obj.username || obj.description || obj._id,
            deletable,
        });
    });
    return data;
}

async function deleteObjects(model, dict) {
    await model.deleteMany({_id: {$in: Object.keys(dict)}},
        (err) => {
            if (err) console.log(err);
        }
    );
}

function addObject(data) {
    data.breadcrumb = helpers.get_the_path(data.url);
    return data;
}

module.exports = {getListObjects, deleteObjects, addObject, findModel};