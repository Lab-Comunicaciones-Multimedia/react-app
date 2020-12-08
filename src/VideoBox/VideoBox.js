import React from "react";
//import { JanusVideoRoom } from 'react-videoroom-janus';
import './VideoBox.css';
import './EchoTest'
import EchoTest from "./EchoTest";

class VideoBox extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      
    };
  }

    render(){
      return (
          <div id="box" className="video-box">
          <EchoTest/>
          </div>
      );
    };
  }

  export default VideoBox;