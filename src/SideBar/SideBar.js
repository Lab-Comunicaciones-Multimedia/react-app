import React from "react";
import './SideBar.css';
import ChatRoomTest from '../ChatBox/ChatRoomTest';

class SideBar extends React.Component{
    render(){
      return(
        <div id='box' className="sidebar">
          <ChatRoomTest />
        </div>
      );
    };
  }

export default SideBar;