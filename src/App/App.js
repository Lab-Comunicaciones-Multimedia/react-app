import React from "react";
//import logo from './logo.svg';
import './App.css';
import Header from '../Header/Header';
import SideBar from '../SideBar/SideBar';
import VideoBox from '../VideoBox/VideoBox';
import {SmileySun, PurpleFriend} from '../friendos/friendos.js';

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
      <div className="App-container">
        <div id="sidebar"><SideBar/></div>
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
