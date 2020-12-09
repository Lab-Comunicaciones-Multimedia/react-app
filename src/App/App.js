import React from "react";
//import logo from './logo.svg';
import './App.css';
import Header from '../Header/Header';
import SideBar from '../SideBar/SideBar';
import VideoBox from '../VideoBox/VideoBox';
import VideoRoomTest from '../VideoBox/VideoRoomTest';
import {SmileySun, PurpleFriend} from '../friendos/friendos.js';

import { v1 as uuidv1 } from 'uuid';

//const server = "http://localhost:8088/janus";

//const params = new URLSearchParams(window.location.href);

/*let user_id = params.get(`user_id`);

if (!user_id) {
	user_id = uuidv1();
}*/

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
          <VideoRoomTest/>
        </div>
        <div id="footer"></div>
      </div>
      <SmileySun/>
    </div>
  );
    };
}

export default App;
