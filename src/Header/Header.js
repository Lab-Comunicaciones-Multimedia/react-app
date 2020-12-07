import React, { useEffect, useState } from "react";
//for reading CSS variables and media queries
import { useMediaQuery } from "react-responsive";
import './Header.css';

const DARK_CLASS = "dark";

class Header extends React.Component{
    render(){
      return(
        <header className="App-header">
          <div id="box" style={{border: '2px solid #000'}}>
            <DarkModeToggle/>
          </div>
          <div id="box" className="header-links">
          <nav>
            <a className="header-nav-link">Home</a>
            <a className="header-nav-link" >About</a>
          </nav>
          </div>
        </header>
      );
    };
  }

  const DarkModeToggle = () => {

    // Read 'prefers-color-scheme' media query (user preference) and apply whenever it changes (setIsDark(prefersDark))
    const systemPrefersDark = useMediaQuery({
        query: '(prefers-color-scheme: dark)'
      }, 
      undefined, 
      prefersDark => setIsDark(prefersDark)
    );
  
    // Hook for setting dark/light state
    const [isDark, setIsDark] = useState(systemPrefersDark);
  
    useEffect(() => {
      if(isDark){
        document.documentElement.classList.add(DARK_CLASS)
      }else{
        document.documentElement.classList.remove(DARK_CLASS)
      }
    },[isDark]);
  
    return(
      <label className="switch">
        <input type="checkbox" className="switch-darkmode" checked={isDark} 
        onChange={event => setIsDark(event.target.checked)}
        />
        <span className="slider round"></span>
      </label>
    );
  }
  
  export default Header;