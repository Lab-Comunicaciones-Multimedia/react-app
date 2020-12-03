import React from 'react';
//import logo from './logo.svg';
import './App.css';

const lightStyle = {
  backgroundColor: "rgb(255, 235, 205)"
};
const darkStyle = {
  backgroundColor: "midnightblue"
};
class Header extends React.Component{
  render(){
    return(
      <header className="App-header">
        <nav>
          <label className="switch">
              <input type="checkbox" className="switch-darkmode"/>
              <span className="slider round"></span>
          </label>
          <a className="header-nav-link">Home</a>
          <a className="header-nav-link" >About</a>
        </nav>
      </header>
    );
  };
}
class VideoBox extends React.Component{

  render(){
    return (
      <div className="video-box">

      </div>
    );
  };
}
function SmileySun (){
  return(
    <div id="sunmoon" className="day">
      <div id="sunmoon-face"></div>
    </div>
  );
}
function PurpleFriend (){
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
      <VideoBox/>
      <PurpleFriend/>
      <SmileySun/>
    </div>
  );
    };
}

export default App;
