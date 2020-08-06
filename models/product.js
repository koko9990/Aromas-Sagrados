var mongoose = require('mongoose');

var productSchema = mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    slug: {
        type: String
    },
    desc: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String
    },
    weight: {
        type: Number,
        required: true
    }

});

var Product = module.exports =mongoose.model('Product', productSchema);
