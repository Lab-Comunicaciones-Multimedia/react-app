import React, { useEffect, useState } from "react";
//for reading CSS variables and media queries
import { useMediaQuery } from "react-responsive";
//import logo from './logo.svg';
import './App.css';

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
class VideoBox extends React.Component{

  render(){
    return (
        <div id="box" className="video-box">
        </div>
    );
  };
}
class SideBar extends React.Component{
  render(){
    return(
      <div id='box' className="sidebar">
      </div>
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

const SmileySun = () => {
  return(
    <div id="sunmoon" className="day">
      <div id="sunmoon-face"></div>
    </div>
  );
}
const PurpleFriend = () => {
  return(
    <div id="friend">
      <div id="friend-face"></div>
    </div>
  );
}
class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
    };
  }
  render(){
    return (
    <div className="App">
      <Header/>
      <div>
        {/*<SideBar></SideBar>*/}
        <div id="content">
          <PurpleFriend/>
          <VideoBox/>
        </div>
      </div>
      <SmileySun/>
    </div>
  );
    };
}

export default App;
