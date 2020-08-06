const express = require('express');
const router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isUser;
const Category = require('../models/category');

router.get('/', isAdmin, function(req, res){
  Category.find(function(err, categories) {
      if (err) return console.log(err);
      res.render('admin/categories', {
          categories: categories
      });
  });
});

router.get('/add-category', isAdmin, function(req, res){

      var title = "";

      res.render('admin/add_category', {
          title: title
      });
  });


  router.post('/add-category', function(req, res){

      req.checkBody('title', 'El titulo debe tener un valor.').notEmpty();

      var title = req.body.title;
      var slug = title.replace(/\s+/g, '-').toLowerCase();

      var errors = req.validationErrors()

      if (errors) {
        res.render('admin/add_category', {
            errors: errors,
            title: title
        });
      } else {
          Category.findOne({slug: slug}, function(err, category) {
            if (category) {
              req.flash('danger', 'La categoria existe, escoge otra.');
              res.render('admin/add_category', {
                  title: title
              });
            } else {
                var category = new Category({
                  title: title,
                  slug: slug
                });

                category.save(function(err){
                    if (err)
                        return console.log(err);

                    req.flash('success', 'Categoria añadida');
                    res.redirect('/admin/categories');
                });

            }
          });
      }

  });



  router.get('/edit-category/:id', isAdmin , function(req, res){

        Category.findById(req.params.id, function(err, category){
            if (err)
                return console.log(err);

            res.render('admin/edit_category', {
                    title: category.title,
                    id: category._id
                  });
        });
    });

    router.post('/edit-category/:id', function(req, res){

        req.checkBody('title', 'El titulo debe tener un valor.').notEmpty();

        var title = req.body.title;
        var slug = title.replace(/\s+/g, '-').toLowerCase();
        var id = req.params.id;

        var errors = req.validationErrors()

        if (errors) {
          res.render('admin/edit_category', {
              errors: errors,
              title: title,
              id: id
          });
        } else {
            Category.findOne({slug: slug, _id:{'$ne': id}}, function(err, category) {
              if (category) {
                req.flash('danger', 'La categoria de la pagina existe, escoge otra.');
                res.render('admin/edit_category', {
                    title: title,
                    id: id
                  });
              } else {
                Category.findById(id, function (err, category) {
                    if (err)
                        return console.log(err);

                    category.title = title;
                    category.slug = slug;

                    category.save(function (err) {
                        if (err)
                            return console.log(err);

                        Category.find(function (err, categories) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.app.locals.categories = categories;
                            }
                        });

                        req.flash('success', 'Category editada!');
                        res.redirect('/admin/categories/edit-category/' + id);
                    });

                });

              }
            });
        }

    });

    router.get('/delete-category/:id', isAdmin , function(req, res){
      Category.findByIdAndRemove(req.params.id, function(err){
        if (err)
            return console.log(err);

        req.flash('success', 'Categoria eliminada');
        res.redirect('/admin/categories/');

      });
    });

module.exports = router;
