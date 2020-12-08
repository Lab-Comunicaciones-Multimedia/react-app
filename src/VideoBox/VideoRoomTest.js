import React, { Component } from 'react';
import {Janus} from 'janusjs-sdk'
import Button from '@material-ui/core/Button'
import CssBaseline from '@material-ui/core/CssBaseline';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Grid from '@material-ui/core/Grid';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import {VideoIcon,VideoOffIcon,AudioIcon,AudioOffIcon} from '../img/svgIcons'
import NativeSelect from '@material-ui/core/NativeSelect';

class VideoRoomTest extends Component {

    constructor(props){
        super(props);
        this.state={
            localVideoSrc:null,
            remoteVideoSrc:null,
            videoEnable:true,
            audioEnable:true,
            bitrateValue:100,
            bStartEchoTestButton:false,
        }

        // create a ref to store the video DOM element
        this.localVideo = React.createRef();
        this.remoteVideo=React.createRef();
        this.localVideo=React.createRef();
        this.setLocalVideoRef = element => {
            this.localVideo = element;
        };
        /*this.setRemoteVideoRef = element =>{
            this.remoteVideo=element;
        }*/

        this.server = ["ws://localhost:8188","http://localhost:8088/janus"];
        this.opaqueId = "videoroomtest-"+Janus.randomString(12);
        this.echotest = null;
        this.janus=null;
        this.bitrateTimer=null;
        this.bitrateNow=null;
        this.WidthAndHeight="";
        this.bStartEchoTest=false;
        this.reconnectTimer=null;//断线重连机制

        this.feeds = [];

        this.myusername= null;
        this.myroom= 1234; //Demo Room
        this.myid = null;
        this.mystream = null;
        // We use this other ID just to map our subscriptions to us
        this.mypvtid = null;

        this.handleStart=this.handleStart.bind(this);
        this.handleVideoOn=this.handleVideoOn.bind(this);
        this.handleAudioOn=this.handleAudioOn.bind(this);
        this.handleSelectChange=this.handleSelectChange.bind(this);
    }

    componentDidMount() {
        Janus.init({
            debug: ["debug","log"], 
            // eslint-disable-next-line react-hooks/rules-of-hooks
            dependencies: Janus.useDefaultDependencies(),
            callback: function() {

            }});
    }

    componentWillUnmount(){
        if(this.bitrateTimer&&this.janus){
            if(this.reconnectTimer){
                clearInterval(this.reconnectTimer);
            }
            if(this.bitrateTimer){
                clearInterval(this.bitrateTimer);
            }
            this.janus.destroy();
        }
    }

    handleVideoOn(){
        this.echotest.send({"message": { "video": !this.state.videoEnable }});
        this.setState({videoEnable: !this.state.videoEnable});
    }

    handleAudioOn(){
        this.echotest.send({"message": { "audio": !this.state.audioEnable }});
        this.setState({audioEnable: !this.state.audioEnable});
    }

    handleSelectChange = name => event => {
        this.setState({ [name]: event.target.value });
        this.echotest.send({"message": { "bitrate": event.target.value }});
    };



    handleStart(){
        // if(this.bStartEchoTest){
        //     clearInterval(this.bitrateTimer);
        //     this.janus.destroy();
        //     this.bitrateTimer=null;
        //     this.janus=null;
        //     this.bStartEchoTest=false;
        //     this.setState({bStartEchoTestButton:!this.state.bStartEchoTestButton});
        //     return;
        // }

        this.bStartEchoTest=true;
        this.setState({bStartEchoTestButton:!this.state.bStartEchoTestButton});

        if(!Janus.isWebrtcSupported()) {
            alert("No WebRTC support... ");
            return;
        }
        var that=this;
        // Create session
        this.janus = new Janus(
            {
                server: this.server,
                // No "iceServers" is provided, meaning janus.js will use a default STUN server
                // Here are some examples of how an iceServers field may look like to support TURN
                // 		iceServers: [{urls: "turn:yourturnserver.com:3478", username: "janususer", credential: "januspwd"}],
                // 		iceServers: [{urls: "turn:yourturnserver.com:443?transport=tcp", username: "janususer", credential: "januspwd"}],
                // 		iceServers: [{urls: "turns:yourturnserver.com:443?transport=tcp", username: "janususer", credential: "januspwd"}],
                // Should the Janus API require authentication, you can specify either the API secret or user token here too
                //		token: "mytoken",
                //	or
                //		apisecret: "serversecret",
                success: function() {
                    // Attach to echo test plugin
                    that.janus.attach(
                        {
                            plugin: "janus.plugin.videoroom",
                            opaqueId: this.opaqueId,
                            success: function(pluginHandle) {
                                that.echotest = pluginHandle;
                                Janus.log("Plugin attached! (" + that.echotest.getPlugin() + ", id=" + that.echotest.getId() + ")");
                                Janus.log("  -- This is a publisher/manager");
                                // Prepare the username registration
                                that.registerUsername(`user-${Math.floor(1000000*Math.random())}`);
                                Janus.log("Username: " + that.myusername + "\nmyroom: "+that.myroom);
                                // Negotiate WebRTC
                                // var body = { "audio": true, "video": true };
                                // Janus.debug("Sending message (" + JSON.stringify(body) + ")");
                                // that.echotest.send({"message": body});
                                // Janus.debug("Trying a createOffer too (audio/video sendrecv)");
                                // that.echotest.createOffer(
                                //     {
                                //         // No media provided: by default, it's sendrecv for audio and video
                                //         media: { data: true },	// Let's negotiate data channels as well
                                //         // If you want to test simulcasting (Chrome and Firefox only), then
                                //         // pass a ?simulcast=true when opening this demo page: it will turn
                                //         // the following 'simulcast' property to pass to janus.js to true
                                //         simulcast: false,
                                //         success: function(jsep) {
                                //             Janus.debug("Got SDP!");
                                //             Janus.debug(jsep);
                                //             that.echotest.send({"message": body, "jsep": jsep});
                                //         },
                                //         error: function(error) {
                                //             Janus.error("WebRTC error:", error);
                                //             alert("WebRTC error... " + JSON.stringify(error));
                                //         }
                                //     });
                            },
                            error: function(error) {
                                console.error("  -- Error attaching plugin...", error);
                                alert("Error attaching plugin... " + error);
                            },
                            iceState: function(state) {
                                Janus.log("ICE state changed to " + state);
                                if(state == 'completed'){
                                    if(that.reconnectTimer){
                                        clearInterval(that.reconnectTimer);
                                        that.reconnectTimer=null;
                                    }
                                }
                                if(state == 'failed'){
                                    that.reconnectTimer = setInterval(function() {
                                        that.bStartEchoTest=false;
                                        that.handleStart();
                                    }, 5000);
                                }
                            },
                            mediaState: function(medium, on) {
                                Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
                            },
                            webrtcState: function(on) {
                                Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                            },
                            slowLink: function(uplink, nacks) {
                                Janus.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
                                    " packets on this PeerConnection (" + nacks + " NACKs/s " + (uplink ? "received" : "sent") + ")");
                            },
                            onmessage: function(msg, jsep) {
                                Janus.debug(" ::: Got a message :::");
                                console.log(msg);
                                let event = msg["videoroom"];
                                Janus.debug("Event: " + event);
                                if(event) {
                                    if(event === "joined") {
                                        // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                                        that.myid = msg["id"];
                                        that.mypvtid = msg["private_id"];
                                        Janus.log("Successfully joined room " + msg["room"] + " with ID " + that.myid);
    
                                        console.log("BEFORE");
                                        that.publishOwnFeed(true);
                                        console.log("AFTER");
    
                                        // Any new feed to attach to?
                                        if(msg["publishers"]) {
                                            let list = msg["publishers"];
                                            Janus.debug("Got a list of available publishers/feeds:", list);
                                            for(let f in list) {
                                                let id = list[f]["id"];
                                                let display = list[f]["display"];
                                                let audio = list[f]["audio_codec"];
                                                let video = list[f]["video_codec"];
                                                Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                                that.newRemoteFeed(id, display, audio, video);
                                            }
                                        }
                                    } else if(event === "destroyed") {
                                        // The room has been destroyed
                                        Janus.warn("The room has been destroyed!");
                                    } else if(event === "event") {
                                        // Any new feed to attach to?
                                        if(msg["publishers"]) {
                                            let list = msg["publishers"];
                                            Janus.debug("Got a list of available publishers/feeds:", list);
                                            for(let f in list) {
                                                let id = list[f]["id"];
                                                let display = list[f]["display"];
                                                let audio = list[f]["audio_codec"];
                                                let video = list[f]["video_codec"];
                                                Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                                that.newRemoteFeed(id, display, audio, video);
                                            }
                                        } else if(msg["leaving"]) {
                                            // One of the publishers has gone away?
                                            var leaving = msg["leaving"];
                                            Janus.log("Publisher left: " + leaving);
                                            var remoteFeed = null;
                                            for(var i=1; i<6; i++) {
                                                if(that.feeds[i] && that.feeds[i].rfid == leaving) {
                                                    remoteFeed = that.feeds[i];
                                                    break;
                                                }
                                            }
                                            if(remoteFeed != null) {
                                                Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                                                let remoteVideo = document.getElementById(`remote-${remoteFeed.rfindex}`);
                                                remoteVideo.remove();
                                                that.feeds[remoteFeed.rfindex] = null;
                                                remoteFeed.detach();
                                            }
                                        } else if(msg["unpublished"]) {
                                            // One of the publishers has unpublished?
                                            var unpublished = msg["unpublished"];
                                            Janus.log("Publisher left: " + unpublished);
                                            if(unpublished === 'ok') {
                                                // That's us
                                                that.echotest.hangup();
                                                return;
                                            }
    
                                            var remoteFeed = null;
                                            for(var i=1; i<6; i++) {
                                                if(that.feeds[i] && that.feeds[i].rfid == unpublished) {
                                                    remoteFeed = that.feeds[i];
                                                    break;
                                                }
                                            }
    
                                            if(remoteFeed != null) {
                                                Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                                                let remoteVideo = document.getElementById(`remote-${remoteFeed.rfindex}`);
                                                remoteVideo.remove();
                                                that.feeds[remoteFeed.rfindex] = null;
                                                remoteFeed.detach();
                                            }
                                        } else if(msg["error"]) {
                                            if(msg["error_code"] === 426) {
                                                // This is a "no such room" error: give a more meaningful description
                                                console.error(
                                                    "<p>Apparently room <code>" + that.myroom + "</code> (the one this demo uses as a test room) " +
                                                    "does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.jcfg</code> " +
                                                    "configuration file? If not, make sure you copy the details of room <code>" + that.myroom + "</code> " +
                                                    "from that sample in your current configuration file, then restart Janus and try again."
                                                );
                                            } else {
                                                console.error(msg["error"]);
                                            }
                                        }
                                    }
                                }
                                if(jsep !== undefined && jsep !== null) {
                                    Janus.debug("Handling SDP as well...");
                                    Janus.debug(jsep);
                                    that.echotest.handleRemoteJsep({jsep: jsep});
                                }
                                var result = msg["result"];
                                if(result !== null && result !== undefined) {
                                    if(result === "done") {
                                        // The plugin closed the echo test
                                        alert("The Echo Test is over");
                                        return;
                                    }
                                    // Any loss?
                                    var status = result["status"];
                                    if(status === "slow_link") {
                                        //~ var bitrate = result["bitrate"];
                                        //~ toastr.warning("The bitrate has been cut to " + (bitrate/1000) + "kbps", "Packet loss?", {timeOut: 2000});
                                    }
                                }
                                // Is simulcast in place?
                                var substream = msg["substream"];
                                var temporal = msg["temporal"];
                                if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {

                                }
                            },
                            onlocalstream: function(stream) {
                                Janus.debug(" ::: Got a local stream :::");
                                Janus.debug(stream);

                                Janus.attachMediaStream(that.localVideo.current, stream);

                                if(that.echotest.webrtcStuff.pc.iceConnectionState !== "completed" &&
                                    that.echotest.webrtcStuff.pc.iceConnectionState !== "connected") {
                                    // No remote video yet
                                }
                                var videoTracks = stream.getVideoTracks();
                                if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
                                    // No webcam
                                } else {

                                }
                            },
                            onremotestream: function(stream) {
                                // The publisher stream is sendonly, we don't expect anything here
                            },
                            ondataopen: function(data) {
                                Janus.log("The DataChannel is available!");
                            },
                            ondata: function(data) {
                                Janus.debug("We got data from the DataChannel! " + data);
                            },
                            oncleanup: function() {
                                Janus.log(" ::: Got a cleanup notification :::");
                            }
                        });
                },
                error: function(error) {
                    Janus.error(error);
                    alert(error, function() {
                        window.location.reload();
                    });
                },
                destroyed: function() {
                    window.location.reload();
                }
            });
    }
     registerUsername(username) {

        var register = {
            request: "join",
            room: this.myroom,
            ptype: "publisher",
            display: username
        };
        this.myusername = username;
        this.echotest.send({ message: register });
    }

     publishOwnFeed(useAudio) {
        var that=this;
        // Publish our stream
        this.echotest.createOffer({
            // Add data:true here if you want to publish datachannels as well
            media: {
                audioRecv: false,
                videoRecv: false,
                audioSend: useAudio,
                videoSend: true
            },	// Publishers are sendonly
            // If you want to test simulcasting (Chrome and Firefox only), then
            // pass a ?simulcast=true when opening this demo page: it will turn
            // the following 'simulcast' property to pass to janus.js to true
            // simulcast: doSimulcast,
            // simulcast2: doSimulcast2,
            success: function(jsep) {
                Janus.debug("Got publisher SDP!", jsep);
                var publish = {
                    request: "configure",
                    audio: useAudio,
                    video: true
                };
                // You can force a specific codec to use when publishing by using the
                // audiocodec and videocodec properties, for instance:
                // 		publish["audiocodec"] = "opus"
                // to force Opus as the audio codec to use, or:
                // 		publish["videocodec"] = "vp9"
                // to force VP9 as the videocodec to use. In both case, though, forcing
                // a codec will only work if: (1) the codec is actually in the SDP (and
                // so the browser supports it), and (2) the codec is in the list of
                // allowed codecs in a room. With respect to the point (2) above,
                // refer to the text in janus.plugin.videoroom.jcfg for more details
                that.echotest.send({
                    message: publish,
                    jsep: jsep
                });
            },
            error: function(error) {
                Janus.error("WebRTC error:", error);
                if(useAudio) {
                    this.publishOwnFeed(false);
                } else {
                    console.error(error);
                }
            }
        });
    }

    unpublishOwnFeed() {
        // Unpublish our stream
        var unpublish = {
            request: "unpublish"
        };
        
        this.echotest.send({ message: unpublish });
    }
    
    newRemoteFeed(id, display, audio, video) {
        console.log("newRemoteFeed");
        // A new feed has been published, create a new plugin handle and attach to it as a subscriber
        var remoteFeed = null;
        let that = this;
        this.janus.attach(
            {
                plugin: "janus.plugin.videoroom",
                opaqueId: that.opaqueId,
                success: function(pluginHandle) {
                    remoteFeed = pluginHandle;
                    // remoteFeed.simulcastStarted = false;
                    Janus.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
                    Janus.log("  -- This is a subscriber");
                    // We wait for the plugin to send us an offer
                    var subscribe = {
                        request: "join",
                        room: that.myroom,
                        ptype: "subscriber",
                        feed: id,
                        private_id: that.mypvtid
                    };
                    // In case you don't want to receive audio, video or data, even if the
                    // publisher is sending them, set the 'offer_audio', 'offer_video' or
                    // 'offer_data' properties to false (they're true by default), e.g.:
                    // 		subscribe["offer_video"] = false;
                    // For example, if the publisher is VP8 and this is Safari, let's avoid video
                    if(Janus.webRTCAdapter.browserDetails.browser === "safari" &&
                            (video === "vp9" || (video === "vp8" && !Janus.safariVp8))) {
                        if(video)
                            video = video.toUpperCase()
    
                        subscribe["offer_video"] = false;
                    }
                    
                    remoteFeed.videoCodec = video;
                    remoteFeed.send({
                        message: subscribe
                    });
                },
                error: function(error) {
                    Janus.error("  -- Error attaching plugin...", error);
                },
                onmessage: function(msg, jsep) {
                    Janus.debug(" ::: Got a message (subscriber) :::", msg);
                    var event = msg["videoroom"];
                    Janus.debug("Event: " + event);
                    if(msg["error"]) {
                        alert(msg["error"]);
                    } else if(event) {
                        if(event === "attached") {
                            // Subscriber created and attached
                            for(var i=1;i<6;i++) {
                                if(!that.feeds[i]) {
                                    that.feeds[i] = remoteFeed;
                                    remoteFeed.rfindex = i;
                                    break;
                                }
                            }
                            remoteFeed.rfid = msg["id"];
                            remoteFeed.rfdisplay = msg["display"];
                            // if(!remoteFeed.spinner) {
                            // 	var target = document.getElementById('videoremote'+remoteFeed.rfindex);
                            // 	remoteFeed.spinner = new Spinner({top:100}).spin(target);
                            // } else {
                            // 	remoteFeed.spinner.spin();
                            // }
                            Janus.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
                            
                        } else if(event === "event") {
                            // Check if we got a simulcast-related event from this publisher
                            // var substream = msg["substream"];
                            // var temporal = msg["temporal"];
                            // if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
                            // 	if(!remoteFeed.simulcastStarted) {
                            // 		remoteFeed.simulcastStarted = true;
                            // 		// Add some new buttons
                            // 		addSimulcastButtons(remoteFeed.rfindex, remoteFeed.videoCodec === "vp8" || remoteFeed.videoCodec === "h264");
                            // 	}
                            // 	// We just received notice that there's been a switch, update the buttons
                            // 	updateSimulcastButtons(remoteFeed.rfindex, substream, temporal);
                            // }
                        } else {
                            // What has just happened?
                        }
                    }
                    if(jsep) {
                        Janus.debug("Handling SDP as well...", jsep);
                        // Answer and attach
                        remoteFeed.createAnswer({
                            jsep: jsep,
                            // Add data:true here if you want to subscribe to datachannels as well
                            // (obviously only works if the publisher offered them in the first place)
                            media: {
                                audioSend: false,
                                videoSend: false
                            },	// We want recvonly audio/video, and data channel
                            success: function(jsep) {
                                Janus.debug("Got SDP!", jsep);
                                var body = {
                                    request: "start",
                                    room: that.myroom
                                };
                                remoteFeed.send({
                                    message: body,
                                    jsep: jsep
                                });
                            },
                            error: function(error) {
                                Janus.error("WebRTC error:", error);
                            }
                        });
                    }
                },
                iceState: function(state) {
                    Janus.log("ICE state of this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") changed to " + state);
                },
                webrtcState: function(on) {
                    Janus.log("Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (on ? "up" : "down") + " now");
                },
                onlocalstream: function(stream) {
                    // The subscriber stream is recvonly, we don't expect anything here
                },
                onremotestream: function(stream) {
                    Janus.debug("Remote feed #" + remoteFeed.rfindex + ", stream:", stream);
                    // var addButtons = false;
                    let remoteVideo = document.getElementById(`remote-${remoteFeed.rfindex}`)
                    if(!remoteVideo) {
                        remoteVideo = document.createElement("video");
                        remoteVideo.id = `remote-${remoteFeed.rfindex}`;
                        document.getElementById("videocall").appendChild(remoteVideo);
                        remoteVideo.load();
                        remoteVideo.autoplay = true;
                        remoteVideo.style = styles.video;
                    }
                    
                    Janus.attachMediaStream(remoteVideo, stream);

                    console.log("DOOOOOOOOOOOOOOOOONEEEEEEEEEEEEEEEE")
                    
                },
                ondata: function(data) {
    
                },
                oncleanup: function() {
                    let remoteVideo = document.getElementById(`remote-${remoteFeed.rfindex}`);
                    remoteVideo.remove();
                }
            });
    }

    render() {
        return (
            <div>
                {/*<CssBaseline />*/}
                <Grid container xs={12} spacing={6} justify="flex-end"  alignItems="flex-end" direction="row">
                    <Grid item xs={6} >
                        {/*<Card key='1' style={styles.card}>*/}
                        <div id="videocall">
                            <video style={styles.video} ref={this.localVideo} id="localVideo" autoPlay="true"/>
                            {/* <video style={styles.video} ref={this.remoteVideo} id="remoteVideo" autoPlay="true"/> */}
                            {
                                // stuff from echotest
                                
                                /*<CardActions style={styles.button}>
                                <IconButton onClick={this.handleVideoOn} color="primary" aria-label="Add an alarm">
                                    {this.state.videoEnable?<VideoIcon></VideoIcon>:<VideoOffIcon></VideoOffIcon>}
                                </IconButton>
                                <IconButton onClick={this.handleAudioOn} color="secondary" aria-label="Add an alarm2">
                                    {this.state.audioEnable?<AudioIcon></AudioIcon>:<AudioOffIcon></AudioOffIcon>}
                                </IconButton>
                                <NativeSelect
                                    value={this.state.bitrateValue}
                                    onChange={this.handleSelectChange('bitrateValue')}
                                    name="bitrate"
                                    style={styles.selectEmpty}
                                >
                                    <option value={0}>No limit</option>
                                    <option value={128}>Cap to 128kbit</option>
                                    <option value={256}>Cap to 256kbit</option>
                                    <option value={512}>Cap to 512kbit</option>
                                    <option value={1025}>Cap to 1mbit</option>
                                    <option value={1500}>Cap to 1.5mbit</option>
                                    <option value={2000}>Cap to 2mbit</option>
                                </NativeSelect>
                            </CardActions>*/}
                        {/*</Card>*/}
                        </div>
                    </Grid>
                    {/*<Grid item xs={6}>
                        <Card key='2' style={styles.card}>
                            <video style={styles.video} ref={this.remoteVideo} id="remoteVideo" autoPlay="true"/>
                            <CardActions style={styles.button}>
                                <IconButton onClick={this.handleVideoOn} color="primary" aria-label="Add an alarm">
                                    {this.state.videoEnable?<VideoIcon></VideoIcon>:<VideoOffIcon></VideoOffIcon>}
                                </IconButton>
                                <IconButton onClick={this.handleAudioOn} color="secondary" aria-label="Add an alarm2">
                                    {this.state.audioEnable?<AudioIcon></AudioIcon>:<AudioOffIcon></AudioOffIcon>}
                                </IconButton>
                                <label>{this.state.WidthAndHeight}</label>
                                <label>{this.state.bitrateNow}</label>
                            </CardActions>
                        </Card>
                    </Grid>*/}
                </Grid>
                <Grid container style={styles.root} xs={12} spacing={3} justify="center" zeroMinWidth={0}>
                    <Grid item xs={12}>
                        <Button color="primary" variant="contained" onClick={this.handleStart}>
                            {this.state.bStartEchoTestButton?'stop':'start'}
                        </Button>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

const styles = {
    root: {
        flexGrow: 1,
        textAlign: 'center',
    },
    card: {
        maxWidth: 640,
        
    },
    video: {
        paddingTop: 5, // 16:9
        width:480,
        height:480,
    },

    button: {
        paddingBottom: 5, // 16:9
    },

    selectEmpty: {
        marginTop:  2,
    },
};

export default VideoRoomTest;
