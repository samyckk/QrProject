import React from 'react';
import { Helmet } from 'react-helmet-async';

const AboutUs = () => {
  return (
    <div className="AboutUsContainer">
      <Helmet>
        <title>About Us</title>
      </Helmet>
      <h1>About Us</h1>
      <div className="AboutUs">
        <p>
          <h6 className="summary">
            Welcome to our QR-based eCommerce platform! We are passionate about
            building innovative solutions that enhance online shopping
            experiences. Our expertise lies in Full-Stack Development, with a
            strong foundation in technologies such as React.js, Node.js,
            Express, JavaScript, MongoDB, and more.
          </h6>
        </p>

        <p>
          <h6 className="summary">
            This project showcases our technical capabilities and problem-solving
            skills. By integrating QR codes, we aim to simplify product access
            and create a seamless shopping experience for users. We hope you
            enjoy using our platform as much as we enjoyed developing it!
          </h6>
        </p>
        <ul className="teamList">
          <h3>Meet the Developer</h3>

          <li className="person">
            <strong>Priyamvada</strong> - Full Stack Developer
            <br />
            <a href="https://www.linkedin.com/in/priyamvada-sharma-7a569026b/890" target="_blank">
              View Priyamvada's LinkedIn
            </a>
            <p className="role">Lead Developer & Project Owner</p>
            <img src="/images/priyamvada.jpg" alt="Priyamvada"  width="200" height="300" />

            <br />
            <br />
            <br />
          </li>
        </ul>
      </div>
      <h3>Contact Us</h3>
      <ul className="ContactList">
        <li>Email: vadaodd145@gmail.com</li>
        <li>Phone: +91-6350220638</li>
        <li>Address: India</li>
      </ul>
    </div>
  );
};

export default AboutUs;