import { Link } from 'react-router-dom';
import { FaFacebookF } from 'react-icons/fa'
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
                    <Link to="/employee" className="footer-link">Employee Login</Link>
                </div>
                <div className="footer-socials">
                    <a 
                        href='https://www.facebook.com/profile.php?id=61581488677863'
                        target='_blank'
                        rel='noreferrer'
                        className='social-icon'
                        aria-label='Facebook'
                    >
                        <FaFacebookF/>
                    </a>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
