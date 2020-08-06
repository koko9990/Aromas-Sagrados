$(function(){

  if($('textarea#ta').length) {
    CKEDITOR.replace('ta');
  }

  $('a.confirmDeletion').on('click', function() {
        if (!confirm('Confirmar eliminación'))
            return false;
          });

});
