const express = require('express');
const router = express.Router();
const mkdirp = require('mkdirp');
const fs = require('fs-extra');
const resizeImg = require('resize-img');
var auth = require('../config/auth');
var isAdmin = auth.isUser;
const Product = require('../models/product');
var Category = require('../models/category');


router.get('/', isAdmin , function(req, res){
  var count;

  Product.count(function(err, c) {
    count = c;
  });

  Product.find(function(err, products) {
      res.render('admin/products', {
          products: products,
          count: count
      });
  });

});

router.get('/add-product', isAdmin , function(req, res){

      var title = "";
      var desc = "";
      var price = "";
      var weight = "";

      Category.find(function (err, categories) {
          res.render('admin/add_product', {
              title: title,
              desc: desc,
              categories: categories,
              price: price,
              weight: weight
          });
      });

  });


  router.post('/add-product', function(req, res){

      if(!req.files){ imageFile =""; }

      if(req.files){
        var imageFile = typeof(req.files.image) !== "undefined" ? req.files.image.name : "";
      }

      req.checkBody('title', 'El producto debe tener un nombre.').notEmpty();
      req.checkBody('desc', 'El producto debe tener una descripcion.').notEmpty();
      req.checkBody('price', 'El producto debe tener un precio.').isDecimal();
      req.checkBody('weight', 'El producto debe tener un peso.').isDecimal();

      var title = req.body.title;
      var slug = title.replace(/\s+/g, '-').toLowerCase();
      var desc = req.body.desc;
      var price = req.body.price;
      var category = req.body.category;
      var weight = req.body.weight;

      var errors = req.validationErrors();

      if (errors) {
          Category.find(function (err, categories) {
              res.render('admin/add_product', {
                  errors: errors,
                  title: title,
                  desc: desc,
                  categories: categories,
                  price: price,
                  weight: weight
              });
          });
      } else {
          Product.findOne({slug: slug}, function (err, product) {
              if (product) {
                  req.flash('danger', 'Product title exists, choose another.');
                  Category.find(function (err, categories) {
                      res.render('admin/add_product', {
                          title: title,
                          desc: desc,
                          categories: categories,
                          price: price,
                          weight: weight
                      });
                  });
              } else {

                  var price2 = parseFloat(price).toFixed(2);
                  var weight2 = parseFloat(weight).toFixed(2);

                  var product = new Product({
                      title: title,
                      slug: slug,
                      desc: desc,
                      price: price2,
                      category: category,
                      image: imageFile,
                      weight: weight2
                  });

                  product.save(function (err) {
                      if (err)
                          return console.log(err);

                      mkdirp('public/product_images/' + product._id, function (err) {
                          return console.log(err);
                      });

                      mkdirp('public/product_images/' + product._id + '/gallery', function (err) {
                          return console.log(err);
                      });

                      mkdirp('public/product_images/' + product._id + '/gallery/thumbs', function (err) {
                          return console.log(err);
                      });

                      if (imageFile != "") {
                          var productImage = req.files.image;
                          var path = 'public/product_images/' + product._id + '/' + imageFile;

                          productImage.mv(path, function (err) {
                              return console.log(err);
                          });
                      }

                      req.flash('success', 'Producto Añadido con exito!');
                      res.redirect('/admin/products');
                  });
              }
          });
      }

  });

  router.get('/edit-product/:id', isAdmin , function (req, res) {

      var errors;

      if (req.session.errors)
          errors = req.session.errors;
      req.session.errors = null;

      Category.find(function (err, categories) {

          Product.findById(req.params.id, function (err, p) {
              if (err) {
                  console.log(err);
                  res.redirect('/admin/products');
              } else {
                  var galleryDir = 'public/product_images/' + p._id + '/gallery';
                  var galleryImages = null;

                  fs.readdir(galleryDir, function (err, files) {
                      if (err) {
                          console.log(err);
                      } else {
                          galleryImages = files;

                          res.render('admin/edit_product', {
                              title: p.title,
                              errors: errors,
                              desc: p.desc,
                              categories: categories,
                              category: p.category.replace(/\s+/g, '-').toLowerCase(),
                              price: parseFloat(p.price).toFixed(2),
                              image: p.image,
                              galleryImages: galleryImages,
                              weight: parseFloat(p.weight).toFixed(2),
                              id: p._id
                          });
                      }
                  });
              }
          });

      });

  });

router.post('/edit-product/:id', function (req, res) {

  if(!req.files){ imageFile =""; }

  if(req.files){
    var imageFile = typeof(req.files.image) !== "undefined" ? req.files.image.name : "";
  }

  req.checkBody('title', 'El producto debe tener un nombre.').notEmpty();
  req.checkBody('desc', 'El producto debe tener una descripcion.').notEmpty();
  req.checkBody('price', 'El producto debe tener un precio.').isDecimal();
  req.checkBody('weight', 'El producto debe tener un peso.').isDecimal();

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var desc = req.body.desc;
  var price = req.body.price;
  var category = req.body.category;
  var weight = req.body.weight;
  var pimage = req.body.pimage;
  var id = req.params.id;

  var errors = req.validationErrors();

  if (errors) {
      req.session.errors = errors;
      res.redirect('/admin/products/edit-product/' + id);
  } else {
      Product.findOne({slug: slug, _id: {'$ne': id}}, function (err, p) {
          if (err)
              console.log(err);

          if (p) {
              req.flash('danger', 'El producto ya existe.');
              res.redirect('/admin/products/edit-product/' + id);
          } else {
              Product.findById(id, function (err, p) {
                  if (err)
                      console.log(err);

                  p.title = title;
                  p.slug = slug;
                  p.desc = desc;
                  p.price = parseFloat(price).toFixed(2);
                  p.category = category;
                  if (imageFile != "") {
                      p.image = imageFile;
                  }
                  p.weight = weight;

                  p.save(function (err) {
                      if (err)
                          console.log(err);

                      if (imageFile != "") {
                          if (pimage != "") {
                              fs.remove('public/product_images/' + id + '/' + pimage, function (err) {
                                  if (err)
                                      console.log(err);
                              });
                          }

                          var productImage = req.files.image;
                          var path = 'public/product_images/' + id + '/' + imageFile;

                          productImage.mv(path, function (err) {
                              return console.log(err);
                          });

                      }

                      req.flash('success', 'Producto editado!');
                      res.redirect('/admin/products/edit-product/' + id);
                  });

              });
          }
      });
  }

});

router.post('/product-gallery/:id', function (req, res) {

    var productImage = req.files.file;
    var id = req.params.id;
    var path = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
    var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

    productImage.mv(path, function (err) {
        if (err)
            console.log(err);

        resizeImg(fs.readFileSync(path), {width: 100, height: 100}).then(function (buf) {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);

});

router.get('/delete-image/:image', isAdmin , function (req, res) {

    var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    fs.remove(originalImage, function (err) {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Imagen Eliminada!');
                    res.redirect('/admin/products/edit-product/' + req.query.id);
                }
            });
        }
    });
});

router.get('/delete-product/:id', isAdmin , function (req, res) {

    var id = req.params.id;
    var path = 'public/product_images/' + id;

    fs.remove(path, function (err) {
        if (err) {
            console.log(err);
        } else {
            Product.findByIdAndRemove(id, function (err) {
                console.log(err);
            });

            req.flash('success', 'Producto Eliminado!');
            res.redirect('/admin/products');
        }
    });

});



module.exports = router;
