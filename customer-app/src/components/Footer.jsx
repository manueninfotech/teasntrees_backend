// TeasNTrees Footer Component
// Footer with café information and branding

import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    {/* Brand Section */}
                    <div className="footer-section">
                        <div className="footer-brand">
                            <span className="footer-icon">🍃</span>
                            <h3>TeasNTrees</h3>
                        </div>
                        <p className="footer-tagline">Fresh Tea, Natural Taste</p>
                        <p className="footer-description">
                            Experience the perfect blend of nature and flavor at TeasNTrees.
                            We serve premium teas, artisan coffees, and delicious treats in a
                            cozy, nature-inspired atmosphere.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <ul className="footer-links">
                            <li><a href="/">Home</a></li>
                            <li><a href="/menu">Menu</a></li>
                            <li><a href="/about">About Us</a></li>
                            <li><a href="/cart">Cart</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="footer-section">
                        <h4>Contact Us</h4>
                        <ul className="footer-contact">
                            <li>
                                <span className="contact-icon">📍</span>
                                <span>123 Green Street, Tea Garden, City 560001</span>
                            </li>
                            <li>
                                <span className="contact-icon">📞</span>
                                <span>+91 98765 43210</span>
                            </li>
                            <li>
                                <span className="contact-icon">✉️</span>
                                <span>hello@teasntrees.com</span>
                            </li>
                            <li>
                                <span className="contact-icon">🕐</span>
                                <span>Mon - Sun: 8:00 AM - 10:00 PM</span>
                            </li>
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div className="footer-section">
                        <h4>Follow Us</h4>
                        <div className="social-links">
                            <a href="#" className="social-link" aria-label="Facebook">📘</a>
                            <a href="#" className="social-link" aria-label="Instagram">📷</a>
                            <a href="#" className="social-link" aria-label="Twitter">🐦</a>
                            <a href="#" className="social-link" aria-label="WhatsApp">💬</a>
                        </div>
                        <p className="footer-newsletter">
                            Subscribe to our newsletter for special offers and updates!
                        </p>
                    </div>
                </div>

                {/* Copyright */}
                <div className="footer-bottom">
                    <p>&copy; {currentYear} TeasNTrees. All rights reserved.</p>
                    <p className="footer-credit">Made with 💚 for tea lovers</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
