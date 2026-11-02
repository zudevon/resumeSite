(function($) {
  "use strict";

  var sections = ['about', 'experience', 'education', 'skills', 'interests', 'awards', 'projects'];

  function showPage(id) {
    if (sections.indexOf(id) === -1) id = 'about';

    sections.forEach(function(s) {
      var $section = $('#' + s);
      if (s === id) {
        $section.removeClass('d-none');
      } else {
        $section.addClass('d-none');
      }
    });

    $('.js-page').each(function() {
      var href = $(this).attr('href').replace('#', '');
      $(this).toggleClass('active', href === id);
    });

    history.pushState(null, null, '#' + id);
    window.scrollTo(0, 0);
  }

  $(document).ready(function() {
    var initial = (window.location.hash || '#about').replace('#', '');
    showPage(initial);

    $(document).on('click', '.js-page', function(e) {
      e.preventDefault();
      var target = $(this).attr('href').replace('#', '');
      showPage(target);
      $('.navbar-collapse').collapse('hide');
    });

    $(window).on('popstate', function() {
      var id = (window.location.hash || '#about').replace('#', '');
      showPage(id);
    });
  });

})(jQuery);
