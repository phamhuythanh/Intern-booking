const menu = document.getElementById('menu-toogle');
const modal = document.getElementById('booking-modal');
const menuIcon = document.getElementById('menu-icon');

function toggleElementDisplay(element) {
  if (element.classList.contains('d-none')) {
    element.classList.remove('d-none');
  } else {
    element.classList.add('d-none');
  }
}

function toggleMenu()
{
  toggleElementDisplay(menuIcon);
  toggleElementDisplay(menu);
}

function toggleModal()
{
  toggleElementDisplay(modal);
}
