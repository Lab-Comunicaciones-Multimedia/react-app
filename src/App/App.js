import React from "react";
//import logo from './logo.svg';
import './App.css';
import Header from '../Header/Header'
import SideBar from '../SideBar/SideBar'
import {SmileySun, PurpleFriend} from '../friendos/friendos.js';


class VideoBox extends React.Component{

  render(){
    return (
        <div id="box" className="video-box">
        </div>
    );
  };
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
