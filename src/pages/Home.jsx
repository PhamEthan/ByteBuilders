import "../css/Home.css"

function Home(){
    return (
    <div className="home">

      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Quality Care is Our Priority</h1>
            <div className="hero-buttons">
              <button className="btn btn-primary">Call to action</button>
              <button className="btn btn-secondary">Secondary</button>
            </div>
        </div>          
      </div>

      <div className="section">
        <div class="content-grid">
            <div class="content-text">
                <h2>Title</h2>
                <p>text</p>
                <button class="btn btn-primary">Button</button>
            </div>
            <div class="content-image"></div>
        </div>
      </div>

      <div className="section">
        <div class="content-grid">
          <div class="content-image"></div>
            <div class="content-text">
                <h2>Title</h2>
                <p>text</p>
                <button class="btn btn-primary">Button</button>
            </div>
            
        </div>
      </div>
    </div>
    );
}

export default Home;