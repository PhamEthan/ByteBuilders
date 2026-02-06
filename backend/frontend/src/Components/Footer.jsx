import { Link } from 'react-router-dom';
import '../css/Footer.css';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <span className="footer-name">Because We Care</span>
                </div>
                <div className="footer-links">
                    <Link to="/features" className="footer-link">Features</Link>
                    <Link to="/learn" className="footer-link">Learn more</Link>
                    <Link to="/support" className="footer-link">Support</Link>
                </div>
                <div className="footer-socials">
                    <button className="social-icon" aria-label="Instagram">*</button>
                    <button className="social-icon" aria-label="LinkedIn">*</button>
                    <button className="social-icon" aria-label="Twitter">𝕏</button>
                </div>
            </div>
        </footer>
    );
}

export default Footer;