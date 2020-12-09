import React from "react";
//import { JanusVideoRoom } from 'react-videoroom-janus';
import './VideoBox.css';
import './EchoTest'
import EchoTest from "./EchoTest";
import VideoRoomTest from "./VideoRoomTest";

class VideoBox extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      
    };
  }

    render(){
      return (
          <div id="box" className="video-box">
          {/*<EchoTest/>*/}
            <VideoRoomTest/>
          </div>
      );
    };
  }

  export default VideoBox;