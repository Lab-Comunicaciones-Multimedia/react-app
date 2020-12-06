import React, { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive"; //for reading CSS variables and media queries
//import logo from './logo.svg';
import './App.css';

const DARK_CLASS = "dark";

class Header extends React.Component{
  render(){
    return(
      <header className="App-header">
        <div id="box">
          <DarkModeToggle/>
        </div>
        <div id="box">
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
      dark: false
    };
  }
  render(){
    return (
    <div className="App">
      <Header mode={this.state.dark}/>
      <div style={{position: "relative"}}>
        <VideoBox/>
        <PurpleFriend/>
      </div>
      <SmileySun/>
    </div>
  );
    };
}

export default App;
