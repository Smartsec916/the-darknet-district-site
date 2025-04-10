
// Back to top button
window.onscroll = function() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    document.getElementById("backToTop").style.display = "block";
  } else {
    document.getElementById("backToTop").style.display = "none";
  }
};

function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}
