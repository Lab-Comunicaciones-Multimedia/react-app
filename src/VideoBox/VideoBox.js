import React from "react";
import './VideoBox.css';
import { JanusVideoRoom } from 'react-videoroom-janus'; 
//import { JanusHelper } from '../janus/JanusHelper';
import Video from './Video';
import { v1 as uuidv1 } from 'uuid';

const server = "ws://localhost:8188";
const user_id = uuidv1();

const styles = {
	'0': {
		container:{
			height: `100%`,
			width: `100%`,
			position: `relative`
		},
		localVideo:{
			width: `200px`,
			height: `auto`
		},
		localVideoContainer:{
			position: `absolute`,
			top: `50px`,
			right: `50px`
		}
	},
	'1': {
		container:{
			height: `100%`,
			width: `100%`,
			position: `relative`
		},
		video:{
			width: `100%`,
		},
		videoContainer:{
			width: `100%`,
			height: `100%`
		},
		localVideo:{
			width: `200px`,
			height: `auto`
		},
		localVideoContainer:{
			position: `absolute`,
			top: `50px`,
			right: `50px`
		}
	},
	'2': {
		container:{
			height: `100%`,
			width: `100%`,
			display: `flex`,
			position: `relative`
		},
		video:{
			width: `100%`,
			height: `100%`,
			objectFit: `cover`
		},
		videoContainer:{
			width: `100%`,
			height: `100%`
		},
		localVideo:{
			width: `200px`,
			height: `auto`
		},
		localVideoContainer:{
			position: `absolute`,
    		right: `calc(50% - 100px)`
		}
	},
	'3': {
		container:{
			display: `grid`,
			gridTemplateColumns: `50% 50%`
		},
		video:{
			width: `100%`,
			height: `100%`,
			objectFit: `cover`
		},
		localVideo:{
			height: `100%`
		},
		localVideoContainer:{
			
		}
	},
	'4': {
		container:{
			display: `grid`,
			gridTemplateColumns: `50% 50%`,
			gridTemplateRows: `50% 50%`,
    		height: `100%`
		},
		video:{
			width: `100%`,
			height: `100%`,
			objectFit: `cover`
		},
		localVideo:{
			height: `100%`,
		},
		localVideoContainer:{
		    position: `absolute`,
			top: `calc(50% - 80px)`,
			left: `calc(50% + 70px)`,
			borderRadius: `200px`,
			overflow: `hidden`,
			width: `160px`,
			height: `160px`
		}
	},
	'5': {
		container:{
			display: `grid`,
			gridTemplateColumns: `33.3% 33.3% 33.3%`,
			gridTemplateRows: `50% 50%`,
    		height: `100%`
		},
		video:{
			width: `100%`,
			height: `100%`,
			objectFit: `cover`
		},
		localVideo:{
			height: `100%`
		},
		localVideoContainer:{
			
		}
	}
};
class VideoBox extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
			selectedRoom: null,
			cameras: [],
			rooms: [],
			cameraId: null
		};
  }

  componentDidMount() {
		this.getCameras()
		.then((cameras) => {
			this.setState({
				cameras: cameras.map(({ deviceId, label }) => {
					return {
						label,
						value:deviceId
					}
				})
			});
		});
  }
  
  getCustomStyles = (nParticipants) => {
		const key = String(nParticipants);
		const s = styles[key];
		return s || {};
  }
  
  selectRoom = (room_id) => {
		this.setState({
			selectedRoom: null
		}, () => {
			this.setState({
				selectedRoom: room_id
			});
		});
  }
  
  onRooms = (rooms) => {
		this.setState({
			rooms
		});
  }
  
  getCameras = async () => {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const cameras = devices.filter((d) => d.kind==="videoinput");
		return cameras;
	}

  render() {
    return (
        <div id="box" className="video-box">
          <JanusVideoRoom
            server={server}
            room={this.state.selectedRoom}
            cameraId={this.state.cameraId}
            user_id={user_id}
            onRooms={this.onRooms}
            onError={(err) => console.log(err)}
            mediaConstraints={{
              video: true,
              audio: true,
              data: true
            }}
            getCustomStyles={(n) => {
              const customStyles = this.getCustomStyles(n);
              return customStyles;
            }}
            
            renderContainer={(children) => {
              const customStyles = this.getCustomStyles(1);
          
              return (
                <div style={customStyles.container}>
                  {children}
                </div>
              );
              
            }}
            renderStream={(subscriber) => {
              const customStyles = this.getCustomStyles(1);
              return (
                <div 
                  key={`subscriber-${subscriber.id}`}
                  style={customStyles.videoContainer}
                >
                  <Video
                    id={subscriber.id}
                    muted={false}
                    style={customStyles.video}
                    stream={subscriber.stream}
                  />
                </div>
              );
            }}
            renderLocalStream={(publisher) => {
              const customStyles = this.getCustomStyles(1);
              return (
                <div style={customStyles.localVideoContainer}>
                  <Video
                    id={publisher.id}
                    muted={true}
                    style={customStyles.localVideo}
                    stream={publisher.stream}
                  />
                </div>
              );
            }}
            
          />
        </div>
      );
    };
  }

  export default VideoBox;