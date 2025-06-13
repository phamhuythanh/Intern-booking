<template>
    <footer>
      <div class="footer-items">
        <div>
          <h3 class="footer-heading white">Address</h3>
          <p class="footer-text">200, Green road, Mongla,</p>
          <p class="footer-text">New Yor City USA</p>
          <a href="#" class="footer-link gray-dark active-under text-decor-none"
            >Get Direction</a
          >
        </div>
        <div>
          <h3 class="footer-heading white">Reservation</h3>
          <p class="footer-text">+10 367 267 2678</p>
          <p class="footer-text">reservation@montana.com</p>
        </div>
        <div>
          <h3 class="footer-heading white">Navigation</h3>
          <ul class="footer-list">
            <li class="footer-list-item">
              <a class="nav-link">
                <router-link to="/" class="text-light">Home</router-link>
              </a>
            </li>
            <li class="footer-list-item">
              <a class="nav-link">
                <router-link to="/rooms" class="text-light">Rooms</router-link>
              </a>
            </li>
            <li class="footer-list-item">
              <a class="nav-link">
                <router-link to="/about" class="text-light">About</router-link>
              </a>
            </li>
            <li class="footer-list-item">
              <a class="nav-link">
                <router-link to="/contact" class="text-light">Contact</router-link>
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="footer-heading white">Newsletter</h3>
          <form action="" method="get" class="form-signup">
            <input
              class="form-signup-input"
              type="email"
              name="email"
              placeholder="Enter your mail"
            />
            <button class="form-signup-button" type="submit">Sign Up</button>
          </form>
          <p class="footer-text" s>Subscribe newsletter to get updates</p>
        </div>
      </div>
      <div class="footer-copyright">
        <div>
          <span>
            Copyright ©2025 All rights reserved | This template is made with
          </span>
          <span> by </span>
          <span class="blue"> Colorlib </span>
        </div>
      </div>
    </footer>
</template>
