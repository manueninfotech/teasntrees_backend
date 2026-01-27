// TeasNTrees About Page
// Information about the café and contact details

import './AboutPage.css';

const AboutPage = () => {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="container">
                    <h1 className="about-title">About TeasNTrees</h1>
                    <p className="about-tagline">Where Nature Meets Flavor</p>
                </div>
            </section>

            {/* Story Section */}
            <section className="about-story">
                <div className="container">
                    <div className="story-content">
                        <div className="story-image">
                            <div className="story-image-placeholder">
                                <span className="story-icon">🍃</span>
                                <span className="story-icon">☕</span>
                                <span className="story-icon">🌿</span>
                            </div>
                        </div>

                        <div className="story-text">
                            <h2>Our Story</h2>
                            <p>
                                TeasNTrees was born from a simple idea: to create a sanctuary where
                                people can escape the chaos of daily life and reconnect with nature
                                through the simple pleasure of a perfectly brewed cup.
                            </p>
                            <p>
                                Founded in 2020, we've been committed to sourcing the finest teas and
                                coffees from sustainable farms around the world. Every leaf, every bean
                                is carefully selected to ensure you experience the purest flavors nature
                                has to offer.
                            </p>
                            <p>
                                Our café is more than just a place to grab a drink—it's a community hub
                                where friends meet, ideas flourish, and moments are savored. Surrounded
                                by greenery and filled with the aroma of fresh brews, TeasNTrees is your
                                home away from home.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="about-mission">
                <div className="container">
                    <h2 className="section-title">Our Mission</h2>
                    <div className="mission-grid">
                        <div className="mission-card">
                            <div className="mission-icon">🌱</div>
                            <h3>Sustainability</h3>
                            <p>
                                We partner with eco-friendly farms and use biodegradable packaging
                                to minimize our environmental impact.
                            </p>
                        </div>

                        <div className="mission-card">
                            <div className="mission-icon">💚</div>
                            <h3>Quality</h3>
                            <p>
                                Every product we serve meets our high standards for taste, freshness,
                                and authenticity.
                            </p>
                        </div>

                        <div className="mission-card">
                            <div className="mission-icon">🤝</div>
                            <h3>Community</h3>
                            <p>
                                We believe in building connections and creating a welcoming space
                                for everyone.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="about-contact">
                <div className="container">
                    <h2 className="section-title">Visit Us</h2>

                    <div className="contact-content">
                        <div className="contact-info">
                            <div className="contact-item">
                                <div className="contact-icon">📍</div>
                                <div className="contact-details">
                                    <h3>Address</h3>
                                    <p>123 Green Street, Tea Garden</p>
                                    <p>City, State 560001</p>
                                </div>
                            </div>

                            <div className="contact-item">
                                <div className="contact-icon">📞</div>
                                <div className="contact-details">
                                    <h3>Phone</h3>
                                    <p>+91 98765 43210</p>
                                    <p>+91 98765 43211</p>
                                </div>
                            </div>

                            <div className="contact-item">
                                <div className="contact-icon">✉️</div>
                                <div className="contact-details">
                                    <h3>Email</h3>
                                    <p>hello@teasntrees.com</p>
                                    <p>support@teasntrees.com</p>
                                </div>
                            </div>

                            <div className="contact-item">
                                <div className="contact-icon">🕐</div>
                                <div className="contact-details">
                                    <h3>Opening Hours</h3>
                                    <p>Monday - Friday: 8:00 AM - 10:00 PM</p>
                                    <p>Saturday - Sunday: 9:00 AM - 11:00 PM</p>
                                </div>
                            </div>
                        </div>

                        <div className="contact-map">
                            <div className="map-placeholder">
                                <span className="map-icon">🗺️</span>
                                <p>Map Location</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
